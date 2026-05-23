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
  SidebarMenuButton,
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

export function AppSidebar({
  openTodosCount,
  assignedCasesCount,
  eventsCount,
  organizations,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  openTodosCount: number;
  assignedCasesCount: number;
  eventsCount: number;
  organizations: { id: string; name: string; color: string; slug: string }[];
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
            <SidebarMenuButton
              size="lg"
              asChild
              className="px-0! hover:bg-transparent!">
              <Link href="/" className="flex items-center">
                <Image
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
                />
              </Link>
            </SidebarMenuButton>
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
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      )}
    </Sidebar>
  );
}
