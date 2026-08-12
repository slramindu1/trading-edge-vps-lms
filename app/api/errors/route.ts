import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ErrorCategory } from "@/lib/generated/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const body = await req.json();

    const ipAddress = req.headers.get("x-forwarded-for")?.split(',')[0] || req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent") || undefined;

    await prisma.systemError.create({
      data: {
        message: body.message?.substring(0, 1000) || "Unknown Client Error",
        stack: body.stack,
        category: body.category || ErrorCategory.USER,
        url: body.url,
        method: body.method || "GET",
        userAgent: body.userAgent || userAgent,
        ipAddress: ipAddress || undefined,
        networkSpeed: body.networkSpeed,
        userId: session?.user?.id || body.userId, // use session if available
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save client error:", error);
    return NextResponse.json({ error: "Failed to log error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    // Only admins should see the error log
    if (!session || (session.user.role !== "ADMIN" && session.user.user_type_id !== 1)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as ErrorCategory | null;
    const resolved = searchParams.get("resolved") === "true";
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where = {
      ...(category ? { category } : {}),
      ...(searchParams.has("resolved") ? { resolved } : {}),
    };

    const errors = await prisma.systemError.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.systemError.count({ where });

    return NextResponse.json({ errors, total, page, limit });
  } catch (error) {
    console.error("Failed to fetch errors:", error);
    return NextResponse.json({ error: "Failed to fetch errors" }, { status: 500 });
  }
}
