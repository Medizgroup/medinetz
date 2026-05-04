"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  Gauge,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard/home", label: "Übersicht", icon: Gauge },
  {
    href: "/dashboard/users",
    label: "Benutzer",
    icon: UsersRound,
    adminOnly: true,
  },
  {
    href: "/dashboard/organizations",
    label: "Organisationen",
    icon: Building2,
    adminOnly: true,
  },
  {
    href: "/dashboard/finance",
    label: "Finanzen",
    icon: CreditCard,
    adminOnly: true,
  },
  {
    href: "/dashboard/resources",
    label: "Ressourcen",
    icon: Stethoscope,
    adminOnly: true,
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
                "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition-colors ease-in",
                active
                  ? "bg-accent text-blue-500 font-medium "
                  : "text-foreground hover:bg-accent hover:text-blue-500",
              )}>
              <Icon
                className={cn("size-4 ", active ? "fill-blue-500/10" : "")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
