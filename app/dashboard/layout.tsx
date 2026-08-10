import { SiteHeader } from "@/components/sidebar/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "./_components/DashboardAppSidebar";
import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  
  if (!session) {
    redirect("/sign-in");
  }
  
  if (session.user.user_type_id !== 2) {
    redirect("/not-user");
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