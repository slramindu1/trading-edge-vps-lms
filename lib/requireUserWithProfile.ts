// lib/requireUserWithProfile.ts
import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";

export async function requireUserWithProfile(redirectPath?: string) {
  // Get the current session
  const session = await getSession();

  // If no session, redirect to login
  if (!session) {
    const currentUrl = redirectPath || 
      (typeof window !== "undefined" 
        ? window.location.pathname + window.location.search 
        : "/dashboard");
    
    redirect(`/sign-in?redirect=${encodeURIComponent(currentUrl)}`);
  }

  // Check if profile is completed
  if (!session.user.profile_completed) {
    // If already on complete-profile page, stay there
    if (typeof window !== "undefined" && 
        window.location.pathname.startsWith("/complete-profile")) {
      return session;
    }
    
    // Otherwise redirect to complete-profile
    const currentUrl = redirectPath || 
      (typeof window !== "undefined" 
        ? window.location.pathname + window.location.search 
        : "/dashboard");
    
    redirect(`/complete-profile?redirect=${encodeURIComponent(currentUrl)}`);
  }

  return session;
}