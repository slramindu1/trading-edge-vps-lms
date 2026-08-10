import { ReactNode } from "react";
import { getServerSession } from "@/lib/getServerSession";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "./admin-layout-client";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Get session on server using server-side function
  const session = await getServerSession();
  
  // Redirect if no session
  if (!session) {
    redirect("/sign-in");
  }
  
  // Check if user is admin (user_type_id === 1)
  if (session.user.user_type_id !== 1) {
    redirect("/not-admin");
  }
  
  // Prepare user data
  const firstName = session.user.fname || "";
  const lastName = session.user.lname || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || session.user.email.split('@')[0];
  
  const userData = {
    name: displayName,
    email: session.user.email,
    avatar: "/avatars/shadcn.jpg",
  };

  const settingsEnabled = await isFeatureEnabled("settings-page");
  const testimonialEnabled = await isFeatureEnabled("testimonial-tool");

  // Pass data to client component
  return <AdminLayoutClient user={userData} settingsEnabled={settingsEnabled} testimonialEnabled={testimonialEnabled}>{children}</AdminLayoutClient>;
}