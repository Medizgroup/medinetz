/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { ChevronsUpDown, X, SearchIcon, Check, UserRoundX } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/helper/user";
import { Field } from "../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Spinner } from "../ui/spinner";

type User = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  selectedUser?: User | null; // wenn vorhanden, wird der Trigger ohne Fetch korrekt befüllt
  placeholder?: string;
};

export default function UserPicker({
  value,
  onChange,
  selectedUser,
  placeholder = "Niemand zugewiesen",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Wenn der zugewiesene User nicht in der Trefferliste ist, separat nachladen
  const [resolvedSelected, setResolvedSelected] = React.useState<User | null>(
    selectedUser ?? null,
  );

  React.useEffect(() => {
    setResolvedSelected(selectedUser ?? null);
  }, [selectedUser]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`,
        );
        if (r.ok) {
          const data: User[] = await r.json();
          if (!cancelled) setUsers(Array.isArray(data) ? data : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  const items = React.useMemo(
    () =>
      users.map((u) => ({
        ...u,
        keywords: `${u.displayName} ${u.email}`.toLowerCase(),
      })),
    [users],
  );

  function handleSelect(u: User) {
    setResolvedSelected(u);
    onChange(u.id);
    setOpen(false);
  }

  function handleClear(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setResolvedSelected(null);
    onChange(null);
  }

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
              {resolvedSelected ? (
                <>
                  <Avatar className="size-5">
                    <AvatarImage src={resolvedSelected.avatarUrl ?? ""} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(resolvedSelected.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {resolvedSelected.displayName}
                  </span>
                </>
              ) : (
                <>
                  <span className="truncate text-muted-foreground">
                    {placeholder}
                  </span>
                </>
              )}
            </span>
            {value ? (
              <X
                className="ml-1 size-3.5 shrink-0 opacity-60 hover:opacity-100"
                onClick={handleClear}
              />
            ) : (
              <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
            )}
          </Button>
        }
      />
      <PopoverPopup className="p-0! m-0! w-full!" align="start">
        <Command items={items}>
          <Field className="">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon className="text-muted-foreground size-4" />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Suchen..."
              />
              <InputGroupAddon align="inline-end">
                {loading ? (
                  <Spinner />
                ) : (
                  <Button
                    variant="ghost"
                    title="Auswahl löschen"
                    size="icon-xs"
                    onClick={() => {
                      setResolvedSelected(null);
                      onChange(null);
                      setOpen(false);
                    }}>
                    <UserRoundX className="size-3.5" />
                  </Button>
                )}
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <CommandEmpty>{loading ? "Lädt…" : "Niemand gefunden."}</CommandEmpty>

          <CommandList className="px-0!">
            {(item) => (
              <CommandItem
                key={item.id}
                value={item.keywords}
                className={cn(
                  " rounded-lg gap-2",
                  value === item.id ? "bg-sidebar-accent relative" : "",
                )}
                onClick={() => handleSelect(item)}>
                {value === item.id && (
                  <Check className="size-4 absolute right-2" />
                )}
                <Avatar className="size-6">
                  <AvatarImage src={item.avatarUrl ?? ""} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(item.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span>{item.displayName}</span>
                </div>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverPopup>
    </Popover>
  );
}
