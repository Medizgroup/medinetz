"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

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
} from "@/components/ui/command";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import UserDefaultAvatar from "@/components/user/user-default-avatar";
import { UserIcon } from "lucide-react";
import { CASE_STATUS_OPTIONS } from "@/lib/constant";

type Member = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
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
            size="sm"
            className="w-fit max-w-full rounded-full px-2.5 font-normal">
            <span className="flex min-w-0 items-center gap-1.5">
              {selected ? (
                selected.avatarUrl ? (
                  <Avatar className="size-5">
                    <AvatarImage
                      alt={selected.displayName}
                      src={selected.avatarUrl}
                    />
                  </Avatar>
                ) : (
                  <UserDefaultAvatar name={selected.displayName} size={20} />
                )
              ) : (
                <UserIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">
                {selected ? selected.displayName : "Niemand zugewiesen"}
              </span>
            </span>
            <ChevronDown className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverPopup className="min-w-65 w-full p-0 max-h-96" align="start">
        <Command items={searchableItems}>
          <CommandInput placeholder="Suchen…" className="w-full" />
          <CommandEmpty>Niemand gefunden.</CommandEmpty>

          <CommandList className="max-h-80 overflow-y-auto">
            {(item: (typeof searchableItems)[number]) => (
              <CommandItem
                key={item.value}
                value={item.keywords}
                onClick={() => {
                  onChange(item.member.id);
                  setOpen(false);
                }}>
                <div className="flex items-center gap-2 justify-between w-full">
                  <span className="flex min-w-0 items-center gap-2">
                    {item.member.avatarUrl ? (
                      <Avatar className="size-5">
                        <AvatarImage
                          alt={item.member.displayName}
                          src={item.member.avatarUrl}
                        />
                      </Avatar>
                    ) : (
                      <UserDefaultAvatar
                        name={item.member.displayName}
                        size={20}
                      />
                    )}
                    <span className="truncate">{item.member.displayName}</span>
                  </span>
                  <Check
                    className={cn(
                      "size-4 shrink-0",
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
