"use client";

import * as React from "react";
import {
  IconDashboard,
  IconHelp,
  IconSearch,
  IconSettings,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

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
import Image from "next/image";

const iconMap: Record<string, TablerIcon> = {
  IconDashboard: IconDashboard,
  IconSettings: IconSettings,
  IconHelp: IconHelp,
  IconSearch: IconSearch,
};

interface NavItem {
  title: string;
  url: string;
  icon: string;
  items?: Array<{ title: string; url: string }>;
  isActive?: boolean;
}

interface AppSidebarClientProps {
  variant: "inset" | "floating" | "sidebar";
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navMain: NavItem[];
  navSecondary: NavItem[];
}

export function AppSidebarClient({ 
  variant, 
  user, 
  navMain, 
  navSecondary 
}: AppSidebarClientProps) {
  const processedNavMain = navMain.map(item => ({
    title: item.title,
    url: item.url,
    icon: iconMap[item.icon] || IconDashboard,
  }));

  const processedNavSecondary = navSecondary.map(item => ({
    title: item.title,
    url: item.url,
    icon: iconMap[item.icon] || IconDashboard,
  }));

  return (
    <Sidebar collapsible="offcanvas" variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <Image src={Logo} alt="logo" width={196} height={186} />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={processedNavMain} />
        <NavSecondary items={processedNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}