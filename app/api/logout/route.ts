import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Get session key and delete from DB
    const sessionKey = cookieStore.get("session_key")?.value;
    if (sessionKey) {
      await prisma.userSession.deleteMany({ where: { token: sessionKey } });
    }

    // Clear both cookies
    cookieStore.delete("session_token");
    cookieStore.delete("session_key");
    
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 });
  }
}