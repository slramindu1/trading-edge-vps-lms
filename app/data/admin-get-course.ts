import "server-only";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function adminGetCourse(id: string) {
  const data = await prisma.section.findUnique({
    where: { id },
    include: {
      chapters: {
        include: {
          lessons: true,
        },
      },
      enrollments: {
        include: {
          user: {
            select: {
              email: true,
              user_type_id: true,
            },
          },
        },
      },
    },
  });

  if (!data) notFound();

  // 🎯 only students (user_type_id = 2)
  const accessibleUsers = data.enrollments
    .filter((e) => e.user.user_type_id === 2)
    .map((e) => e.user.email);

  return {
    ...data,
    accessibleUsers, // ⭐ THIS IS THE KEY
  };
}

export type AdminCourseSingularType = Awaited<
  ReturnType<typeof adminGetCourse>
>;

