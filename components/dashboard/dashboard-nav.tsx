"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  CardTransfer,
  Layers,
  PieChart2,
  Shop,
  UsersGroupRounded,
} from "@solar-icons/react-perf/category/style/LineDuotone";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard/home", label: "Übersicht", icon: PieChart2 },
  {
    href: "/dashboard/users",
    label: "Benutzer",
    icon: UsersGroupRounded,
    adminOnly: true,
  },
  {
    href: "/dashboard/organizations",
    label: "Organisationen",
    icon: Shop,
    adminOnly: true,
  },
  {
    href: "/dashboard/finance",
    label: "Finanzen",
    icon: CardTransfer,
    adminOnly: true,
  },
  {
    href: "/dashboard/resources",
    label: "Ressourcen",
    icon: Layers,
    adminOnly: false,
  },
];

export default function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname() ?? "";

  const visibleItems = navItems.filter((item) =>
    item.adminOnly ? isAdmin : true,
  );

  return (
    <div className="">
      <nav className="flex flex-wrap gap-1 px-4 py-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-sm transition-colors ease-in",
                active
                  ? "bg-accent text-orange-500 font-medium "
                  : "text-foreground hover:bg-accent hover:text-orange-500",
              )}>
              <Icon
                className={cn("size-5 ", active ? "fill-orange-500/10" : "")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
