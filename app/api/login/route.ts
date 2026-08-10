import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { mailTransporter } from "@/lib/mail";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status_id === 2) {
      return NextResponse.json({ error: "Account is blocked. Please contact support." }, { status: 403 });
    }

    if (user.status_id === 3) {
      return NextResponse.json({ error: "Account is pending approval. Please wait for admin approval." }, { status: 403 });
    }

    if (!user.password) {
      return NextResponse.json({ error: "No password set for this account. Please contact admin." }, { status: 401 });
    }

    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // ── Device Verification Check ──────────────────────────────────────────
    const securityEnabled = await isFeatureEnabled("security-system");
    
    const cookieStore = await cookies();
    const deviceId = cookieStore.get("device_id")?.value;
    
    let isDeviceVerified = false;
    
    if (securityEnabled && deviceId) {
      const knownDevice = await prisma.userDevice.findUnique({
        where: { deviceId },
      });
      if (knownDevice && knownDevice.userId === user.id) {
        isDeviceVerified = true;
        // Update lastUsed
        await prisma.userDevice.update({
          where: { deviceId },
          data: { lastUsed: new Date() }
        });
      }
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";

    if (securityEnabled && !isDeviceVerified) {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Delete old verification for this email
      await prisma.deviceVerification.deleteMany({
        where: { email: user.email }
      });
      
      await prisma.deviceVerification.create({
        data: {
          email: user.email,
          otp,
          expiresAt
        }
      });
      
      // Send Email
      try {
        await mailTransporter.sendMail({
          from: `"Trading Edge LMS" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: "Verify your new device",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px; border-radius: 12px;">
              <h2 style="color: #ffffff; font-size: 22px; font-weight: 600; margin-bottom: 8px;">Device Verification</h2>
              <p style="color: #a0a0a0; font-size: 15px; margin-bottom: 24px;">A sign-in attempt was blocked from a new device. Use the code below to verify this device.</p>
              
              <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 4px;">${otp}</p>
              </div>
              
              <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #a0a0a0; font-size: 13px; margin: 0 0 4px;">Time</p>
                <p style="color: #ffffff; font-size: 15px; font-weight: 500; margin: 0 0 12px;">${new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}</p>
                
                <p style="color: #a0a0a0; font-size: 13px; margin: 0 0 4px;">IP Address</p>
                <p style="color: #ffffff; font-size: 15px; font-weight: 500; margin: 0;">${ip}</p>
              </div>
              
              <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                This code expires in 10 minutes. If you did not attempt to sign in, please change your password immediately.
              </p>
            </div>
          `,
        });
      } catch (err) {
        console.error("Failed to send OTP email:", err);
      }
      
      return NextResponse.json({ 
        requireVerification: true, 
        email: user.email,
        message: "OTP sent to email for device verification." 
      });
    }

    // ── Single Device Enforcement ──────────────────────────────────────────
    if (securityEnabled) {
      // Check if there's already an active session for this user
      const existingSessions = await prisma.userSession.findMany({
        where: { userId: user.id },
      });

      // If there are existing sessions, invalidate them all and notify
      if (existingSessions.length > 0) {
        await prisma.userSession.deleteMany({ where: { userId: user.id } });

        // Send email to user notifying them of the forced logout
        try {
          await mailTransporter.sendMail({
            from: `"Trading Edge LMS" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: "Security Alert: New Login Detected",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px; border-radius: 12px;">
                <h2 style="color: #ffffff; font-size: 22px; font-weight: 600; margin-bottom: 8px;">Security Alert</h2>
                <p style="color: #a0a0a0; font-size: 15px; margin-bottom: 24px;">A new sign-in was detected on your Trading Edge account.</p>
                
                <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                  <p style="color: #a0a0a0; font-size: 13px; margin: 0 0 4px;">Time</p>
                  <p style="color: #ffffff; font-size: 15px; font-weight: 500; margin: 0;">${new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}</p>
                </div>
                
                <p style="color: #a0a0a0; font-size: 14px; line-height: 1.6;">
                  Your previous session was automatically signed out because <strong style="color: #fff;">Trading Edge LMS only allows one active session per account</strong>. 
                  If this wasn't you, please contact us immediately.
                </p>
                
                <div style="border-top: 1px solid #2a2a2a; margin-top: 32px; padding-top: 20px;">
                  <p style="color: #666; font-size: 12px; margin: 0;">Trading Edge LMS &mdash; Account Security</p>
                </div>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error("Email send failed:", emailErr);
        }
      }
    }

    // Create a new unique session token
    const sessionToken = crypto.randomUUID();

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: sessionToken,
        ipAddress: ip,
        userAgent: ua,
      },
    });
    // ──────────────────────────────────────────────────────────────────────

    cookieStore.set("session_token", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    cookieStore.set("session_key", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        user_type_id: user.user_type_id,
        status_id: user.status_id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Login API is running" });
}