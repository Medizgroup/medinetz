"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";

export type MedicationForEdit = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  prescribedAt: string | null;
  isActive: boolean;
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  medication?: MedicationForEdit | null;
  onSaved: () => void;
};

export default function MedicationDialog({
  open,
  onOpenChange,
  patientId,
  medication,
  onSaved,
}: Props) {
  const isEdit = Boolean(medication);

  const [name, setName] = React.useState("");
  const [dosage, setDosage] = React.useState("");
  const [frequency, setFrequency] = React.useState("");
  const [prescribedAt, setPrescribedAt] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [notes, setNotes] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (medication) {
      setName(medication.name);
      setDosage(medication.dosage ?? "");
      setFrequency(medication.frequency ?? "");
      setPrescribedAt(
        medication.prescribedAt
          ? new Date(medication.prescribedAt).toISOString().slice(0, 10)
          : "",
      );
      setIsActive(medication.isActive);
      setNotes(medication.notes ?? "");
    } else {
      setName("");
      setDosage("");
      setFrequency("");
      setPrescribedAt("");
      setIsActive(true);
      setNotes("");
    }
    setError(null);
  }, [open, medication]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Name ist erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);

    const url = isEdit
      ? `/api/medications/${medication!.id}`
      : `/api/patients/${patientId}/medications`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        dosage: dosage || null,
        frequency: frequency || null,
        prescribedAt: prescribedAt || null,
        isActive,
        notes: notes || null,
      }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    onSaved();
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Medikament wirklich löschen?")) return;
    const res = await fetch(`/api/medications/${medication!.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Medikament bearbeiten" : "Neues Medikament"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Medikament pflegen
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {error ? (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 py-4">
            <Field className="gap-2">
              <FieldLabel>Name</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Metformin"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Dosierung</FieldLabel>
                <Input
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="z.B. 500mg"
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel>Häufigkeit</FieldLabel>
                <Input
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="z.B. 2x täglich"
                />
              </Field>
            </div>

            <Field className="gap-2">
              <FieldLabel>Verschrieben am</FieldLabel>
              <Input
                type="date"
                value={prescribedAt}
                onChange={(e) => setPrescribedAt(e.target.value)}
              />
            </Field>

            <div className="flex items-center gap-2">
              <Checkbox
                id="medication-active"
                checked={isActive}
                onCheckedChange={(c) => setIsActive(c === true)}
              />
              <Label htmlFor="medication-active">Aktiv eingenommen</Label>
            </div>

            <Field className="gap-2">
              <FieldLabel>Notizen</FieldLabel>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </div>
        </DialogPanel>

        <DialogFooter className="sm:justify-between">
          {isEdit ? (
            <Button variant="outline" onClick={handleDelete}>
              Löschen
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Speichern
            </Button>
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
