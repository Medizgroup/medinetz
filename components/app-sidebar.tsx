"use client";

import * as React from "react";
import {
  Baby,
  BookOpen,
  Bot,
  Form,
  Frame,
  GalleryHorizontal,
  GalleryHorizontalEnd,
  GalleryVerticalEnd,
  History,
  Home,
  Leaf,
  LifeBuoy,
  ListTodo,
  Map,
  PieChart,
  Send,
  Settings2,
  Siren,
  ToolCase,
  Users,
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
import { NavUser } from "./nav-user";
import Link from "next/link";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: Home,
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
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-accent text-indigo-500 flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Leaf className="size-5" />
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
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
