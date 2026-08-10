"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "./require-user";

export async function getSectionBySlug(slug: string) {
  const user = await requireUser();

  const data = await prisma.section.findFirst({
    where: {
      slug,
      enrollments: { some: { userId: user.user.id } },
    },
    select: {
      id: true,
      title: true,
      smallDescription: true,
      description: true,
      fileKey: true, // section image
      slug: true,
      chapters: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          smallDescription: true, // chapter description
          fileKey: true,           // chapter thumbnail
          position: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              position: true,
              LessonProgress: {
                where: { userId: user.user.id },
                select: {
                  id: true,
                  LessonId: true,
                  completed: true,
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



export type GetSectionType = Awaited<
  ReturnType<typeof getSectionBySlug>
>