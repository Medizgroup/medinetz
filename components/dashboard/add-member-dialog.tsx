"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserCombobox, {
  type UserComboboxUser,
} from "@/components/user/user-combobox";
import { ROLE_OPTIONS } from "@/lib/utils/organizations/roles";

type Candidate = UserComboboxUser & { isActive: boolean };

/**
 * Admin fügt eine bestehende Person direkt zur Org hinzu — ohne Einladung,
 * die Person muss nichts annehmen.
 */
export default function AddMemberDialog({
  open,
  onOpenChange,
  orgId,
  orgName,
  includeInactive,
  existingUserIds,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgName: string;
  includeInactive: boolean;
  existingUserIds: string[];
  onAdded: () => void;
}) {
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [role, setRole] = React.useState("VIEWER");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let ignore = false;
    fetch(`/api/admin/organizations/${orgId}/candidates`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Candidate[]) => {
        if (!ignore) setCandidates(data);
      });
    return () => {
      ignore = true;
    };
  }, [open, orgId, existingUserIds.length]);

  const selected = candidates.find((c) => c.id === userId);

  async function handleAdd() {
    if (!userId) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        toast.error(data?.error ?? "Hinzufügen fehlgeschlagen.");
        return;
      }
      toast.success(`${selected?.name ?? "Person"} wurde hinzugefügt.`);
      setUserId(null);
      setRole("VIEWER");
      onOpenChange(false);
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mitglied hinzufügen</DialogTitle>
          <DialogDescription>
            Die Person wird direkt Mitglied von „{orgName}“ und bekommt eine
            Benachrichtigung.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <div className="grid gap-4 py-2">
            <Field className="gap-2">
              <FieldLabel>Person</FieldLabel>
              <UserCombobox
                users={candidates}
                value={userId}
                onValueChange={setUserId}
                placeholder="Person auswählen"
              />
              {selected && !selected.isActive && includeInactive ? (
                <FieldDescription>
                  Dieses Konto ist noch nicht freigeschaltet und wird beim
                  Hinzufügen automatisch aktiviert.
                </FieldDescription>
              ) : null}
            </Field>

            <Field className="gap-2">
              <FieldLabel>Rolle</FieldLabel>
              <Select
                items={ROLE_OPTIONS}
                value={role}
                onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup alignItemWithTrigger={false}>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            className="rounded-full"
            onClick={handleAdd}
            disabled={!userId || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
