"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";

type Member = {
  id: string;
  displayName: string;
  email: string;
};

export default function CaseStatusControls({
  caseId,
  status,
  assigneeId,
  members,
}: {
  caseId: string;
  status: string;
  assigneeId: string | null;
  members: Member[];
}) {
  const router = useRouter();
  const [savingStatus, setSavingStatus] = React.useState(false);
  const [savingAssignee, setSavingAssignee] = React.useState(false);

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch(`/api/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  }

  async function onStatusChange(value: string) {
    setSavingStatus(true);
    const ok = await patch({ status: value });
    setSavingStatus(false);
    if (ok) router.refresh();
  }

  async function onAssigneeChange(value: string | null) {
    setSavingAssignee(true);
    const ok = await patch({ assigneeId: value });
    setSavingAssignee(false);
    if (ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase">
          Status
        </div>
        <Select
          value={status}
          items={[
            { label: "Offen", value: "OPEN" },
            { label: "In Bearbeitung", value: "IN_PROGRESS" },
            { label: "Wartend", value: "WAITING" },
            { label: "Abgeschlossen", value: "CLOSED" },
          ]}
          onValueChange={(value) => {
            if (value !== null) onStatusChange(value);
          }}
          disabled={savingStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Offen</SelectItem>
            <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
            <SelectItem value="WAITING">Wartend</SelectItem>
            <SelectItem value="CLOSED">Abgeschlossen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase">
          Zugewiesen an
        </div>
        <AssigneeCombobox
          members={members}
          assigneeId={assigneeId}
          onChange={onAssigneeChange}
          disabled={savingAssignee}
        />
      </div>
    </div>
  );
}

function AssigneeCombobox({
  members,
  assigneeId,
  onChange,
  disabled,
}: {
  members: Member[];
  assigneeId: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => members.find((m) => m.id === assigneeId) ?? null,
    [members, assigneeId],
  );

  const searchableItems = React.useMemo(
    () =>
      members.map((m) => ({
        value: m.id,
        label: m.displayName,
        keywords: `${m.displayName} ${m.email}`.toLowerCase(),
        member: m,
      })),
    [members],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal">
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">
                {selected ? selected.displayName : "Niemand zugewiesen"}
              </span>
            </span>
            <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverPopup className="w-[260px] p-0" align="start">
        <Command items={searchableItems}>
          <CommandInput placeholder="Suchen…" />
          <CommandEmpty>Niemand gefunden.</CommandEmpty>

          <CommandList>
            {(item: (typeof searchableItems)[number]) => (
              <CommandItem
                key={item.value}
                value={item.keywords}
                onClick={() => {
                  onChange(item.member.id);
                  setOpen(false);
                }}>
                <Check
                  className={cn(
                    "size-4",
                    assigneeId === item.member.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="flex flex-col ml-2">
                  <span>{item.member.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.member.email}
                  </span>
                </div>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverPopup>
    </Popover>
  );
}
