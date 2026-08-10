import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.user_type_id !== 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { featureKey, version } = await req.json();

  if (!featureKey) {
    return NextResponse.json({ error: "featureKey is required" }, { status: 400 });
  }

  try {
    // 1. Disable the feature flag
    const flag = await prisma.featureFlag.update({
      where: { featureKey },
      data: {
        enabled: false,
      },
    });

    // 2. Record history
    await prisma.updateHistory.create({
      data: {
        featureKey,
        action: "ROLLED_BACK", // We keep ROLLED_BACK in history for consistency
        version: version || "1.0.0",
        performedBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, flag });
  } catch (err: any) {
    console.error("[ROLLBACK ERROR]", err);
    return NextResponse.json({ error: "Failed to disable feature" }, { status: 500 });
  }
}
