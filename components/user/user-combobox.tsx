"use client";

import * as React from "react";
import { ChevronsUpDownIcon, UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import UserAvatar from "./user-avatar";

export type UserComboboxUser = {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
};

/** Zusatz-Einträge über der Personenliste, z.B. „Alle“ oder „Niemand“. */
export type UserComboboxSpecial = {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

type Option =
  | ({ type: "special" } & UserComboboxSpecial)
  | ({ type: "user"; value: string; label: string } & UserComboboxUser);

/**
 * Personen-Auswahl im Stil von reui c-combobox-23: Trigger mit Avatar,
 * Suchfeld im Popup, optionale Sonder-Einträge (Niemand / Alle) oben.
 * Zentral für „Zugewiesen an“ in Fall-Liste, Fall-Detail und Todos.
 */
export default function UserCombobox({
  users,
  value,
  onValueChange,
  specialOptions = [],
  placeholder = "Niemand zugewiesen",
  searchPlaceholder = "Person suchen…",
  currentUserId,
  disabled,
  className,
  size = "default",
}: {
  users: UserComboboxUser[];
  /** userId oder value eines Sonder-Eintrags; null = nichts gewählt */
  value: string | null;
  onValueChange: (value: string | null) => void;
  specialOptions?: UserComboboxSpecial[];
  placeholder?: string;
  searchPlaceholder?: string;
  currentUserId?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
}) {
  const options = React.useMemo<Option[]>(
    () => [
      ...specialOptions.map((o) => ({ type: "special" as const, ...o })),
      ...users.map((u) => ({
        type: "user" as const,
        ...u,
        value: u.id,
        label: u.name,
      })),
    ],
    [specialOptions, users],
  );

  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Combobox<Option>
      items={options}
      value={selected}
      onValueChange={(o) => onValueChange(o?.value ?? null)}
      itemToStringLabel={(o) => o.label}
      itemToStringValue={(o) => o.value}
      isItemEqualToValue={(a, b) => a.value === b.value}
      filter={(o, query) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return [o.label, o.type === "user" ? o.email : ""]
          .filter(Boolean)
          .some((s) => s!.toLowerCase().includes(q));
      }}
      disabled={disabled}
      autoHighlight>
      <ComboboxTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={size}
            className={cn(
              "w-full min-w-0 justify-between gap-2 font-normal",
              className,
            )}
          />
        }>
        <ComboboxValue>
          {(o: Option | null) =>
            o ? (
              <OptionLabel option={o} currentUserId={currentUserId} />
            ) : (
              <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <UserIcon className="size-4 shrink-0" />
                <span className="truncate">{placeholder}</span>
              </span>
            )
          }
        </ComboboxValue>
        <ChevronsUpDownIcon className="size-3.5 shrink-0 opacity-60" />
      </ComboboxTrigger>

      <ComboboxPopup className="min-w-64">
        <div className="border-b p-1">
          <ComboboxInput
            showTrigger={false}
            placeholder={searchPlaceholder}
            className="border-none shadow-none"
            size="sm"
          />
        </div>
        <ComboboxEmpty>Niemand gefunden.</ComboboxEmpty>
        <ComboboxList>
          {(o: Option) => (
            <ComboboxItem key={o.value} value={o}>
              <OptionLabel option={o} currentUserId={currentUserId} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}

function OptionLabel({
  option,
  currentUserId,
}: {
  option: Option;
  currentUserId?: string;
}) {
  if (option.type === "special") {
    const Icon = option.icon ?? UserIcon;
    return (
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{option.label}</span>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-2">
      <UserAvatar name={option.name} avatarUrl={option.avatarUrl} size={20} />
      <span className="truncate">{option.name}</span>
      {option.id === currentUserId ? (
        <span className="shrink-0 text-muted-foreground">(Du)</span>
      ) : null}
    </span>
  );
}
