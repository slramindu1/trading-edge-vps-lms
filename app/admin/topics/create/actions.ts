"use server";

import { prisma } from "@/lib/prisma";
import { SectionSchema, SectionSchemaType } from "@/lib/zodSchemas";
import { requireAdmin } from "@/app/data/require-admin";

export async function CreateCourse(
  data: SectionSchemaType
) {
  await requireAdmin();

  const validation = SectionSchema.safeParse(data);
  if (!validation.success) {
    return { status: "error", message: "Invalid Data" };
  }

  const { accessibleUsers, ...sectionData } = validation.data;

  try {
    await prisma.$transaction(async (tx: any) => {

      const section = await tx.section.create({
        data: sectionData,
      });

      let usersToEnroll: { id: string }[] = [];

      if (accessibleUsers && accessibleUsers.length > 0) {
        // ✅ ONLY SELECTED USERS
        usersToEnroll = await tx.user.findMany({
          where: {
            email: { in: accessibleUsers },
          },
          select: { id: true },
        });
      } else {
        // ✅ DEFAULT: ALL PAID USERS
        usersToEnroll = await tx.user.findMany({
          where: {
            student_type: "PAID",
          },
          select: { id: true },
        });
      }

      if (usersToEnroll.length > 0) {
        await tx.enrollment.createMany({
          data: usersToEnroll.map((u) => ({
            userId: u.id,
            sectionId: section.id,
          })),
          skipDuplicates: true,
        });
      }
    });

    return {
      status: "success",
      message: "Course created successfully",
    };
  } catch (err) {
    console.error(err);
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
}
