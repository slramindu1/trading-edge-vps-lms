import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

function parseDateBoundary(value: unknown, endOfDay: boolean): Date | null {
  if (!value || typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  // If YYYY-MM-DD, anchor to start or end of day in UTC so the end date is inclusive
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const discounts = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ discounts });
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch discounts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const discountNum = Number(body.discount);
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
    const startsAt = parseDateBoundary(body.startsAt, false);
    const expiresAt = parseDateBoundary(body.expiresAt, true);

    if (!code) {
      return NextResponse.json(
        { error: "Discount name / code is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(discountNum) || discountNum <= 0 || discountNum > 100) {
      return NextResponse.json(
        { error: "Discount must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (startsAt && expiresAt && startsAt > expiresAt) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    const existing = await prisma.coupon.findFirst({
      where: {
        code: { equals: code, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A discount with this name already exists" },
        { status: 409 }
      );
    }

    const created = await prisma.coupon.create({
      data: {
        code,
        discount: discountNum,
        isActive,
        startsAt,
        expiresAt,
      },
    });

    return NextResponse.json({ discount: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json(
      { error: "Failed to create discount" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        { error: "Discount ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Discount not found" },
        { status: 404 }
      );
    }

    const code =
      typeof body.code === "string" ? body.code.trim() : existing.code;
    const discountNum =
      body.discount !== undefined ? Number(body.discount) : existing.discount;
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : existing.isActive;
    const startsAt =
      body.startsAt !== undefined
        ? parseDateBoundary(body.startsAt, false)
        : existing.startsAt;
    const expiresAt =
      body.expiresAt !== undefined
        ? parseDateBoundary(body.expiresAt, true)
        : existing.expiresAt;

    if (!code) {
      return NextResponse.json(
        { error: "Discount name / code is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(discountNum) || discountNum <= 0 || discountNum > 100) {
      return NextResponse.json(
        { error: "Discount must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (startsAt && expiresAt && startsAt > expiresAt) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    if (code.toLowerCase() !== existing.code.toLowerCase()) {
      const duplicate = await prisma.coupon.findFirst({
        where: {
          code: { equals: code, mode: "insensitive" },
          NOT: { id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Another discount with this name already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        discount: discountNum,
        isActive,
        startsAt,
        expiresAt,
      },
    });

    return NextResponse.json({ discount: updated });
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json(
      { error: "Failed to update discount" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Discount ID is required" },
        { status: 400 }
      );
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json(
      { error: "Failed to delete discount" },
      { status: 500 }
    );
  }
}
