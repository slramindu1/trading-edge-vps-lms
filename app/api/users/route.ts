// app/api/users/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchQuery, statusFilter } = Object.fromEntries(
    new URL(request.url).searchParams
  )

  const statusFilterToId = (status: string | undefined) => {
    switch (status) {
      case "active": return 1
      case "inactive": return 2
      case "pending": return 3
      default: return undefined
    }
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        searchQuery ? {
          OR: [
            { fname: { contains: searchQuery, mode: "insensitive" } },
            { lname: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
          ],
        } : {},
        statusFilter && statusFilter !== "all" ? { status_id: statusFilterToId(statusFilter) } : {},
      ],
    },
    select: {
      id: true,
      fname: true,
      lname: true,
      email: true,
      status_id: true,
      user_type_id: true,
      joined_date: true,
    },
    orderBy: { joined_date: "desc" },
  })

  return NextResponse.json(users)
}
