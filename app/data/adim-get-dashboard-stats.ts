import "server-only";
import { prisma } from "@/lib/prisma";

export async function adminGetDashboardStats() {
  const [totalSignups,PaidMentorshipStudents,totalSections,totalLessons] = await Promise.all([

    //totalSignups
    prisma.user.count(), // paid + free mentoship students 

    //PaidMentorshipStudents
    prisma.user.count({
      where: {
        student_type: "PAID", // Only Mentorship students
      },
    }),

    //totalSections
    prisma.section.count(),

    //totalLessons
    prisma.lesson.count(),
  ]);

  return{
    totalSignups,
    PaidMentorshipStudents,
    totalSections,
    totalLessons,
    
  }
}
