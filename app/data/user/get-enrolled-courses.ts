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
                  topics: {
                    select: {
                      lessons: {
                        select: {
                          id: true,
                          LessonProgress: {
                            where: { userId: user.user.id },
                            select: {
                              completed: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  lessons: {
                    select: {
                      id: true,
                      LessonProgress: {
                        where: { userId: user.user.id },
                        select: {
                          completed: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Pre-calculate progress and strip nested massive arrays to prevent 
  // Node.js serialization blocking (causing timeouts/slow loads).
  const optimizedData = data.map((u) => ({
    ...u,
    enrollments: u.enrollments.map((e) => {
      let totalLessons = 0;
      let completedLessons = 0;

      e.section.chapters.forEach((chapter) => {
        chapter.topics.forEach((topic) => {
          topic.lessons.forEach((lesson) => {
            totalLessons++;
            if (lesson.LessonProgress.some((p) => p.completed)) {
              completedLessons++;
            }
          });
        });
        chapter.lessons.forEach((lesson) => {
          totalLessons++;
          if (lesson.LessonProgress.some((p) => p.completed)) {
            completedLessons++;
          }
        });
      });

      const progressPercentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        section: {
          id: e.section.id,
          title: e.section.title,
          smallDescription: e.section.smallDescription,
          fileKey: e.section.fileKey,
          slug: e.section.slug,
          progress: {
            totalLessons,
            completedLessons,
            progressPercentage,
          },
        },
      };
    }),
  }));

  return optimizedData;
}

export type EnrolledCourseType = Awaited<
  ReturnType<typeof getEnrolledCourses>
>[0];

export type SectionType = EnrolledCourseType["enrollments"][0]["section"];
