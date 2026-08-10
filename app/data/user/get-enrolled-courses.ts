"use server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "./require-user";

export async function getEnrolledCourses() {
  const user = await requireUser();

  const data = await prisma.user.findMany({
    where: {
      id: user.user.id,
    },
    select: {
      id: true,
      fname: true,
      lname: true,
      email: true,
      enrollments: {
        orderBy: {
          section: {
            dateCreated: "asc", // Section dateCreated අනුව sort
          },
        },
        select: {
          section: {
            select: {
              id: true,
              title: true,
              smallDescription: true,
              fileKey: true,
              slug: true,

              chapters: {
                select: {
                  id: true,
                  title: true,
                  position: true,
                  topics: {
                    select: {
                      id: true,
                      title: true,
                      position: true,
                      lessons: {
                        select: {
                          id: true,
                          title: true,
                          position: true,
                          thumbnailUrl: true,
                          videoUrl: true,
                          videoDuration: true, // required by your type
                          LessonProgress: {
                            where: { userId: user.user.id },
                            select: {
                              id: true,
                              completed: true,
                              LessonId: true,
                            },
                          },
                        },
                        orderBy: { position: "asc" },
                      },
                    },
                    orderBy: { position: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return data;
}

export type EnrolledCourseType = Awaited<
  ReturnType<typeof getEnrolledCourses>
>[0];

export type SectionType = EnrolledCourseType["enrollments"][0]["section"];
