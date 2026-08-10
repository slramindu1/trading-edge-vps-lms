import "server-only";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function adminGetLesson(id: string) {
  const data = await prisma.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      videoUrl: true,
      pdfUrl: true,
      lessonType: true,  // <-- add this
      position: true,
      videoDuration: true,
      chapterId: true,
      topicId: true,

      // Get chapter → topics list
      chapter: {
        select: {
          id: true,
          title: true,
          topics: {
            select: {
              id: true,
              title: true,
              position: true,
            },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!data) return notFound();

  return data;
}


export type AdminLessonType = Awaited<ReturnType<typeof adminGetLesson>>;
