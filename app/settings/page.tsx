import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./_components/SettingsClient";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      fname: true,
      lname: true,
      email: true,
      joined_date: true,
      profile_image: true,
      payment_date: true,
      expiry_date: true,
      expiry_disabled: true,
      device_verification_enabled: true,
    },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  const settingsEnabled = await isFeatureEnabled("settings-page");
  if (!settingsEnabled) {
    redirect("/dashboard");
  }

  const securityEnabled = await isFeatureEnabled("security-system");
  const autoDeactivationEnabled = await isFeatureEnabled("auto-deactivation");

  return (
    <SettingsClient 
      user={dbUser} 
      securityEnabled={securityEnabled} 
      autoDeactivationEnabled={autoDeactivationEnabled}
      deviceVerificationEnabled={dbUser.device_verification_enabled}
    />
  );
}
