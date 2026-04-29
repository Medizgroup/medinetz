"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
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

export type DiagnosisForEdit = {
  id: string;
  description: string;
  icdCode: string | null;
  diagnosedAt: string | null;
  isActive: boolean;
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  diagnosis?: DiagnosisForEdit | null;
  onSaved: () => void;
};

export default function DiagnosisDialog({
  open,
  onOpenChange,
  patientId,
  diagnosis,
  onSaved,
}: Props) {
  const isEdit = Boolean(diagnosis);

  const [description, setDescription] = React.useState("");
  const [icdCode, setIcdCode] = React.useState("");
  const [diagnosedAt, setDiagnosedAt] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [notes, setNotes] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (diagnosis) {
      setDescription(diagnosis.description);
      setIcdCode(diagnosis.icdCode ?? "");
      setDiagnosedAt(
        diagnosis.diagnosedAt
          ? new Date(diagnosis.diagnosedAt).toISOString().slice(0, 10)
          : "",
      );
      setIsActive(diagnosis.isActive);
      setNotes(diagnosis.notes ?? "");
    } else {
      setDescription("");
      setIcdCode("");
      setDiagnosedAt("");
      setIsActive(true);
      setNotes("");
    }
    setError(null);
  }, [open, diagnosis]);

  async function handleSave() {
    if (!description.trim()) {
      setError("Beschreibung ist erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);

    const url = isEdit
      ? `/api/diagnoses/${diagnosis!.id}`
      : `/api/patients/${patientId}/diagnoses`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description.trim(),
        icdCode: icdCode || null,
        diagnosedAt: diagnosedAt || null,
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
    if (!isEdit || !confirm("Diagnose wirklich löschen?")) return;

    const res = await fetch(`/api/diagnoses/${diagnosis!.id}`, {
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
            {isEdit ? "Diagnose bearbeiten" : "Neue Diagnose"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Diagnose pflegen
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
              <FieldLabel>Beschreibung</FieldLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. Depression"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>ICD-10 Code</FieldLabel>
                <Input
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value.toUpperCase())}
                  placeholder="z.B. F32.1"
                />
                <FieldDescription>Optional — falls bekannt</FieldDescription>
              </Field>
              <Field className="gap-2">
                <FieldLabel>Diagnostiziert am</FieldLabel>
                <Input
                  type="date"
                  value={diagnosedAt}
                  onChange={(e) => setDiagnosedAt(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="diagnosis-active"
                checked={isActive}
                onCheckedChange={(c) => setIsActive(c === true)}
              />
              <Label htmlFor="diagnosis-active">Aktive Diagnose</Label>
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
