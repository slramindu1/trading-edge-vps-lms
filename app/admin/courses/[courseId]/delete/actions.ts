"use server";

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
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
