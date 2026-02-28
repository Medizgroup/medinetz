"use client";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Bell, Building2, Settings2, UserRound, Wallpaper } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    title: "Profil",
    url: "/settings/profile",
    icon: UserRound,
  },
  {
    title: "Konto",
    url: "/settings/account",
    icon: Settings2,
  },
  {
    title: "Organisationen",
    url: "/settings/organizations",
    icon: Building2,
  },
  {
    title: "Personalisierung",
    url: "/settings/appearance",
    icon: Wallpaper,
  },
  {
    title: "Benachrichtigungen",
    url: "/settings/notifications",
    icon: Bell,
  },
];
export function NavSettings() {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem
            key={item.title}
            className={`${pathname === item.url ? "bg-accent" : ""}  rounded-xl`}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
