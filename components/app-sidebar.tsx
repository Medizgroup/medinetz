"use client";

import * as React from "react";

import {
  Home,
  Calendar,
  FolderOpen,
  DocumentAdd,
  Bell,
  History,
  Checklist,
  Layers,
  QuestionMark,
} from "@/lib/icons";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import Link from "next/link";
import { NavRessources } from "./nav-ressources";
import { NavSettings } from "./settings/nav/nav-settings";
import { usePathname } from "next/navigation";
import { Routing2 } from "@solar-icons/react-perf/category/style/LineDuotone";
import type { News } from "@/generated/prisma/client";
import InstitutLogo from "./institut-logo";
import { useInstitut } from "@/components/providers/institut-provider";

export function AppSidebar({
  openTodosCount,
  assignedCasesCount,
  news,
  newsCount,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  openTodosCount: number;
  assignedCasesCount: number;
  news: News[];
  newsCount: number;
}) {
  const pathname = usePathname();
  const institut = useInstitut();

  const data = {
    navMain: [
      {
        title: "Home",
        url: "/home",
        icon: Home,
      },
      {
        title: "Kalender",
        url: "/events",
        icon: Calendar,
      },
      {
        title: "Fälle",
        url: "/cases",
        icon: FolderOpen,
        count: assignedCasesCount,
      },

      {
        title: "Todo's",
        url: "/todos",
        icon: Checklist,
        count: openTodosCount,
      },
      {
        title: "Protokolle",
        url: "/protocols",
        icon: DocumentAdd,
      },
      {
        title: "Aktivitäten",
        url: "/activities",
        icon: History,
      },
      {
        title: "Benachrichtigungen",
        url: "/notifications",
        icon: Bell,
      },
    ],
    navSecondary: [
      {
        title: "Was neu ist",
        url: "/new",
        icon: Routing2,
      },
      {
        title: "Hilfe",
        url: "#help",
        icon: QuestionMark,
      },
    ],
    ressources: [
      {
        name: "Ärzte & Dolmetscher",
        url: "/resources",
        icon: Layers,
      },
    ],
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
              <Link href="/" className="flex items-center gap-3 px-1">
              <InstitutLogo size={28}/>
                <div className="flex items-end">

                <span className="text-xl font-semibold font-mono tracking-wide">{institut.name}</span>
                <span className="size-1.5 bg-[#86efac] block rounded-full opacity-60"></span>
           
                </div>
              </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {pathname.startsWith("/settings") ? (
        <SidebarContent>
          <NavSettings />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      ) : (
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavRessources ressources={data.ressources} />
          <NavSecondary
            items={data.navSecondary}
            className="mt-auto"
            news={news}
            newsCount={newsCount}
          />
        </SidebarContent>
      )}
    </Sidebar>
  );
}
