"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Org = { id: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: "donations" | "expenses";
  item: Record<string, any> | null;
  availableOrgs: Org[];
  onSaved: () => void;
};

export default function FinanceItemDialog({
  open,
  onOpenChange,
  tab,
  item,
  availableOrgs,
  onSaved,
}: Props) {
  const isEdit = Boolean(item);
  const isDonation = tab === "donations";

  // Donation fields
  const [donorName, setDonorName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState("");
  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [receiptSent, setReceiptSent] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [orgId, setOrgId] = React.useState("");

  // Expense fields
  const [description, setDescription] = React.useState("");
  const [vendor, setVendor] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [isPaid, setIsPaid] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    if (item) {
      setAmount(String(item.amount ?? ""));
      setNotes(item.notes ?? "");
      setOrgId(item.organizationId ?? "");
      if (isDonation) {
        setDonorName(item.donorName ?? "");
        setDate(
          item.donationDate
            ? new Date(item.donationDate).toISOString().slice(0, 10)
            : "",
        );
        setIsAnonymous(Boolean(item.isAnonymous));
        setReceiptSent(Boolean(item.receiptSent));
      } else {
        setDescription(item.description ?? "");
        setDate(
          item.expenseDate
            ? new Date(item.expenseDate).toISOString().slice(0, 10)
            : "",
        );
        setVendor(item.vendor ?? "");
        setCategory(item.category ?? "");
        setIsPaid(Boolean(item.isPaid));
      }
    } else {
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setOrgId(availableOrgs[0]?.id ?? "");
      setDonorName("");
      setIsAnonymous(false);
      setReceiptSent(false);
      setDescription("");
      setVendor("");
      setCategory("");
      setIsPaid(false);
    }
  }, [open, item, isDonation, availableOrgs]);

  async function handleSave() {
    if (!amount || !date) {
      setError("Betrag und Datum sind erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = isDonation
      ? {
          amount: Number(amount),
          donationDate: date,
          donorName: donorName || null,
          isAnonymous,
          receiptSent,
          notes: notes || null,
          organizationId: orgId || null,
        }
      : {
          amount: Number(amount),
          expenseDate: date,
          description: description.trim(),
          vendor: vendor || null,
          category: category || null,
          isPaid,
          notes: notes || null,
          organizationId: orgId,
        };

    const url = isEdit
      ? `/api/admin/finance/${tab}/${item!.id}`
      : `/api/admin/finance/${tab}`;
    const method = isEdit ? "PATCH" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => null);
    setSaving(false);

    if (!r.ok) {
      setError(data?.error ?? "Fehler.");
      return;
    }

    toast.success(isEdit ? "Aktualisiert." : "Erstellt.");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? isDonation
                ? "Spende bearbeiten"
                : "Ausgabe bearbeiten"
              : isDonation
                ? "Neue Spende"
                : "Neue Ausgabe"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Finanzeintrag bearbeiten
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
                <FieldLabel>Betrag (€)</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel>Datum</FieldLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>

            {isDonation ? (
              <>
                <Field className="gap-2">
                  <FieldLabel>Spender:in</FieldLabel>
                  <Input
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    disabled={isAnonymous}
                    placeholder={isAnonymous ? "Anonym" : "Name des Spenders"}
                  />
                </Field>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="anon"
                      checked={isAnonymous}
                      onCheckedChange={(c) => setIsAnonymous(c === true)}
                    />
                    <Label htmlFor="anon">Anonym</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="receipt"
                      checked={receiptSent}
                      onCheckedChange={(c) => setReceiptSent(c === true)}
                    />
                    <Label htmlFor="receipt">Quittung gesendet</Label>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Field className="gap-2">
                  <FieldLabel>Beschreibung</FieldLabel>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="z.B. Laborkosten"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field className="gap-2">
                    <FieldLabel>Anbieter</FieldLabel>
                    <Input
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel>Kategorie</FieldLabel>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="z.B. Medikamente"
                    />
                  </Field>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="paid"
                    checked={isPaid}
                    onCheckedChange={(c) => setIsPaid(c === true)}
                  />
                  <Label htmlFor="paid">Bezahlt</Label>
                </div>
              </>
            )}

            <Field className="gap-2">
              <FieldLabel>Organisation</FieldLabel>
              <Select value={orgId} onValueChange={(v) => setOrgId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isDonation ? "Allgemein (optional)" : "wählen…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isDonation ? (
                    <SelectItem value="">Allgemein (keine Org)</SelectItem>
                  ) : null}
                  {availableOrgs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Speichern
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
