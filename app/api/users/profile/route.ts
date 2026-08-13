import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/getSession";

// PATCH /api/users/profile  { fname, lname }
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fname, lname } = await request.json();

    if (!fname?.trim() || !lname?.trim()) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fname: fname.trim(),
        lname: lname.trim(),
      },
      select: { fname: true, lname: true },
    });

    return NextResponse.json({
      success: true,
      message: "Name updated successfully",
      fname: updated.fname,
      lname: updated.lname,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update name" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
