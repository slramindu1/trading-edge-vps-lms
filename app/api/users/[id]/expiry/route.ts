import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/users/[id]/expiry   body: { disabled: boolean }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { disabled } = await request.json();

    if (typeof disabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid value. 'disabled' must be a boolean." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { expiry_disabled: disabled },
    });

    return NextResponse.json({
      success: true,
      message: disabled
        ? "Account expiry disabled — account will remain active indefinitely."
        : "Account expiry re-enabled.",
      expiry_disabled: updated.expiry_disabled,
    });
  } catch (err) {
    console.error("Toggle expiry error:", err);
    return NextResponse.json(
      { error: "Failed to update expiry setting" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
