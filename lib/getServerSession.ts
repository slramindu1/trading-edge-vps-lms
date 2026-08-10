import { cookies } from "next/headers";
import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) return null;

  const userId = token;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      fname: user.fname,
      lname: user.lname,
      user_type_id: user.user_type_id,
      role: user.user_type_id === 2 ? "admin" : "user",
    },
  };
}