"use client";

import * as React from "react";
import {
  BookOpen,
  CalendarDays,
  CircleQuestionMark,
  CreditCard,
  Folder,
  Form,
  Frame,
  GalleryHorizontalEnd,
  GalleryVerticalEnd,
  History,
  Home,
  Languages,
  Leaf,
  ListTodo,
  Send,
  Siren,
  Stethoscope,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./dash-project";
import Link from "next/link";
import { NavRessources } from "./nav-ressources";
import { NavSettings } from "./settings/nav/nav-settings";
import { usePathname } from "next/navigation";

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
      title: "Veranstaltungen",
      url: "/events",
      icon: CalendarDays,
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
    },
    {
      title: "Todo's",
      url: "/todos",
      icon: ListTodo,
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
  projects: [
    {
      name: "Routine",
      url: "/routine",
      icon: Frame,
    },
    {
      name: "Schwangerschaft",
      url: "/pregnancy",
      icon: Siren,
    },
    {
      name: "Management",
      url: "/management",
      icon: GalleryHorizontalEnd,
    },
  ],
  ressources: [
    {
      name: "Ressourcen",
      url: "/ressources",
      icon: Folder,
      items: [
        {
          name: "Praxis und Ärzte",
          url: "/doctors",
          icon: Stethoscope,
        },
        {
          name: "Dolmetscher",
          url: "/interpreters",
          icon: Languages,
        },
      ],
    },
    {
      name: "Finanzen",
      url: "/finance",
      icon: CreditCard,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-accent text-indigo-500 flex aspect-square size-10 items-center justify-center rounded-lg">
                  <Leaf className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Medinetz</span>
                  <span className="truncate text-xs">Gießen</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {pathname.startsWith("/settings") ? (
        <SidebarContent>
          <NavSettings />
          {/* <NavProjects projects={data.projects} /> */}
          {/* <NavRessources ressources={data.ressources} /> */}
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      ) : (
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavProjects projects={data.projects} />
          <NavRessources ressources={data.ressources} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
      )}

      <SidebarFooter>
        <NavUser project={data.project} />
      </SidebarFooter>
    </Sidebar>
  );
}
