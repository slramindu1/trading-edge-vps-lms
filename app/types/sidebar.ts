import { ComponentType } from "react";

// Define proper props for tabler icons
export interface IconProps {
  className?: string;
  size?: number | string;
  stroke?: number;
  color?: string;
  [key: string]: unknown; // For any additional props
}

export type NavItem = {
  title: string;
  url: string;
  icon?: ComponentType<IconProps>;
  items?: Array<{ title: string; url: string }>;
  isActive?: boolean;
};

export type UserData = {
  name: string;
  email: string;
  avatar: string;
};

// Alternative: More specific type for tabler icons
export type TablerIcon = ComponentType<{
  className?: string;
  size?: number | string;
  stroke?: number;
  color?: string;
}>;