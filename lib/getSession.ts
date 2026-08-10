// lib/getSession.ts - Updated version
import { cookies } from "next/headers";
import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("session_token")?.value;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fname: true,
      lname: true,
      user_type_id: true,
      profile_completed: true,  // Add this
      mobile: true,            // Add this
      aboutMe: true,           // Add this
      gender_id: true,         // Add this
      student_type: true,      // Add this
    },
  });

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      fname: user.fname,
      lname: user.lname,
      user_type_id: user.user_type_id,
      profile_completed: user.profile_completed,  // Add this
      mobile: user.mobile,                        // Add this
      aboutMe: user.aboutMe,                      // Add this
      gender_id: user.gender_id,                  // Add this
      student_type: user.student_type,            // Add this
      role: user.user_type_id === 1 ? "admin" : "user", // Fixed role check
    },
  };
}