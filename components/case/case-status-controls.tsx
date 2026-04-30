"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronsUpDown, UserCircle2 } from "lucide-react";

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
import { CASE_STATUS_OPTIONS } from "@/lib/constant";

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
      {/* Status */}
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase">Status</div>
        <Select
          value={status}
          items={CASE_STATUS_OPTIONS}
          onValueChange={(value) => {
            if (value !== null) onStatusChange(value);
          }}
          disabled={savingStatus}>
          <SelectTrigger>
            <SelectValue>
              {(() => {
                const current = CASE_STATUS_OPTIONS.find(
                  (opt) => opt.value === status,
                );
                if (!current) return null;
                return (
                  <span className="flex items-center gap-2">
                    <span
                      className={cn("size-1.5 rounded-full", current.color)}
                    />
                    <span>{current.label}</span>
                  </span>
                );
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {CASE_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <span className="flex items-center gap-2">
                  <span className={cn("size-1.5 rounded-full", status.color)} />
                  <span>{status.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-foreground uppercase">
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
            <ChevronDown className="ml-1 size-3.5 shrink-0" />
          </Button>
        }
      />
      <PopoverPopup className="min-w-[260px] w-full" align="start">
        <Command items={searchableItems}>
          <CommandInput
            placeholder="Suchen…"
            className="border! border-border! w-full"
          />
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
                <div className="flex items-center gap-2 justify-between w-full">
                  <span>{item.member.displayName}</span>
                  <Check
                    className={cn(
                      "size-4",
                      assigneeId === item.member.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </div>
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverPopup>
    </Popover>
  );
}
