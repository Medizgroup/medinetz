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
            <SidebarMenuButton
              size="lg"
              asChild
              className="px-0! hover:bg-transparent!">
              <Link href="/" className="flex items-center">
                <Image
                  className="dark:hidden"
                  src="/Logo/Medizgroup-light.svg"
                  alt="Medizgroup Logo"
                  width={200}
                  height={80}
                />
                <Image
                  className="hidden dark:inline"
                  src="/Logo/Medizgroup-dark.svg"
                  alt="Medizgroup Logo"
                  width={200}
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
