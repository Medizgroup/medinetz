"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export default function CreateOrgDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [type, setType] = React.useState("ROUTINE");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setName("");
      setSlug("");
      setType("ROUTINE");
      setError(null);
    }
  }, [open]);

  // Slug auto-generieren aus Name
  React.useEffect(() => {
    setSlug(
      name
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }, [name]);

  async function handleCreate() {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);

    const r = await fetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim(), type }),
    });

    const data = await r.json().catch(() => null);
    setSaving(false);

    if (!r.ok) {
      setError(data?.error ?? "Fehler beim Erstellen.");
      return;
    }

    toast.success(`Organisation „${name}" erstellt.`);
    onCreated();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Organisation erstellen</DialogTitle>
          <DialogDescription className="sr-only">
            Neue Organisation anlegen
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
                placeholder="z.B. Medinetz Gießen"
              />
            </Field>

            <Field className="gap-2">
              <FieldLabel>Slug (URL-Kennung)</FieldLabel>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="medinetz-giessen"
              />
              <FieldDescription>
                Wird automatisch aus dem Namen generiert. Nur Kleinbuchstaben,
                Zahlen, Bindestriche.
              </FieldDescription>
            </Field>

            <Field className="gap-2">
              <FieldLabel>Typ</FieldLabel>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Routine</SelectItem>
                  <SelectItem value="PREGNANCY">Schwangerschaft</SelectItem>
                  <SelectItem value="MANAGEMENT">Verwaltung</SelectItem>
                  <SelectItem value="CUSTOM">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Erstellen
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
