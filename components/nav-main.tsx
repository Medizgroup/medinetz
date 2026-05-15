"use client";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
    count?: number;
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              className={`${pathname === item.url ? "bg-accent text-foreground font-semibold" : "text-foreground/80 hover:text-foreground"} rounded-xl `}>
              <Link
                href={item.url}
                className="w-full flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="size-4.25" />
                  <span>{item.title}</span>
                </div>
                {item.count && (
                  <span className="text-xs text-foreground font-semibold pr-2">
                    {item.count}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
