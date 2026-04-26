"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  async function onAssigneeChange(value: string) {
    setSavingAssignee(true);
    const ok = await patch({ assigneeId: value === "none" ? null : value });
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
          onValueChange={onStatusChange}
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
        <Select
          value={assigneeId ?? "none"}
          onValueChange={onAssigneeChange}
          disabled={savingAssignee}>
          <SelectTrigger>
            <SelectValue placeholder="Niemand zugewiesen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Niemand —</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
