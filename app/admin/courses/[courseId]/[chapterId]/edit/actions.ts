"use server";

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { chapterSchema, ChapterSchemaType } from "@/lib/zodSchemas";

export async function updateChapter(values: ChapterSchemaType, chapterId: string): Promise<ApiResponse> {
  try {
    const result = chapterSchema.safeParse(values);
    if (!result.success) {
      return { status: "error", message: "Invalid input data" };
    }

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: result.data.name,
        description: result.data.description,
        smallDescription: result.data.smallDescription,
        fileKey: result.data.fileKey,
      },
    });

    return { status: "success", message: "Chapter updated successfully" };
  } catch {
    return { status: "error", message: "Failed to update chapter" };
  }
}
