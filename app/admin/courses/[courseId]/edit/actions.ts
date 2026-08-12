"use server";

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchemaType,
  lessonSchema,
  LessonSchemaType,
  SectionSchema,
  SectionSchemaType,
} from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/data/require-admin";

export async function editCourse(
  data: SectionSchemaType,
  sectionId: string
): Promise<ApiResponse> {
  await requireAdmin();
  const validation = SectionSchema.safeParse(data);
  if (!validation.success) {
    return { status: "error", message: "Invalid data" };
  }

  const { accessibleUsers, ...sectionData } = validation.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Update section
      await tx.section.update({
        where: { id: sectionId },
        data: sectionData,
      });

      // 2️⃣ Clear old enrollments
      await tx.enrollment.deleteMany({
        where: { sectionId },
      });

      // 3️⃣ Decide enroll behavior
      let usersToEnroll: { id: string }[] = [];

      if (Array.isArray(accessibleUsers)) {
        // 🎯 MANUAL MODE (emails explicitly provided OR cleared)
        if (accessibleUsers.length > 0) {
          usersToEnroll = await tx.user.findMany({
            where: {
              email: { in: accessibleUsers },
              user_type_id: 2,
            },
            select: { id: true },
          });
        }
        // ⚠️ empty array = enroll nobody
      } else {
        // 🎯 AUTO MODE (no field sent)
        usersToEnroll = await tx.user.findMany({
          where: {
            student_type: "PAID",
            user_type_id: 2,
          },
          select: { id: true },
        });
      }

      // 4️⃣ Insert enrollments
      if (usersToEnroll.length > 0) {
        await tx.enrollment.createMany({
          data: usersToEnroll.map((u) => ({
            userId: u.id,
            sectionId,
          })),
        });
      }
    });

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (err) {
    console.error("EDIT COURSE ERROR:", err);
    return {
      status: "error",
      message: "Failed to update course",
    };
  }
}



export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons to reorder",
      };
    }
    const updates = lessons.map((lesson) =>
      prisma.lesson.update({
        where: { id: lesson.id, chapterId: chapterId },
        data: { position: lesson.position },
      })
    );

    await prisma.$transaction(updates);
    revalidatePath(`/admin/courses/${courseId}/edit`);
    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "failed to reorder lessons",
    };
  }
}

export async function reorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters to reorder",
      };
    }

    const updates = chapters.map((chapter) =>
      prisma.chapter.update({
        where: { id: chapter.id },
        data: { position: chapter.position, sectionId: courseId },
      })
    );

    await prisma.$transaction(updates);
    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch (error) {
    console.error("Failed to reorder chapters:", error);
    return {
      status: "error",
      message: "Failed to reorder chapters",
    };
  }
}

export async function createChapter(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = chapterSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.chapter.findFirst({
        where: { sectionId: result.data.courseId },
        select: { position: true },
        orderBy: { position: "desc" },
      });
      await tx.chapter.create({
        data: {
          title: result.data.name,
          sectionId: result.data.courseId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Chapter created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "failed to create chapter",
    };
  }
}

export async function createLesson(
  values: LessonSchemaType
): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const result = lessonSchema.safeParse(values);
    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Get max position in the chapter
      const maxPos = await tx.lesson.findFirst({
        where: { chapterId: result.data.chapterId },
        select: { position: true },
        orderBy: { position: "desc" },
      });

      // Create the lesson
      await tx.lesson.create({
        data: {
          title: result.data.name,
          description: result.data.description ?? null,
          videoUrl: result.data.videoUrl ?? null,
          pdfUrl: result.data.pdfUrl ?? null,
          thumbnailUrl: result.data.thumbnailUrl ?? null,
          chapterId: result.data.chapterId,
          topicId: result.data.topicId ?? null,
          lessonType: result.data.lessonType ?? null, // <-- now included
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    // Revalidate admin course edit page
    revalidatePath(`/admin/courses/${result.data.sectionId}/edit`);

    return {
      status: "success",
      message: "Lesson created successfully",
    };
  } catch (error) {
    console.error("CREATE LESSON ERROR:", error);
    return {
      status: "error",
      message: "Failed to create lesson",
    };
  }
}

export async function deleteLesson({
  chapterId,
  sectionId,
  lessonId,
}: {
  chapterId: string;
  sectionId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        lessons: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });
    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not found",
      };
    }
    const lessons = chapterWithLessons.lessons;

    const lessonToDelete = lessons.find((lesson) => lesson.id === lessonId);
    if (!lessonToDelete) {
      return {
        status: "error",
        message: "Lesson not found",
      };
    }

    const remainingLessons = lessons.filter(
      (lessons) => lessons.id !== lessonId
    );

    const updates = remainingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: { id: lesson.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.lesson.delete({ where: { id: lessonId, chapterId: chapterId } }),
    ]);
    revalidatePath(`/admin/courses/${sectionId}/edit`);
    return {
      status: "success",
      message: "Lesson deleted successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete lesson",
    };
  }
}

export async function deleteChapter({
  chapterId,
  sectionId,
}: {
  chapterId: string;
  sectionId: string;
}): Promise<ApiResponse> {
  await requireAdmin();
  try {
    const sectionWithChapters = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        chapters: {
          orderBy: { position: "asc" },
          select: { id: true, position: true },
        },
      },
    });

    if (!sectionWithChapters) {
      return {
        status: "error",
        message: "Section not found",
      };
    }

    const chapters = sectionWithChapters.chapters;
    const chapterToDelete = chapters.find((chap) => chap.id === chapterId);

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not found in the Section",
      };
    }

    const remainingChapters = chapters.filter((chap) => chap.id !== chapterId);

    const Updates = remainingChapters.map((chap, index) =>
      prisma.chapter.update({
        where: { id: chap.id },
        data: { position: index + 1 },
      })
    );

    await prisma.$transaction([
      ...Updates,
      prisma.chapter.delete({ where: { id: chapterId } }),
    ]);

    revalidatePath(`/admin/courses/${sectionId}/edit`);

    return {
      status: "success",
      message: "Chapter deleted successfully",
    };
  } catch (error) {
    console.error("Delete chapter error:", error);
    return {
      status: "error",
      message: "Failed to delete chapter",
    };
  }
}
