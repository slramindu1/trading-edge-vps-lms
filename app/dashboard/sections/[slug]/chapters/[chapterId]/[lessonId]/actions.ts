"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  try {
    await prisma.lessonProgress.upsert({
      where: {
        // use the composite unique key
        userId_LessonId: {
          userId: session.user.id,
          LessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        userId: session.user.id,
        LessonId: lessonId,
        completed: true,
      },
    });

    // Revalidate Next.js path for SSR cache
    revalidatePath(`/dashboard/${slug}`);

    return {
      status: "success",
      message: "Lesson marked as complete",
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}
