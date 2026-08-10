"use server";

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType, topicSchema, TopicSchemaType } from "@/lib/zodSchemas";

/* ----------------------------------------
  Update Lesson Function
---------------------------------------- */
export async function updateLesson(
  values: LessonSchemaType & { videoDuration?: string },
  lessonId: string
): Promise<ApiResponse> {
  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid input data.",
      };
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailUrl: result.data.thumbnailUrl,

        // Resources
        videoUrl: result.data.videoUrl,
        pdfUrl: result.data.pdfUrl,

        // Type
        lessonType: result.data.lessonType,

        // Duration (Video only)
        videoDuration: values.videoDuration ?? null,

        // Structure
        topicId: result.data.topicId,
        chapterId: result.data.chapterId,
      },
    });

    return {
      status: "success",
      message: "Lesson updated successfully.",
    };
  } catch (error) {
    console.error("UPDATE LESSON ERROR:", error);
    return {
      status: "error",
      message: "Failed to update lesson.",
    };
  }
}


/* ----------------------------------------
  Create Topic Function
---------------------------------------- */
export async function createTopic(values: TopicSchemaType): Promise<ApiResponse> {
  try {
    const result = topicSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid topic data.",
      };
    }

    // Get next position inside chapter
    const lastTopic = await prisma.topic.findFirst({
      where: { chapterId: result.data.chapterId },
      orderBy: { position: "desc" },
    });

    const nextPosition = lastTopic ? lastTopic.position + 1 : 1;

    await prisma.topic.create({
      data: {
        title: result.data.title,
        chapterId: result.data.chapterId,
        position: nextPosition,
      },
    });

    return {
      status: "success",
      message: "Topic created successfully.",
    };
  } catch (error) {
    console.error("CREATE TOPIC ERROR:", error);
    return {
      status: "error",
      message: "Failed to create topic.",
    };
  }
}
