export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const sessionKey = request.cookies.get("session_key")?.value;
  const userId = request.cookies.get("session_token")?.value;

  if (!sessionKey || !userId) {
    return NextResponse.json({ valid: false });
  }

  // Check if this session token still exists in DB
  const session = await prisma.userSession.findUnique({
    where: { token: sessionKey },
  });

  if (!session || session.userId !== userId) {
    return NextResponse.json({ valid: false });
  }

  // Update last seen
  await prisma.userSession.update({
    where: { token: sessionKey },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ valid: true });
}
