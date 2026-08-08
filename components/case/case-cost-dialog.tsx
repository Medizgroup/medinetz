/* eslint-disable react-hooks/set-state-in-effect */
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";

export type CaseCostCategory =
  | "DOCTOR"
  | "INTERPRETER"
  | "MEDICATION"
  | "LAB"
  | "OTHER";

export const CASE_COST_CATEGORY_LABEL: Record<CaseCostCategory, string> = {
  DOCTOR: "Arzt",
  INTERPRETER: "Dolmetscher",
  MEDICATION: "Medikamente",
  LAB: "Labor",
  OTHER: "Sonstiges",
};

export type CaseCostForEdit = {
  id: string;
  category: CaseCostCategory;
  description: string;
  amount: number;
  invoiceDate: string | null;
  invoicePaid: boolean;
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  cost?: CaseCostForEdit | null;
  onSaved: () => void;
};

export default function CaseCostDialog({
  open,
  onOpenChange,
  caseId,
  cost,
  onSaved,
}: Props) {
  const isEdit = Boolean(cost);

  const [category, setCategory] = React.useState<CaseCostCategory>("OTHER");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState("");
  const [invoicePaid, setInvoicePaid] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (cost) {
      setCategory(cost.category);
      setDescription(cost.description);
      setAmount(String(cost.amount));
      setInvoiceDate(
        cost.invoiceDate
          ? new Date(cost.invoiceDate).toISOString().slice(0, 10)
          : "",
      );
      setInvoicePaid(cost.invoicePaid);
      setNotes(cost.notes ?? "");
    } else {
      setCategory("OTHER");
      setDescription("");
      setAmount("");
      setInvoiceDate("");
      setInvoicePaid(false);
      setNotes("");
    }
    setError(null);
  }, [open, cost]);

  async function handleSave() {
    if (!description.trim()) {
      setError("Bitte eine Beschreibung angeben.");
      return;
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setError("Bitte einen gültigen Betrag angeben.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      category,
      description: description.trim(),
      amount: amountNum,
      invoiceDate: invoiceDate || null,
      invoicePaid,
      notes: notes || null,
    };

    const url = isEdit
      ? `/api/case-costs/${cost!.id}`
      : `/api/cases/${caseId}/costs`;
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
    if (!isEdit || !confirm("Kosteneintrag wirklich löschen?")) return;
    const res = await fetch(`/api/case-costs/${cost!.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-115">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Kosteneintrag bearbeiten" : "Kosten erfassen"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Direkte Kosten für diesen Fall erfassen
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {error ? (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Kategorie</FieldLabel>
                <Select
                  value={category}
                  onValueChange={(v) =>
                    v && setCategory(v as CaseCostCategory)
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(CASE_COST_CATEGORY_LABEL) as [
                        CaseCostCategory,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="gap-2">
                <FieldLabel>Betrag (€)</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
            </div>

            <Field className="gap-2">
              <FieldLabel>Beschreibung</FieldLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. Blutbild, Rezeptgebühr…"
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

            <Field className="gap-2">
              <FieldLabel>Notizen</FieldLabel>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                id="cc-invoice-paid"
                checked={invoicePaid}
                onCheckedChange={(c) => setInvoicePaid(c === true)}
              />
              <Label htmlFor="cc-invoice-paid">Bezahlt</Label>
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
