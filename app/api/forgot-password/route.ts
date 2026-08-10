import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { mailTransporter } from "@/lib/mail";
import crypto from "crypto";
import { getResetPasswordEmailHtml } from "@/lib/email-template";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "No user found with this email" },
        { status: 404 }
      );
    }

    // Generate token + expiry
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to DB
    await prisma.user.update({
      where: { email },
      data: {
        verification_code: token,
        reset_token_expiry: expires,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    // Generate HTML using your template
    const html = getResetPasswordEmailHtml(email, resetUrl);

    // Send email
    await mailTransporter.sendMail({
      from: `"TradingEdge LMS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
