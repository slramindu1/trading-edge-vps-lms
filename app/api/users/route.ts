// app/api/users/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const searchQuery   = params.get("searchQuery")   || "";
  const statusFilter  = params.get("statusFilter")  || "all";
  const studentType   = params.get("studentType")   || "all";   // FREE | PAID | all
  const isPaidFilter  = params.get("isPaid")        || "all";   // true | false | all
  const page          = Math.max(1, parseInt(params.get("page")  || "1"));
  const limit         = Math.min(100, parseInt(params.get("limit") || "20"));

  const statusFilterToId = (status: string) => {
    switch (status) {
      case "active":   return 1;
      case "inactive": return 2;
      case "pending":  return 3;
      default:         return undefined;
    }
  };

  const where: any = {
    AND: [
      searchQuery ? {
        OR: [
          { fname:  { contains: searchQuery, mode: "insensitive" } },
          { lname:  { contains: searchQuery, mode: "insensitive" } },
          { email:  { contains: searchQuery, mode: "insensitive" } },
        ],
      } : {},
      statusFilter !== "all" ? { status_id: statusFilterToId(statusFilter) } : {},
      studentType  !== "all" ? { student_type: studentType  } : {},
      isPaidFilter !== "all" ? { is_paid: isPaidFilter === "true" } : {},
    ],
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id:               true,
        fname:            true,
        lname:            true,
        email:            true,
        status_id:        true,
        user_type_id:     true,
        student_type:     true,
        is_paid:          true,
        joined_date:      true,
        expiry_disabled:  true,
        expiry_date:      true,
        payment_date:     true,
        sessions: {
          orderBy: { lastSeenAt: "desc" },
          take:    1,
          select:  { lastSeenAt: true },
        },
      },
      orderBy: { joined_date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const usersWithLastLogin = users.map((u) => ({
    ...u,
    lastLogin: u.sessions[0]?.lastSeenAt ?? null,
    sessions: undefined,
  }));

  return NextResponse.json({
    users: usersWithLastLogin,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  });
}

