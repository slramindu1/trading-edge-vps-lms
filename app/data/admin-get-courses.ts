import "server-only";
import { prisma } from "@/lib/prisma";

export async function adminGetCourses() {
  const data = await prisma.section.findMany({
    orderBy: {
      dateCreated: 'asc',
    },
    select: {
      id: true,
      title: true,
      description: true,
      fileKey: true,
      slug: true,
      status: true,
      smallDescription: true,
      chapters: {
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              videoUrl: true, 
              position: true,
            },
          },
        },
      },
    },
  });

  return data;
}


export type AdminCourseType = Awaited<ReturnType<typeof adminGetCourses>>[0];