/* eslint-disable react-hooks/purity */
"use client";

import * as React from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { IconComponent } from "./nav-main";
import {
  Sheet,
  SheetClose,
  SheetFooter,
  SheetHeader,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { News } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const categoryLabels: Record<News["category"], string> = {
  RELEASE: "Veröffentlichung",
  BUGFIX: "Fehlerbehebung",
  UPDATE: "Aktualisierung",
  NEWS: "Neuigkeit",
  ANNOUNCEMENT: "Ankündigung",
};

const THREE_WEEKS_MS = 1000 * 60 * 60 * 24 * 21;

export function NavSecondary({
  items,
  news,
  newsCount,
  ...props
}: {
  items: { title: string; url: string; icon: IconComponent }[];
  news?: News[];
  newsCount?: number;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item, key) => {
            if (item.url === "/new") {
              return (
                <Sheet key={key}>
                  <SheetTrigger asChild>
                    <SidebarMenuButton size="sm" className="justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </div>
                      {!!newsCount && (
                        <span className="font-medium text-orange-500">
                          {newsCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SheetTrigger>

                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>
                        Was ist neu bei Medinetz&#39;s App
                      </SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col gap-3 overflow-y-auto px-4 divide-y">
                      {news?.length ? (
                        news.map((entry) => (
                          <NewsCard key={entry.id} entry={entry} />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Keine Neuigkeiten vorhanden.
                        </p>
                      )}
                    </div>

                    <SheetFooter>
                      <SheetClose asChild>
                        <Button variant="ghost">Schließen</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              );
            }

            return (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton asChild size="sm">
                  <Link href={item.url} className="justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NewsCard({ entry }: { entry: News }) {
  const isRecent =
    Date.now() - new Date(entry.createdAt).getTime() < THREE_WEEKS_MS;

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1.5 flex items-center gap-2 justify-between">
        <span
          className={cn(
            " text-xs font-medium text-orange-500",
            entry.category === "BUGFIX"
              ? "text-rose-500"
              : entry.category === "RELEASE"
                ? "text-orange-500"
                : entry.category === "UPDATE"
                  ? "text-violet-500"
                  : entry.category === "ANNOUNCEMENT"
                    ? "text-emerald-500"
                    : "text-blue-500",
          )}>
          {categoryLabels[entry.category]}
        </span>
        {isRecent && (
          <span className="rounded-full size-2.5 bg-orange-500"></span>
        )}
      </div>

      <h4 className="text-sm font-semibold truncate">{entry.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>

      <div className="mt-2 flex items-center gap-3 text-xs">
        {entry.badge && (
          <Badge
            variant={
              entry.badge === "SECURITY"
                ? "error"
                : entry.badge === "UI"
                  ? "info"
                  : entry.badge === "ADMIN"
                    ? "warning"
                    : entry.badge === "GENERAL"
                      ? "success"
                      : entry.badge === "UX"
                        ? "destructive"
                        : "secondary"
            }
            size="sm">
            {entry.badge}
          </Badge>
        )}
        {entry.link && (
          <Link href={entry.link} className="text-primary hover:underline">
            Ansehen
          </Link>
        )}
        {entry.readMore && (
          <Link
            href={entry.readMore}
            className="text-muted-foreground hover:underline">
            Mehr lesen
          </Link>
        )}
        <span className="ml-auto text-muted-foreground">
          {new Date(entry.createdAt).toLocaleDateString("de-DE")}
        </span>
      </div>
    </div>
  );
}
