"use client";

import * as React from "react";
import {
  BookOpen,
  CalendarIcon,
  CircleQuestionMark,
  Folder,
  Form,
  Frame,
  GalleryVerticalEnd,
  History,
  Home,
  ListTodo,
  Panda,
  Send,
} from "lucide-react";

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
    project: {
      projectName: "Routine",
      projectAvatar: "",
      projectUrl: "/routine",
      projectIcon: Frame,
    },
    navMain: [
      {
        title: "Home",
        url: "/home",
        icon: Home,
      },
      {
        title: "Kalender",
        url: "/events",
        icon: CalendarIcon,
        count: eventsCount,
      },
      {
        title: "Protokolle",
        url: "/protocols",
        icon: Form,
      },
      {
        title: "Fälle",
        url: "/cases",
        icon: GalleryVerticalEnd,
        count: assignedCasesCount,
      },
      {
        title: "Todo's",
        url: "/todos",
        icon: ListTodo,
        count: openTodosCount,
      },
      {
        title: "Aktivitäten",
        url: "/activities",
        icon: History,
      },
      {
        title: "Wikis",
        url: "/wikis",
        icon: BookOpen,
      },
    ],
    navSecondary: [
      {
        title: "Hilfe",
        url: "#",
        icon: CircleQuestionMark,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
    organizations: organizations,
    ressources: [
      {
        name: "Ressourcen",
        url: "/resources",
        icon: Folder,
      },
    ],
  };
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-accent  flex aspect-square size-10 items-center justify-center rounded-2xl">
                  <Panda className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-xl leading-tight">
                  <span className="truncate font-semibold">Medizgroup</span>
                </div>
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
