import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/getSession";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let setting = await prisma.systemSetting.findUnique({
      where: { id: "global" }
    });

    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: { id: "global", emailSecurityEnabled: true }
      });
    }

    return NextResponse.json({
      success: true,
      emailSecurityEnabled: setting.emailSecurityEnabled
    });
  } catch (error) {
    console.error("Error fetching email security setting:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await request.json();

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: { emailSecurityEnabled: enabled },
      create: { id: "global", emailSecurityEnabled: enabled }
    });

    return NextResponse.json({
      success: true,
      emailSecurityEnabled: setting.emailSecurityEnabled,
      message: enabled ? "Email Security Enabled" : "Email Security Decreased (Disabled)"
    });
  } catch (error) {
    console.error("Error updating email security setting:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
