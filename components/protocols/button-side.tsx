"use client";
import * as React from "react";
import { Button } from "../ui/button";
import { STORAGE_KEY } from "./protocol-shell";
import { Sidebar } from "@solar-icons/react-perf/category/style/LineDuotone";

export default function ButtonSide() {
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
    <div className="hidden md:flex justify-end px-6 pt-4 ">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full text-muted-foreground"
        onClick={() => setOpen((o) => !o)}>
        <Sidebar className="size-4" />
        {open ? "Seitenleiste ausblenden" : "Seitenleiste einblenden"}
      </Button>
    </div>
  );
}
