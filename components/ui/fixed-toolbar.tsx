"use client";

import { Toolbar } from "./toolbar";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "./tooltip";

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <TooltipProvider>
      <Toolbar {...props} className={cn(props.className, "border w-full")} />
    </TooltipProvider>
  );
}
