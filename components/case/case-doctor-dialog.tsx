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

export type CaseDoctorForEdit = {
  id: string;
  doctor: {
    id: string;
    name: string;
    specialty: string | null;
    practiceName: string | null;
  };
  appointmentDate: string | null;
  appointmentNotes: string | null;
  invoiceReceived: boolean;
  invoiceAmount: number | null;
  invoiceDate: string | null;
  invoicePaid: boolean;
  diagnosis: string | null;
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  doctorOptions: ResourceOption[];
  caseDoctor?: CaseDoctorForEdit | null;
  onSaved: () => void;
};

export default function CaseDoctorDialog({
  open,
  onOpenChange,
  caseId,
  doctorOptions,
  caseDoctor,
  onSaved,
}: Props) {
  const isEdit = Boolean(caseDoctor);

  const [doctorId, setDoctorId] = React.useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = React.useState("");
  const [appointmentNotes, setAppointmentNotes] = React.useState("");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [invoiceReceived, setInvoiceReceived] = React.useState(false);
  const [invoiceAmount, setInvoiceAmount] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState("");
  const [invoicePaid, setInvoicePaid] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (caseDoctor) {
      setDoctorId(caseDoctor.doctor.id);
      setAppointmentDate(
        caseDoctor.appointmentDate
          ? new Date(caseDoctor.appointmentDate).toISOString().slice(0, 10)
          : "",
      );
      setAppointmentNotes(caseDoctor.appointmentNotes ?? "");
      setDiagnosis(caseDoctor.diagnosis ?? "");
      setNotes(caseDoctor.notes ?? "");
      setInvoiceReceived(caseDoctor.invoiceReceived);
      setInvoiceAmount(
        caseDoctor.invoiceAmount !== null
          ? String(caseDoctor.invoiceAmount)
          : "",
      );
      setInvoiceDate(
        caseDoctor.invoiceDate
          ? new Date(caseDoctor.invoiceDate).toISOString().slice(0, 10)
          : "",
      );
      setInvoicePaid(caseDoctor.invoicePaid);
    } else {
      setDoctorId(null);
      setAppointmentDate("");
      setAppointmentNotes("");
      setDiagnosis("");
      setNotes("");
      setInvoiceReceived(false);
      setInvoiceAmount("");
      setInvoiceDate("");
      setInvoicePaid(false);
    }
    setError(null);
  }, [open, caseDoctor]);

  async function handleSave() {
    if (!doctorId) {
      setError("Bitte einen Arzt/eine Ärztin auswählen.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      doctorId,
      appointmentDate: appointmentDate || null,
      appointmentNotes: appointmentNotes || null,
      diagnosis: diagnosis || null,
      notes: notes || null,
      invoiceReceived,
      invoiceAmount: invoiceAmount || null,
      invoiceDate: invoiceDate || null,
      invoicePaid,
    };
    const url = isEdit
      ? `/api/case-doctors/${caseDoctor!.id}`
      : `/api/cases/${caseId}/doctors`;
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
    const res = await fetch(`/api/case-doctors/${caseDoctor!.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Arzt-Zuweisung bearbeiten" : "Arzt zuweisen"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Termin und Rechnungsdaten pflegen
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
              <FieldLabel>Arzt/Ärztin</FieldLabel>
              {isEdit ? (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  {caseDoctor!.doctor.name}
                  {caseDoctor!.doctor.specialty ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {caseDoctor!.doctor.specialty}
                    </span>
                  ) : null}
                </div>
              ) : (
                <ResourcePicker
                  options={doctorOptions}
                  value={doctorId}
                  onChange={setDoctorId}
                  placeholder="Arzt/Ärztin auswählen…"
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

            <Field className="gap-2">
              <FieldLabel>Termin-Notizen</FieldLabel>
              <Textarea
                rows={2}
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
              />
            </Field>

            <Field className="gap-2">
              <FieldLabel>Diagnose (vom Arzt)</FieldLabel>
              <Textarea
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </Field>

            <Field className="gap-2">
              <FieldLabel>Notizen</FieldLabel>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            <div className="space-y-3 rounded-md border p-3">
              <div className="text-xs font-medium text-muted-foreground uppercase">
                Rechnung
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="cd-invoice-received"
                  checked={invoiceReceived}
                  onCheckedChange={(c) => setInvoiceReceived(c === true)}
                />
                <Label htmlFor="cd-invoice-received">Rechnung erhalten</Label>
              </div>

              {invoiceReceived ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field className="gap-2">
                      <FieldLabel>Betrag (€)</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                      />
                    </Field>
                    <Field className="gap-2">
                      <FieldLabel>Rechnungsdatum</FieldLabel>
                      <Input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cd-invoice-paid"
                      checked={invoicePaid}
                      onCheckedChange={(c) => setInvoicePaid(c === true)}
                    />
                    <Label htmlFor="cd-invoice-paid">Bezahlt</Label>
                  </div>
                </>
              ) : null}
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
