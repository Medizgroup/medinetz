"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
};

export default function ResourcePicker({
  options,
  value,
  onChange,
  placeholder = "Auswählen…",
  emptyMessage = "Keine Treffer.",
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
            <span className="flex items-center gap-2 truncate">
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
                  "relative",
                  value === item.id ? "bg-accent" : "",
                )}>
                <Check
                  className={cn(
                    "size-4 absolute right-1 top-2",
                    value === item.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  {item.subtitle ? (
                    <span className="text-xs text-muted-foreground">
                      {item.subtitle}
                    </span>
                  ) : null}
                </div>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverPopup>
    </Popover>
  );
}
