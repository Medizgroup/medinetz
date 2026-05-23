"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { IconComponent } from "./nav-main";
import { usePathname } from "next/navigation";

export function NavRessources({
  ressources,
}: {
  ressources: {
    name: string;
    url: string;
    icon: IconComponent;
    items?: {
      name: string;
      url: string;
      icon: LucideIcon;
    }[];
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Ressourcen</SidebarGroupLabel>
      <SidebarMenu className="pt-2 px-2">
        {ressources.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              asChild
              className={`${pathname === item.url || pathname.startsWith(item.url + "/") ? "bg-accent text-foreground " : "text-foreground/80 hover:text-foreground"} rounded-xl `}>
              {!item.items && (
                <Link href={item.url} className="flex items-center gap-2">
                  <item.icon className="size-4" />
                  <span>{item.name}</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
