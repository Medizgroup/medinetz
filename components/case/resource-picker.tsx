"use client";

import * as React from "react";
import { Check, ChevronsUpDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";

export type ResourceOption = {
  id: string;
  name: string;
  subtitle?: string;
};

type Props = {
  options: ResourceOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  icon?: LucideIcon;
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function ResourcePicker({
  options,
  value,
  onChange,
  placeholder = "Auswählen…",
  emptyMessage = "Keine Treffer.",
  icon: Icon,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  const items = React.useMemo(
    () =>
      options.map((o) => ({
        ...o,
        keywords: `${o.name} ${o.subtitle ?? ""}`.toLowerCase(),
      })),
    [options],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal">
            <span className="flex min-w-0 items-center gap-2">
              {selected ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                  {initialsOf(selected.name)}
                </span>
              ) : Icon ? (
                <Icon className="size-4 shrink-0 text-muted-foreground" />
              ) : null}
              <span className="truncate">
                {selected ? selected.name : placeholder}
              </span>
            </span>
            <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverPopup className="p-0 max-w-sm max-h-96" align="start">
        <Command items={items}>
          <CommandInput placeholder="Suchen…" />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandList className={"max-h-80 overflow-y-auto"}>
            {(item: (typeof items)[number]) => (
              <CommandItem
                key={item.id}
                value={item.keywords}
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between gap-2",
                  value === item.id ? "bg-accent" : "",
                )}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                    {initialsOf(item.name)}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{item.name}</span>
                    {item.subtitle ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    value === item.id ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverPopup>
    </Popover>
  );
}
