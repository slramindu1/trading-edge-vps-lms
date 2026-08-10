import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sessionKey = request.cookies.get("session_key")?.value;
  const userId = request.cookies.get("session_token")?.value;

  if (!sessionKey || !userId) {
    return NextResponse.json({ valid: false });
  }

  // We check against DB in the middleware or use this endpoint from client
  // For lightweight checks, just return the cookie presence
  // The real check happens in middleware.ts
  return NextResponse.json({ valid: true, sessionKey });
}
