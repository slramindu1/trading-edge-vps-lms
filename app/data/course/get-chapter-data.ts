"use server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/app/data/user/require-user";

export async function getChapterData(chapterId: string) {
  const user = await requireUser();

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      title: true,
      position: true,
      section: { select: { slug: true, id: true, title: true } },
      topics: {
        // <-- load topics
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
              videoUrl: true, 
              pdfUrl: true, 
              lessonType: true, 
              videoDuration: true, 
              LessonProgress: {
                where: { userId: user.user.id },
                select: { completed: true, LessonId: true, id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!chapter) return null;
  return chapter;
}

export type ChapterDataType = Awaited<ReturnType<typeof getChapterData>>;
