import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

const MASTER_EMAIL = process.env.MASTER_ADMIN_EMAIL || "ramindu.jiat@gmail.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.email !== MASTER_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { featureKey, enabled, version, availableAt } = await req.json();

  if (!featureKey) {
    return NextResponse.json({ error: "featureKey is required" }, { status: 400 });
  }

  if (enabled) {
    // Grant license: create flag if not exists, but leave enabled=false so client has to install it
    const flag = await prisma.featureFlag.upsert({
      where: { featureKey },
      update: {
        availableAt: availableAt ? new Date(availableAt) : null,
      }, // update availableAt if it already exists
      create: {
        featureKey,
        enabled: false, // Client must install to make it true
        version: version || "1.0.0",
        availableAt: availableAt ? new Date(availableAt) : null,
      },
    });
    return NextResponse.json({ success: true, flag });
  } else {
    // Revoke license: delete the flag
    await prisma.featureFlag.deleteMany({
      where: { featureKey },
    });
    return NextResponse.json({ success: true });
  }
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession();
  if (!session || session.user.email !== MASTER_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const flags = await prisma.featureFlag.findMany();
  return NextResponse.json({ flags });
}
