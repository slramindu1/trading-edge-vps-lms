"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/getSession";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function getStudentCourseTree(studentId: string) {
  const session = await getSession();
  
  if (!session || session.user.user_type_id !== 1) {
    throw new Error("Unauthorized");
  }

  const data = await prisma.user.findUnique({
    where: {
      id: studentId,
    },
    select: {
      id: true,
      fname: true,
      lname: true,
      email: true,
      enrollments: {
        orderBy: {
          section: {
            dateCreated: "asc",
          },
        },
        select: {
          section: {
            select: {
              id: true,
              title: true,
              slug: true,
              chapters: {
                select: {
                  id: true,
                  title: true,
                  position: true,
                  topics: {
                    select: {
                      id: true,
                      title: true,
                      position: true,
                      lessons: {
                        select: {
                          id: true,
                          title: true,
                          position: true,
                        },
                        orderBy: { position: "asc" },
                      },
                    },
                    orderBy: { position: "asc" },
                  },
                },
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return data;
}

export type StudentCourseTreeType = NonNullable<Awaited<ReturnType<typeof getStudentCourseTree>>>;

export async function getLockedContent(studentId: string) {
  const session = await getSession();
  if (!session || session.user.user_type_id !== 1) {
    throw new Error("Unauthorized");
  }

  const featureEnabled = await isFeatureEnabled("chapter-locking");
  if (!featureEnabled) return [];

  const locks = await prisma.lockedContent.findMany({
    where: { userId: studentId },
    select: { entityId: true, entityType: true }
  });

  return locks.map(l => `${l.entityType.toLowerCase()}_${l.entityId}`);
}

export async function updateLockedContent(studentId: string, lockedIds: string[]) {
  const session = await getSession();
  if (!session || session.user.user_type_id !== 1) {
    throw new Error("Unauthorized");
  }

  const featureEnabled = await isFeatureEnabled("chapter-locking");
  if (!featureEnabled) {
    throw new Error("Chapter locking feature is disabled");
  }

  // Delete all existing locks for this student
  await prisma.lockedContent.deleteMany({
    where: { userId: studentId }
  });

  // Re-insert the new locks
  if (lockedIds.length > 0) {
    const dataToInsert = lockedIds.map(idString => {
      // idString is something like "section_xyz" or "chapter_abc"
      const [typeStr, id] = idString.split("_", 2);
      return {
        userId: studentId,
        entityId: id,
        entityType: typeStr.toUpperCase()
      };
    });

    await prisma.lockedContent.createMany({
      data: dataToInsert
    });
  }

  return { success: true };
}

export async function checkChapterLockingFeature() {
  const { isFeatureEnabled } = await import('@/lib/feature-flags');
  return await isFeatureEnabled('chapter-locking');
}
