import "server-only";
import { prisma } from "@/lib/prisma";

export async function adminGetEnrollmentStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch users created in last 30 days
  const enrollments = await prisma.user.findMany({
    where: {
      joined_date: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      joined_date: true,
    },
    orderBy: {
      joined_date: "asc",
    },
  });

  // Initialize last 30 days array
  const last30Days: { date: string; enrollments: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last30Days.push({
      date: date.toISOString().split("T")[0],
      enrollments: 0,
    });
  }

  // Count enrollments per day
  enrollments.forEach((enrollment) => {
    const enrollmentDate = enrollment.joined_date.toISOString().split("T")[0];
    const dayIndex = last30Days.findIndex((day) => day.date === enrollmentDate);

    if (dayIndex !== -1) {
      last30Days[dayIndex].enrollments++;
    }
  });

  return last30Days;
}
