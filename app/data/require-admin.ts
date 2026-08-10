import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/getServerSession"; // Use server version

export async function requireAdmin() {
  // 🔹 Get the current session using server function
  const session = await getServerSession();

  // 🔹 If no session, redirect to login
  if (!session) {
    redirect("/sign-in");
  }

  // 🔹 If user is not admin (user_type_id !== 1), redirect to not-admin page
  if (session.user.user_type_id !== 1) {
    redirect("/not-admin");
  }

  // 🔹 Otherwise, session is valid and user is admin
  return session;
}