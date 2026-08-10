import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function getLessonContent(lessonId: string) {
  const session = await requireUser();

  // 🔹 1. Load lesson + find the section it belongs to
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      videoUrl: true,
      position: true,
      pdfUrl: true, 
      lessonType: true,
      LessonProgress: {
        where: {
          userId: session.user.id,
        },
        select: {
          completed: true,
          LessonId: true,
        },
      },
      chapterId: true,
      topicId: true,
      chapter: {
        select: {
          sectionId: true,
          section: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) return notFound();

  const sectionId = lesson.chapter.sectionId;

  // 🔹 2. Check if user is enrolled for this section
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id, // current user
      sectionId: sectionId, // lesson belongs to this
    },
  });

  if (!enrollment) {
    // user not enrolled → deny access
    return notFound();
  }

  return {
    lesson,
  };
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
