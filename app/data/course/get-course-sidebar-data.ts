import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import "server-only";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function getCourseSidebarData(slug: string, userId: string) {
  const course = await prisma.section.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      fileKey: true,
      slug: true,
      chapters: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          topics: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              lessons: {
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  position: true,
                  // ADD THESE ↓↓↓
                  lessonType: true,
                  videoDuration: true,
                  videoUrl: true,
                  pdfUrl: true,
                  
                  LessonProgress: {
                    where: { userId },
                    select: {
                      completed: true,
                      LessonId: true,
                      id: true,
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

  if (!course) return notFound();

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, sectionId: course.id },
  });

  if (!enrollment) return notFound();

  const userLocks = await prisma.lockedContent.findMany({
    where: { userId },
    select: { entityId: true, entityType: true }
  });

  const featureEnabled = await isFeatureEnabled("chapter-locking");

  const isLocked = (entityId: string, entityType: string) => {
    if (!featureEnabled) return false;
    return userLocks.some(l => l.entityId === entityId && l.entityType === entityType);
  };

  const processedCourse = {
    ...course,
    isLocked: isLocked(course.id, "SECTION"),
    chapters: course.chapters.map(chapter => ({
      ...chapter,
      isLocked: isLocked(chapter.id, "CHAPTER"),
      topics: chapter.topics.map(topic => ({
        ...topic,
        isLocked: isLocked(topic.id, "TOPIC"),
        lessons: topic.lessons.map(lesson => ({
          ...lesson,
          isLocked: isLocked(lesson.id, "LESSON"),
        }))
      }))
    }))
  };

  return { course: processedCourse };
}

export type CourseSidebarDataType = Awaited<
  ReturnType<typeof getCourseSidebarData>
>;
