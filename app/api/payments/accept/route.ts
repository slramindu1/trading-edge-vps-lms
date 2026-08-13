import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mailTransporter } from "@/lib/mail";
import { getResetPasswordEmailHtml } from "@/lib/email-template";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const email = searchParams.get("email");
    const fullName = searchParams.get("fullName");

    console.log("📧 Payment Accept Request:", { paymentId, email, fullName });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    if (!paymentId || !email || !fullName) {
      return NextResponse.redirect(`${baseUrl}/admin/student?error=missing_params`);
    }

    // Verify payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.redirect(`${baseUrl}/admin/student?error=payment_not_found`);
    }

    if (payment.status === "COMPLETED") {
      // Already processed — redirect safely without double-activating
      return NextResponse.redirect(`${baseUrl}/admin/student?info=already_approved`);
    }

    // Split fullName into fname + lname
    const nameParts = fullName.trim().split(/\s+/);
    const fname = nameParts[0] || fullName;
    const lname = nameParts.slice(1).join(" ") || "";

    // Find existing user (created at checkout email-verify step)
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let userId: string;

    if (existingUser) {
      // Update the existing placeholder account → activate + mark as paid
      await prisma.user.update({
        where: { email },
        data: {
          fname,
          lname,
          status_id: 1,          // Active
          student_type: "PAID",
          is_paid: true,
          payment_date: new Date(),
          profile_completed: true,
          profile_updated_at: new Date(),
        },
      });
      userId = existingUser.id;
      console.log("✅ Existing user activated:", email);
    } else {
      // Fallback: user was never created (edge case), create them now
      const newUser = await prisma.user.create({
        data: {
          fname,
          lname,
          email,
          user_type_id: 2,
          status_id: 1,
          student_type: "PAID",
          is_paid: true,
          payment_date: new Date(),
          profile_completed: true,
        },
      });
      userId = newUser.id;
      console.log("✅ New user created:", email);
    }

    // Enroll in ALL published sections
    try {
      const publishedSections = await prisma.section.findMany({
        where: { status: "Published" },
      });

      const enrollments = publishedSections.map((section) => ({
        userId,
        sectionId: section.id,
      }));

      if (enrollments.length > 0) {
        await prisma.enrollment.createMany({
          data: enrollments,
          skipDuplicates: true,
        });
        console.log(`✅ Enrolled in ${enrollments.length} published sections`);
      }
    } catch (enrollError) {
      console.warn("⚠️ Could not auto-enroll:", enrollError);
    }

    // Mark payment as COMPLETED
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED" },
    });

    // Send "Set Your Password" email (24h token so student has time)
    try {
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.user.update({
        where: { email },
        data: {
          verification_code: token,
          reset_token_expiry: expires,
        },
      });

      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      const html = getResetPasswordEmailHtml(email, resetUrl);

      await mailTransporter.sendMail({
        from: `"TradingEdge LMS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Welcome! Set Your Password to Access TradingEdge LMS",
        html,
      });

      console.log("✅ Password setup email sent to:", email);
    } catch (mailError) {
      console.warn("⚠️ Could not send password email:", mailError);
    }

    console.log("✅ Payment approved & account activated:", paymentId);

    // Redirect admin to student list
    return NextResponse.redirect(`${baseUrl}/admin/student?success=approved`);

  } catch (err) {
    console.error("❌ Accept payment error:", err);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/admin/student?error=payment_accept_failed`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED" },
    });

    return NextResponse.json({
      success: true,
      message: "Payment approved successfully"
    });
  } catch (err) {
    console.error("Payment approval error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to approve payment" },
      { status: 500 }
    );
  }
}