import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";

export async function requireUser() {
  // 🔹 Get the current session
  const session = await getSession();

  // 🔹 If no session, redirect to login with redirect URL
  if (!session) {
    const currentUrl =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/dashboard"; // fallback
    redirect(`/sign-in?redirect=${encodeURIComponent(currentUrl)}`);
  }

  // 🔹 Ensure the user is of type normal user (user_type_id === 1)
  if (session.user.user_type_id !== 2) {
    redirect("/not-user");
  }

  return session;
}
