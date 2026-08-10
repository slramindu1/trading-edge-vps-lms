import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { mailTransporter } from "@/lib/mail";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // 1. Verify OTP
    const verification = await prisma.deviceVerification.findFirst({
      where: { email, otp },
      orderBy: { createdAt: "desc" }
    });

    if (!verification) {
      return NextResponse.json({ error: "Invalid OTP code. Please try again." }, { status: 400 });
    }

    if (new Date() > verification.expiresAt) {
      await prisma.deviceVerification.delete({ where: { id: verification.id } });
      return NextResponse.json({ error: "OTP has expired. Please log in again." }, { status: 400 });
    }

    // OTP is valid - delete it so it cannot be reused
    await prisma.deviceVerification.delete({ where: { id: verification.id } });

    // 2. Fetch user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Register this as a trusted device
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    const newDeviceId = crypto.randomUUID();

    await prisma.userDevice.create({
      data: {
        userId: user.id,
        deviceId: newDeviceId,
        userAgent: ua,
        ipAddress: ip,
      }
    });

    // 4. Single Device Enforcement - Logout all previous sessions
    const securityEnabled = await isFeatureEnabled("security-system");
    
    if (securityEnabled) {
      const existingSessions = await prisma.userSession.findMany({
        where: { userId: user.id },
      });

      if (existingSessions.length > 0) {
        await prisma.userSession.deleteMany({ where: { userId: user.id } });

        try {
          await mailTransporter.sendMail({
            from: `"Trading Edge LMS" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: "Security Alert: New Device Login",
            html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;padding:40px;border-radius:12px;">
                <h2 style="color:#ffffff;font-size:22px;font-weight:600;margin-bottom:8px;">New Device Login</h2>
                <p style="color:#a0a0a0;font-size:15px;margin-bottom:24px;">Your account was verified and logged in from a new device.</p>
                <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px;">
                  <p style="color:#a0a0a0;font-size:13px;margin:0 0 4px;">Time</p>
                  <p style="color:#ffffff;font-size:15px;font-weight:500;margin:0 0 12px;">${new Date().toLocaleString("en-GB",{dateStyle:"full",timeStyle:"short"})}</p>
                  <p style="color:#a0a0a0;font-size:13px;margin:0 0 4px;">IP Address</p>
                  <p style="color:#ffffff;font-size:15px;font-weight:500;margin:0;">${ip}</p>
                </div>
                <p style="color:#a0a0a0;font-size:14px;line-height:1.6;">Your previous session was signed out. If this wasn't you, contact us immediately.</p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error("Email send failed:", emailErr);
        }
      }
    }

    // 5. Create new session
    const sessionToken = crypto.randomUUID();

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: sessionToken,
        ipAddress: ip,
        userAgent: ua,
      },
    });

    // 6. Set cookies
    const cookieStore = await cookies();

    // Long-lived device trust cookie (10 years)
    cookieStore.set("device_id", newDeviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 10,
      path: "/",
    });

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
      message: "Device verified. Login successful.",
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
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
