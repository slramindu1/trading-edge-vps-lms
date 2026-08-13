import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "./_components/DashboardAppSidebar";
import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    redirect("/sign-in");
  }
  
  if (session.user.user_type_id !== 2) {
    redirect("/not-user");
  }
  
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      expiry_disabled: true,
      expiry_date: true,
      payment_date: true,
      joined_date: true,
    }
  });

  let expiryBanner = null;
  if (dbUser && !dbUser.expiry_disabled) {
    let targetDate: Date;
    if (dbUser.expiry_date) {
      targetDate = new Date(dbUser.expiry_date);
    } else if (dbUser.payment_date) {
      targetDate = new Date(dbUser.payment_date);
      targetDate.setFullYear(targetDate.getFullYear() + 1);
    } else {
      targetDate = new Date(dbUser.joined_date);
      targetDate.setFullYear(targetDate.getFullYear() + 1);
    }

    const distance = targetDate.getTime() - Date.now();
    const daysLeft = Math.ceil(distance / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 30 && daysLeft >= 0) {
      expiryBanner = (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 text-center flex items-center justify-center gap-2">
          <span className="text-red-500">⚠️</span>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            Your account is expiring in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}. Please contact support to renew your subscription.
          </p>
        </div>
      );
    }
  }

  // Create user data with proper names
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

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" user={userData} settingsEnabled={settingsEnabled} />
      <SidebarInset>
        {expiryBanner}
        <SiteHeader />
        <Toaster position="bottom-right" closeButton />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}