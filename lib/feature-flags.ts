import { prisma } from "@/lib/prisma";

export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { featureKey },
    });
    return flag?.enabled === true;
  } catch (error) {
    console.error(`Error checking feature flag ${featureKey}:`, error);
    return false; // Fail safe: disable feature on error
  }
}

