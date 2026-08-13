import { prisma } from "@/lib/prisma";

export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  // All features are now enabled by default directly in the code
  // as per the client's request to remove the manual toggle system.
  return true;
}

