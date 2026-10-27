"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserRoundX } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserCombobox from "@/components/user/user-combobox";
import { CASE_STATUS_OPTIONS } from "@/lib/constant";

const NONE = "__none__";
const UNASSIGNED = [{ value: NONE, label: "Niemand", icon: UserRoundX }];

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
  currentUserId,
}: {
  caseId: string;
  status: string;
  assigneeId: string | null;
  members: Member[];
  currentUserId?: string;
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
        <UserCombobox
          users={members.map((m) => ({
            id: m.id,
            name: m.displayName,
            email: m.email,
            avatarUrl: m.avatarUrl,
          }))}
          specialOptions={UNASSIGNED}
          value={assigneeId ?? NONE}
          onValueChange={(v) => onAssigneeChange(!v || v === NONE ? null : v)}
          currentUserId={currentUserId}
          disabled={savingAssignee}
        />
      </div>
    </div>
  );
}
