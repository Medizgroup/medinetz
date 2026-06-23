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
  Documents,
  Layers,
  QuestionMark,
  Plain,
} from "@/lib/icons";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";
import Link from "next/link";
import { NavRessources } from "./nav-ressources";
import { NavSettings } from "./settings/nav/nav-settings";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Routing2 } from "@solar-icons/react-perf/category/style/LineDuotone";
import { News } from "@/generated/prisma/client";
import Avatar from "boring-avatars";

export function AppSidebar({
  openTodosCount,
  assignedCasesCount,
  eventsCount,
  organizations,
  news,
  newsCount,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  openTodosCount: number;
  assignedCasesCount: number;
  eventsCount: number;
  organizations: { id: string; name: string; color: string; slug: string }[];
  news: News[];
  newsCount: number;
}) {
  const pathname = usePathname();

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
        count: eventsCount,
      },
      {
        title: "Protokolle",
        url: "/protocols",
        icon: DocumentAdd,
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
        title: "Aktivitäten",
        url: "/activities",
        icon: History,
      },
      {
        title: "Benachrichtigungen",
        url: "/notifications",
        icon: Bell,
      },
      {
        title: "Wikis",
        url: "/wikis",
        icon: Documents,
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
        url: "#",
        icon: QuestionMark,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Plain,
      },
    ],
    organizations: organizations,
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
                <Avatar size={28} name="Mediznetz Medizgroup" variant="beam"/>
                <div className="flex items-end">

                <span className="text-xl font-semibold font-mono tracking-wide">Medizgroup</span>
                <span className="size-1.5 bg-[#92a1c6] block rounded-full opacity-60"></span>
           
                </div>

                {/* <Image
                  className="dark:hidden"
                  src="/Logo/Medizgroup-light.svg"
                  alt="Medizgroup Logo"
                  width={180}
                  height={75}
                />
                <Image
                  className="hidden dark:inline"
                  src="/Logo/Medizgroup-dark.svg"
                  alt="Medizgroup Logo"
                  width={180}
                  height={80}
                /> */}
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
          <NavProjects organizations={data.organizations} />
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
