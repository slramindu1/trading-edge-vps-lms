import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";

export async function getUserLockedContent(userId: string) {
  const featureEnabled = await isFeatureEnabled("chapter-locking");
  if (!featureEnabled) return [];
  const locks = await prisma.lockedContent.findMany({
    where: {
      userId
    },
    select: {
      entityId: true,
      entityType: true
    }
  });

  return locks;
}

export function isLocked(locks: { entityId: string, entityType: string }[], entityId: string, entityType: string) {
  return locks.some(l => l.entityId === entityId && l.entityType === entityType);
}
