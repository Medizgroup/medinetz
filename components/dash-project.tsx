"use client";

import { LucideIcon } from "lucide-react";

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavUser({
  project,
}: {
  project: {
    projectName: string;
    projectAvatar: string;
    projectUrl: string;
    projectIcon: LucideIcon;
  };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex-1 text-left text-sm leading-tight flex items-center gap-2 px-2">
          {project.projectIcon && (
            <project.projectIcon className="size-4 text-indigo-500" />
          )}

          <span className="truncate font-medium">{project.projectName}</span>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
