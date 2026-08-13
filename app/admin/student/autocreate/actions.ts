"use server";
import { prisma } from "@/lib/prisma";
import { StudentSchema, StudentSchemaType } from "@/lib/zodSchemas";
import { ApiResponse } from "@/lib/types";
import { mailTransporter } from "@/lib/mail";
import crypto from "crypto";
import { getResetPasswordEmailHtml } from "@/lib/email-template";

export async function AddStudent(
  data: StudentSchemaType
): Promise<ApiResponse> {
  const validation = StudentSchema.safeParse(data);

  if (!validation.success) {
    console.error("Validation error:", validation.error);
    return { status: "error", message: "Invalid Form Data" };
  }

  try {
    const { fname, lname, email, student_type } = validation.data;

    const user_type_id = validation.data.user_type_id || 2;
    const status_id = validation.data.status_id || 1;

    // ── Bug #1 Fix: If user already exists on a payment flow, update them ──
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (student_type === "PAID") {
        // User paid again or admin re-approved — update to PAID status
        await prisma.user.update({
          where: { email },
          data: {
            student_type: "PAID",
            is_paid: true,
            payment_date: new Date(),
          },
        });

        // If user has no password yet, send a (new) password setup email
        if (!existingUser.password) {
          const token = crypto.randomUUID();
          const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          await prisma.user.update({
            where: { email },
            data: { verification_code: token, reset_token_expiry: expires },
          });
          const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
          const html = getResetPasswordEmailHtml(email, resetUrl);
          await mailTransporter.sendMail({
            from: `"TradingEdge LMS" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Set Your Password",
            html,
          });
        }

        return {
          status: "success",
          message: "Existing student upgraded to PAID successfully!",
        };
      }
      return {
        status: "error",
        message: "A user with this email already exists",
      };
    }


    // Create the user
    const user = await prisma.user.create({
      data: {
        fname,
        lname,
        email,
        user_type_id,
        status_id,
        student_type,
      },
    });

    // ── Bug #3 Fix: Use 24 hours for initial password setup ────────────────
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verification_code: token,
        reset_token_expiry: expires,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    const html = getResetPasswordEmailHtml(email, resetUrl);

    await mailTransporter.sendMail({
      from: `"TradingEdge LMS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Set Your Password",
      html,
    });

    // ── Bug #4 Fix: Enrollment is handled by /api/payments/complete ────────
    // Do NOT enroll here for PAID students — complete/route.ts handles it
    // with all published sections. Only enroll FREE students if needed.

    return {
      status: "success",
      message: "Student added & reset email sent successfully!",
    };
  } catch (err: unknown) {
    console.error("Database error:", err);

    if (typeof err === "object" && err !== null && "code" in err) {
      const prismaErr = err as { code?: string; message?: string };

      if (prismaErr.code === "P2002") {
        return {
          status: "error",
          message: "A user with this email already exists",
        };
      }

      return {
        status: "error",
        message: prismaErr.message || "Failed to add student",
      };
    }

    return { status: "error", message: "Unknown error occurred" };
  }
}
