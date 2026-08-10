// app/complete-profile/page.tsx
import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import MultiStepProfileForm from "./CompleteProfileForm";

export default async function CompleteProfilePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/sign-in");
  }
  
  if (session.user.profile_completed) {
    redirect("/dashboard");
  }
  
  return <MultiStepProfileForm user={session.user} />;
}