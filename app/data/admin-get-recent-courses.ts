import "server-only";
import { prisma } from "@/lib/prisma";

export async function adminGetRecentCourses() {
    await new Promise((resolve) => setTimeout(resolve,2000));
  const data = await prisma.section.findMany({
    orderBy: {
      dateCreated: "desc",
    },
    take: 4,
    select: {
      id: true,
      title: true,
      smallDescription: true,
      description: true,
      status: true,
      fileKey: true,
      slug: true,
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
              position: true,
              thumbnailUrl: true,
              videoUrl: true,
            },
          },
        },
      },
    },
  });

  return data;
}
