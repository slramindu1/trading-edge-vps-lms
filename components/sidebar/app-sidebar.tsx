"use client";

import * as React from "react";
import {
  IconDashboard,
  IconHelp,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBrush,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { Download } from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Logo from "@/app/logo-white.png";
import { useTheme } from "next-themes";
import LogoDark from "@/app/logo-white.png";
import LogoLight from "@/app/logo-dark.png";
import Image from "next/image";

// Define props interface
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
  settingsEnabled?: boolean;
  testimonialEnabled?: boolean;
}

// Remove hardcoded data and define nav items separately
const navMainItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: IconDashboard as TablerIcon,
  },
  {
    title: "Students",
    url: "/admin/student",
    icon: IconUsers as TablerIcon,
  },
  {
    title: "Announcements",
    url: "#",
    icon: IconUsers as TablerIcon,
  },
  {
    title: "NewsLetter",
    url: "#",
    icon: IconUsers as TablerIcon,
  },
  {
    title: "Testimonial Builder",
    url: "/builder/landing-testimonials",
    icon: IconBrush as TablerIcon,
    target: "_blank",
  },
];

const navSecondaryItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings as TablerIcon,
  },
  {
    title: "Get Help",
    url: "#",
    icon: IconHelp as TablerIcon,
  },
  {
    title: "Search",
    url: "#",
    icon: IconSearch as TablerIcon,
  },
];

// Default user data as fallback
const defaultUser = {
  name: "Admin User",
  email: "admin@example.com",
  avatar: "/",
};

export function AppSidebar({ user, settingsEnabled = true, testimonialEnabled = false, ...props }: AppSidebarProps) {
  // Use provided user or default
  const currentUser = user || defaultUser;
  const { resolvedTheme } = useTheme();

  // Prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const logoSrc = resolvedTheme === "dark" ? LogoDark : LogoLight;
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/admin">
                <Image
                  src={logoSrc}
                  alt="logo"
                  width={196}
                  height={186}
                  priority
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems.filter(item => item.title !== "Testimonial Builder" || testimonialEnabled)} />
        <NavSecondary items={navSecondaryItems.filter(item => item.title !== "Settings" || settingsEnabled)} className="mt-auto" />
        {/* Updates notification button */}
        <div className="px-2 pb-2">
          <Link
            href="/admin/updates"
            className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-200"
          >
            <div className="relative shrink-0">
              <Download className="w-4 h-4 text-primary" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary truncate">System Updates</p>
              <p className="text-[10px] text-primary/60 truncate">New updates available</p>
            </div>
          </Link>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} settingsEnabled={settingsEnabled} />
      </SidebarFooter>
    </Sidebar>
  );
}
