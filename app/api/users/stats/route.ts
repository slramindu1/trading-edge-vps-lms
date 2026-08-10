import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, active, inactive, pending] = await Promise.all([
      prisma.user.count({
        where: { user_type_id: { not: 1 } }
      }),
      prisma.user.count({
        where: { 
          status_id: 1,
          user_type_id: { not: 1 }
        }
      }),
      prisma.user.count({
        where: { 
          status_id: 2,
          user_type_id: { not: 1 }
        }
      }),
      prisma.user.count({
        where: { 
          status_id: 3,
          user_type_id: { not: 1 }
        }
      })
    ]);

    return NextResponse.json({
      total,
      active,
      inactive,
      pending
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { 
        error: "Failed to fetch user stats",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';