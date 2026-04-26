"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";

export type AssigneeOption = {
  id: string;
  name: string;
  email?: string;
};

export default function AssigneeFilter({
  options,
  value,
  onChange,
}: {
  options: AssigneeOption[];
  /** "all" | "unassigned" | userId */
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => {
    if (value === "all") return null;
    if (value === "unassigned")
      return { id: "unassigned", name: "Nicht zugewiesen" };
    return options.find((o) => o.id === value) ?? null;
  }, [value, options]);

  // Items, die die Autocomplete-Suche durchsucht.
  // Nur die echten Personen — "Alle" / "Nicht zugewiesen" stehen als
  // statische Items DRÜBER und sind nicht Teil der Suche.
  const searchableItems = React.useMemo(
    () =>
      options.map((p) => ({
        value: p.id,
        label: p.name,
        keywords: [p.name, p.email ?? ""].join(" ").toLowerCase(),
        person: p,
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
            className="w-[220px] justify-between font-normal">
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">
                {selected ? selected.name : "Zugewiesen an"}
              </span>
            </span>

            {value !== "all" ? (
              <X
                className="ml-1 size-3.5 shrink-0 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("all");
                }}
              />
            ) : (
              <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
            )}
          </Button>
        }
      />
      <PopoverPopup className="p-0 -px-2.5!" align="start">
        <Command items={searchableItems}>
          <CommandInput placeholder="Suchen…" className="" />

          {/* Quick actions — nicht filterbar */}
          <div className="px-1 pt-1">
            <CommandItem
              value="__all__"
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}>
              <Check
                className={cn(
                  "size-4",
                  value === "all" ? "opacity-100 text-blue-500" : "opacity-0",
                )}
              />
              Alle
            </CommandItem>
            <CommandItem
              value="__unassigned__"
              onClick={() => {
                onChange("unassigned");
                setOpen(false);
              }}>
              <Check
                className={cn(
                  "size-4 text-blue-500",
                  value === "unassigned" ? "opacity-100" : "opacity-0",
                )}
              />
              Nicht zugewiesen
            </CommandItem>
          </div>

          <CommandSeparator />

          <CommandEmpty>Niemand gefunden.</CommandEmpty>

          <CommandList>
            {(item: (typeof searchableItems)[number]) => (
              <CommandItem
                key={item.value}
                value={item.keywords}
                onClick={() => {
                  onChange(item.person.id);
                  setOpen(false);
                }}>
                <Check
                  className={cn(
                    "size-4 text-blue-500 ",
                    value === item.person.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="ml-1 flex flex-col">
                  <span>{item.person.name}</span>
                  {item.person.email ? (
                    <span className="text-xs text-muted-foreground">
                      {item.person.email}
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
