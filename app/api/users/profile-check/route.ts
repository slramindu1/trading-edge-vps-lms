// app/api/user/profile-check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient();
  
  try {
    // Get user ID from session_token cookie
    const userId = request.cookies.get("session_token")?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: "No session token" },
        { status: 401 }
      );
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profile_completed: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: user.id,
      profile_completed: user.profile_completed,
    });
    
  } catch (error) {
    console.error("Profile check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}