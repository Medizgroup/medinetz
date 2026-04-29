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

import ResourcePicker, { type ResourceOption } from "./resource-picker";

export type CaseInterpreterForEdit = {
  id: string;
  interpreter: {
    id: string;
    name: string;
    languages: string[];
  };
  appointmentDate: string | null;
  hoursWorked: number | null;
  cost: number | null;
  invoiceReceived: boolean;
  invoicePaid: boolean;
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  interpreterOptions: ResourceOption[];
  caseInterpreter?: CaseInterpreterForEdit | null;
  onSaved: () => void;
};

export default function CaseInterpreterDialog({
  open,
  onOpenChange,
  caseId,
  interpreterOptions,
  caseInterpreter,
  onSaved,
}: Props) {
  const isEdit = Boolean(caseInterpreter);

  const [interpreterId, setInterpreterId] = React.useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = React.useState("");
  const [hoursWorked, setHoursWorked] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [invoiceReceived, setInvoiceReceived] = React.useState(false);
  const [invoicePaid, setInvoicePaid] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (caseInterpreter) {
      setInterpreterId(caseInterpreter.interpreter.id);
      setAppointmentDate(
        caseInterpreter.appointmentDate
          ? new Date(caseInterpreter.appointmentDate).toISOString().slice(0, 10)
          : "",
      );
      setHoursWorked(
        caseInterpreter.hoursWorked !== null
          ? String(caseInterpreter.hoursWorked)
          : "",
      );
      setCost(
        caseInterpreter.cost !== null ? String(caseInterpreter.cost) : "",
      );
      setNotes(caseInterpreter.notes ?? "");
      setInvoiceReceived(caseInterpreter.invoiceReceived);
      setInvoicePaid(caseInterpreter.invoicePaid);
    } else {
      setInterpreterId(null);
      setAppointmentDate("");
      setHoursWorked("");
      setCost("");
      setNotes("");
      setInvoiceReceived(false);
      setInvoicePaid(false);
    }
    setError(null);
  }, [open, caseInterpreter]);

  async function handleSave() {
    if (!interpreterId) {
      setError("Bitte eine:n Dolmetscher:in auswählen.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      interpreterId,
      appointmentDate: appointmentDate || null,
      hoursWorked: hoursWorked || null,
      cost: cost || null,
      notes: notes || null,
      invoiceReceived,
      invoicePaid,
    };

    const url = isEdit
      ? `/api/case-interpreters/${caseInterpreter!.id}`
      : `/api/cases/${caseId}/interpreters`;
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    if (!isEdit || !confirm("Zuweisung wirklich löschen?")) return;
    const res = await fetch(`/api/case-interpreters/${caseInterpreter!.id}`, {
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
            {isEdit
              ? "Dolmetscher-Zuweisung bearbeiten"
              : "Dolmetscher zuweisen"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Dolmetscher-Termin pflegen
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
              <FieldLabel>Dolmetscher:in</FieldLabel>
              {isEdit ? (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {caseInterpreter!.interpreter.name}
                  {caseInterpreter!.interpreter.languages.length > 0 ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {caseInterpreter!.interpreter.languages.join(", ")}
                    </span>
                  ) : null}
                </div>
              ) : (
                <ResourcePicker
                  options={interpreterOptions}
                  value={interpreterId}
                  onChange={setInterpreterId}
                  placeholder="Dolmetscher:in auswählen…"
                />
              )}
            </Field>

            <Field className="gap-2">
              <FieldLabel>Termin</FieldLabel>
              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Stunden</FieldLabel>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel>Kosten (€)</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </Field>
            </div>

            <Field className="gap-2">
              <FieldLabel>Notizen</FieldLabel>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            <div className="flex items-center gap-4 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ci-invoice-received"
                  checked={invoiceReceived}
                  onCheckedChange={(c) => setInvoiceReceived(c === true)}
                />
                <Label htmlFor="ci-invoice-received">Rechnung erhalten</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ci-invoice-paid"
                  checked={invoicePaid}
                  onCheckedChange={(c) => setInvoicePaid(c === true)}
                />
                <Label htmlFor="ci-invoice-paid">Bezahlt</Label>
              </div>
            </div>
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
