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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
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

    // Auto-send forgot password email
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

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

    // Auto-enroll PAID students (existing code)
    if (student_type === "PAID") {
      const defaultSection = await prisma.section.findFirst({
        where: { status: "Published" },
        orderBy: { dateCreated: "desc" },
      });

      if (defaultSection) {
        await prisma.enrollment.create({
          data: {
            userId: user.id,
            sectionId: defaultSection.id,
          },
        });
      }
    }

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
