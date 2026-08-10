import { NextResponse } from "next/server";
import { PrismaClient } from "../../../lib/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        verification_code: token,
        reset_token_expiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Since you use plaintext password for now:
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: password,   // ⚠️ later change to hashed
        verification_code: null,
        reset_token_expiry: null,
      },
    });

    return NextResponse.json({ message: "Password updated" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
