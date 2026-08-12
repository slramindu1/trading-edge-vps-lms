"use server";

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/data/require-admin";

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  await requireAdmin();
  try {
    await prisma.section.delete({
      where: { id: courseId },
    });

    revalidatePath("/admin/topics");

    return {
      status: "success",
      message: "Course Deleted Successfully",
    };
  } catch (error) {
    console.error("DELETE COURSE ERROR:", error);

    return {
      status: "error",
      message: "Failed To Delete Course",
    };
  }
}
