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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TagInput } from "./tag-input";
import type { ResourceRow, ResourceType } from "@/lib/types/resources";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: ResourceType;
  resource?: ResourceRow | null;
  onSaved: () => void;
};

export default function ResourceFormDialog({
  open,
  onOpenChange,
  defaultType,
  resource,
  onSaved,
}: Props) {
  const isEdit = Boolean(resource);

  const [type, setType] = React.useState<ResourceType>(
    resource?.type ?? defaultType,
  );
  const [name, setName] = React.useState("");
  const [specialty, setSpecialty] = React.useState("");
  const [practiceName, setPracticeName] = React.useState("");
  const [languages, setLanguages] = React.useState<string[]>([]);
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [availability, setAvailability] = React.useState<
    "HIGH" | "MEDIUM" | "LOW"
  >("MEDIUM");
  const [acceptsNewPatients, setAcceptsNewPatients] = React.useState(true);
  const [hourlyRate, setHourlyRate] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [isActive, setIsActive] = React.useState(true);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [geoStatus, setGeoStatus] = React.useState<
    "idle" | "found" | "notfound"
  >("idle");

  // Hydrate beim Öffnen
  React.useEffect(() => {
    if (!open) return;
    if (resource) {
      setType(resource.type);
      setName(resource.name);
      setLanguages(resource.languages);
      setPhone(resource.phone ?? "");
      setEmail(resource.email ?? "");
      setAddress(resource.address ?? "");
      setNotes(resource.notes ?? "");
      setAvailability(resource.availability ?? "MEDIUM");
      setTags(resource.tags);
      setIsActive(resource.isActive);
      if (resource.type === "DOCTOR") {
        setSpecialty(resource.specialty ?? "");
        setPracticeName(resource.practiceName ?? "");
        setAcceptsNewPatients(resource.acceptsNewPatients);
        setHourlyRate("");
      } else {
        setSpecialty("");
        setPracticeName("");
        setAcceptsNewPatients(true);
        setHourlyRate(
          resource.hourlyRate !== null ? String(resource.hourlyRate) : "",
        );
      }
    } else {
      // Neuanlage: zurücksetzen
      setType(defaultType);
      setName("");
      setSpecialty("");
      setPracticeName("");
      setLanguages([]);
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");
      setAvailability("MEDIUM");
      setAcceptsNewPatients(true);
      setHourlyRate("");
      setTags([]);
      setIsActive(true);
    }
    setError(null);
    setGeoStatus("idle");
  }, [open, resource, defaultType]);

  // Live-Geokodierung beim Tippen (debounced)
  React.useEffect(() => {
    if (!address.trim()) {
      setGeoStatus("idle");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
        const data = await r.json();
        setGeoStatus(data.result ? "found" : "notfound");
      } catch {
        setGeoStatus("notfound");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [address]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Name ist erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      type,
      name: name.trim(),
      languages,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
      availability,
      tags,
      isActive,
    };

    if (type === "DOCTOR") {
      payload.specialty = specialty || null;
      payload.practiceName = practiceName || null;
      payload.acceptsNewPatients = acceptsNewPatients;
    } else {
      payload.hourlyRate = hourlyRate || null;
    }

    const url = isEdit
      ? `/api/resources/${resource!.type.toLowerCase()}/${resource!.id}`
      : "/api/resources";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setError(data?.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className=" z-10000">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? type === "DOCTOR"
                ? "Arzt/Ärztin bearbeiten"
                : "Dolmetscher:in bearbeiten"
              : type === "DOCTOR"
                ? "Neue:r Arzt/Ärztin"
                : "Neue:r Dolmetscher:in"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ressource bearbeiten
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {error ? (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 py-4">
            {!isEdit ? (
              <Field className="gap-2">
                <FieldLabel>Typ</FieldLabel>
                <Select
                  value={type}
                  items={[
                    { value: "DOCTOR", label: "Arzt / Ärztin" },
                    { value: "INTERPRETER", label: "Dolmetscher:in" },
                  ]}
                  onValueChange={(v) => setType(v as ResourceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCTOR">Arzt / Ärztin</SelectItem>
                    <SelectItem value="INTERPRETER">Dolmetscher:in</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            ) : null}

            <Field className="gap-2">
              <FieldLabel>Name</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            {type === "DOCTOR" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field className="gap-2">
                  <FieldLabel>Fachrichtung</FieldLabel>
                  <Input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </Field>
                <Field className="gap-2">
                  <FieldLabel>Praxisname</FieldLabel>
                  <Input
                    value={practiceName}
                    onChange={(e) => setPracticeName(e.target.value)}
                  />
                </Field>
              </div>
            ) : null}

            <Field className="gap-2">
              <FieldLabel>Sprachen</FieldLabel>
              <TagInput
                value={languages}
                onChange={setLanguages}
                placeholder="Sprache eingeben + Enter"
              />
              <FieldDescription>z.B. Deutsch, Arabisch, Farsi</FieldDescription>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Telefon</FieldLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel>E-Mail</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>

            <Field className="gap-2">
              <FieldLabel>Adresse</FieldLabel>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Straße, PLZ Ort"
              />
              {address.trim() && geoStatus === "found" ? (
                <FieldDescription className="text-green-600">
                  Adresse gefunden — Pin wird auf der Karte angezeigt
                </FieldDescription>
              ) : null}
              {address.trim() && geoStatus === "notfound" ? (
                <FieldDescription className="text-amber-600">
                  Adresse nicht eindeutig — wird ohne Pin gespeichert
                </FieldDescription>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Verfügbarkeit</FieldLabel>
                <Select
                  value={availability}
                  onValueChange={(v) => setAvailability(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Hoch</SelectItem>
                    <SelectItem value="MEDIUM">Mittel</SelectItem>
                    <SelectItem value="LOW">Niedrig</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {type === "INTERPRETER" ? (
                <Field className="gap-2">
                  <FieldLabel>Stundensatz (€)</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </Field>
              ) : null}
            </div>

            {type === "DOCTOR" ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="accepts-patients"
                  checked={acceptsNewPatients}
                  onCheckedChange={(c) => setAcceptsNewPatients(c === true)}
                />
                <Label htmlFor="accepts-patients">
                  Nimmt neue Patient:innen an
                </Label>
              </div>
            ) : null}

            <Field className="gap-2">
              <FieldLabel>Tags</FieldLabel>
              <TagInput
                value={tags}
                onChange={setTags}
                placeholder="Tag + Enter"
              />
            </Field>

            <Field className="gap-2">
              <FieldLabel>Notizen (intern)</FieldLabel>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is-active"
                checked={isActive}
                onCheckedChange={(c) => setIsActive(c === true)}
              />
              <Label htmlFor="is-active">Aktiv</Label>
            </div>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
