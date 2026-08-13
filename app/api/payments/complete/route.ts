import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

// Initialize Prisma client
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, studentEmail, studentName } = body;

    if (!paymentId || !studentEmail) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🎯 Completing payment:", { paymentId, studentEmail });

    // Update payment status to COMPLETED
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { 
        status: "COMPLETED",
      },
    });

    // Update user to mark as paid
    try {
      await prisma.user.update({
        where: { email: studentEmail },
        data: { 
          student_type: "PAID",
          is_paid: true,
          payment_date: new Date(),
          profile_completed: true,
          profile_updated_at: new Date(),
        },
      });
      
      console.log("✅ User marked as paid:", studentEmail);
    } catch (userError) {
      console.warn("⚠️ Could not update user, may not exist yet:", userError);
    }

    // Auto-enroll in all published sections
    try {
      const user = await prisma.user.findUnique({
        where: { email: studentEmail },
      });

      if (user) {
        const publishedSections = await prisma.section.findMany({
          where: { status: "Published" },
        });

        const enrollments = publishedSections.map(section => ({
          userId: user.id,
          sectionId: section.id,
        }));

        if (enrollments.length > 0) {
          await prisma.enrollment.createMany({
            data: enrollments,
            skipDuplicates: true,
          });
          
          console.log(`✅ Enrolled in ${enrollments.length} published sections`);
        }
      }
    } catch (enrollError) {
      console.warn("⚠️ Could not auto-enroll:", enrollError);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Payment completed successfully",
      payment,
    });
  } catch (err) {
    console.error("❌ Complete payment error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to complete payment" },
      { status: 500 }
    );
  }
}