import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/getServerSession"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get("searchQuery")
    const statusFilter = searchParams.get("statusFilter")
    
    // Pagination params
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "15", 10)
    const skip = (page - 1) * limit

    const statusFilterToId = (status: string | null) => {
      switch (status) {
        case "active": return 1
        case "inactive": return 2
        case "pending": return 3
        default: return undefined
      }
    }

    const whereClause = {
      AND: [
        { user_type_id: { not: 1 } }, // Exclude admins at the DB level
        searchQuery ? {
          OR: [
            { fname: { contains: searchQuery, mode: "insensitive" as const } },
            { lname: { contains: searchQuery, mode: "insensitive" as const } },
            { email: { contains: searchQuery, mode: "insensitive" as const } },
          ],
        } : {},
        statusFilter && statusFilter !== "all" ? { status_id: statusFilterToId(statusFilter) } : {},
      ],
    }

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
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
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause })
    ])

    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
        current: page,
        limit
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
