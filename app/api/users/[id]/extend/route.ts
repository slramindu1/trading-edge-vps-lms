import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/users/[id]/extend   body: { months: number }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { months } = await request.json();

    if (!months || typeof months !== "number" || months < 1 || months > 36) {
      return NextResponse.json(
        { error: "Invalid months value. Must be between 1 and 36." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate base expiry date
    // Priority: existing expiry_date > payment_date + 1yr > joined_date + 1yr
    let base: Date;
    if (user.expiry_date && user.expiry_date > new Date()) {
      base = new Date(user.expiry_date);
    } else if (user.payment_date) {
      base = new Date(user.payment_date);
      base.setFullYear(base.getFullYear() + 1);
    } else {
      base = new Date(user.joined_date);
      base.setFullYear(base.getFullYear() + 1);
    }

    // Extend by N months from base (or today if base is past)
    const newExpiry = base > new Date() ? new Date(base) : new Date();
    newExpiry.setMonth(newExpiry.getMonth() + months);

    const updated = await prisma.user.update({
      where: { id },
      data: { expiry_date: newExpiry },
    });

    return NextResponse.json({
      success: true,
      message: `Subscription extended by ${months} month(s)`,
      expiry_date: updated.expiry_date,
    });
  } catch (err) {
    console.error("Extend subscription error:", err);
    return NextResponse.json(
      { error: "Failed to extend subscription" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
