import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await request.json();
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { device_verification_enabled: enabled },
    });

    return NextResponse.json({ success: true, device_verification_enabled: enabled });
  } catch (error) {
    console.error("Device verification toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
