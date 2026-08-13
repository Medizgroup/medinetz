"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@solar-icons/react-perf/category/style/LineDuotone";

export const STORAGE_KEY = "protocol-sidebar-open";

export function ProtocolShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
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
    <div className="w-full max-w-full">
      <div className="flex justify-end px-4 pt-4 sm:px-6 lg:sticky lg:-top-2">
        <Button
          variant="ghost"
          size="xl"
          className="rounded-full text-muted-foreground"
          onClick={() => setOpen((o) => !o)}>
          <Sidebar className="size-5" />
          <span className="hidden sm:inline">
            {open ? "Seitenleiste ausblenden" : "Seitenleiste einblenden"}
          </span>
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-500 flex-col gap-8 px-4 pt-1 pb-8 sm:px-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-10">{children}</div>

        {open ? (
          <aside className="w-full shrink-0 space-y-8 border-t pt-8 lg:sticky lg:top-16 lg:w-80 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:border-t-0 lg:pt-0 xl:w-120 px-4">
            {sidebar}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
