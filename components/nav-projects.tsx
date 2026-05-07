"use client";

import { MoreHorizontal } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavProjects({
  organizations,
}: {
  organizations: {
    id: string;
    name: string;
    color: string;
    slug: string;
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Organisationen</SidebarGroupLabel>
      <SidebarMenu>
        {organizations.slice(0, 4).map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={`/settings/organizations text-foreground/80`}>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}></span>
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {/* If more than 4 organizations, show the "Mehr" button */}
        {organizations.length > 4 && (
          <Link href={`/settings/organizations`}>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <MoreHorizontal />
                <span>Mehr</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
