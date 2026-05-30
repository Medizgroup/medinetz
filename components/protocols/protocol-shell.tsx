"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sidebar } from "@solar-icons/react-perf/category/style/LineDuotone";

export const STORAGE_KEY = "protocol-sidebar-open";

export function ProtocolShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // To avoid calling setState synchronously in the effect body and causing cascading render,
    // do the localStorage read, and then set state in a microtask.
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      Promise.resolve().then(() => setOpen(saved === "true"));
    }
    // Hydration flag should always be set, even if no saved exists
    Promise.resolve().then(() => setHydrated(true));
  }, []);

  React.useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, String(open));
  }, [open, hydrated]);

  return (
    <div className="w-full">
      <div className="hidden md:flex justify-end px-6 pt-4 sticky -top-2">
        <Button
          variant="ghost"
          size="xl"
          className="rounded-full text-muted-foreground"
          onClick={() => setOpen((o) => !o)}>
          <Sidebar className="size-5" />
          {open ? "Seitenleiste ausblenden" : "einblenden"}
        </Button>
      </div>

      <div className={cn("grid gap-4", open ? "grid-cols-9" : "grid-cols-10")}>
        <div
          className={cn(
            "mx-auto w-full max-w-6xl px-6 py-8 pt-1 space-y-10",
            open ? "col-span-7" : "col-span-9",
          )}>
          {children}
        </div>

        {open ? (
          <aside className="hidden md:block  h-96 col-span-2 mt-12 sticky top-16 px-4 space-y-8">
            {sidebar}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
