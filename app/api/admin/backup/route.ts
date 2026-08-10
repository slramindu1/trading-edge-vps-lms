import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/getSession";

export async function GET() {
  try {
    // Authenticate and authorize
    const session = await getSession();
    if (!session || !session.user || session.user.user_type_id !== 1) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch data from all major tables
    const [
      emailVerification,
      users,
      userSessions,
      sections,
      chapters,
      topics,
      coupons,
      payments,
      lessons,
      enrollments,
      lessonProgress,
      pageSections,
      lockedContent,
    ] = await Promise.all([
      prisma.emailVerification.findMany(),
      prisma.user.findMany(),
      prisma.userSession.findMany(),
      prisma.section.findMany(),
      prisma.chapter.findMany(),
      prisma.topic.findMany(),
      prisma.coupon.findMany(),
      prisma.payment.findMany(),
      prisma.lesson.findMany(),
      prisma.enrollment.findMany(),
      prisma.lessonProgress.findMany(),
      prisma.pageSection.findMany(),
      prisma.lockedContent.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        emailVerification,
        users,
        userSessions,
        sections,
        chapters,
        topics,
        coupons,
        payments,
        lessons,
        enrollments,
        lessonProgress,
        pageSections,
        lockedContent,
      },
    };

    // Create a JSON string with 2-space indentation for readability (optional, but good for manual inspection)
    const jsonString = JSON.stringify(backupData, null, 2);

    // Prepare filename with current date
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `trading-edge-backup-${dateStr}.json`;

    // Return as a downloadable file
    return new NextResponse(jsonString, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Database backup failed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
