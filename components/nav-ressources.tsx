"use client";

import { ChevronDownIcon, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavRessources({
  ressources,
}: {
  ressources: {
    name: string;
    url: string;
    icon: LucideIcon;
    items?: {
      name: string;
      url: string;
      icon: LucideIcon;
    }[];
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Ressourcen</SidebarGroupLabel>
      <SidebarMenu>
        {ressources.map((item) => (
          <SidebarMenuItem key={item.name}>
            <Collapsible>
              <CollapsibleTrigger className="inline-flex items-center justify-between gap-2 text-sm data-panel-open:[&_svg]:rotate-180 w-full">
                {item.items && (
                  <span className="flex items-center gap-2">
                    <item.icon className="size-4 " />
                    <span>{item.name}</span>
                  </span>
                )}
                {!item.items && (
                  <Link href={item.url} className="flex items-center gap-2">
                    <item.icon className="size-4" />
                    <span>{item.name}</span>
                  </Link>
                )}

                <ChevronDownIcon
                  className={`size-4 transition-transform duration-200 ease-in-out ${item.items ? "" : "hidden"}`}
                />
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <ul className="flex flex-col gap-1 py-2 text-muted-foreground text-sm">
                  {item.items &&
                    item.items.map((item) => (
                      <Link href={item.url} key={item.name}>
                        <li className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                          <item.icon className="size-4" />
                          <span>{item.name}</span>
                        </li>
                      </Link>
                    ))}
                </ul>
              </CollapsiblePanel>
            </Collapsible>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
