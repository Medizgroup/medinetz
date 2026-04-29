"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

export type PatientForEdit = {
  id: string;
  pseudonym: string;
  birthYear: number | null;
  gender: "FEMALE" | "MALE" | "DIVERSE" | "UNKNOWN";
  countryOfOrigin: string | null;
  primaryLanguage: string | null;
  postalCodePrefix: string | null;
  residenceStatus:
    | "UNDOCUMENTED"
    | "ASYLUM_PROCESS"
    | "TOLERATED"
    | "RECOGNIZED"
    | "EU_CITIZEN_NO_INSURANCE"
    | "OTHER";
  insuranceStatus: "NONE" | "BG" | "KSCHG" | "OTHER";
  notes: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: PatientForEdit;
  onSaved: () => void;
};

export default function PatientEditDialog({
  open,
  onOpenChange,
  patient,
  onSaved,
}: Props) {
  const [pseudonym, setPseudonym] = React.useState(patient.pseudonym);
  const [birthYear, setBirthYear] = React.useState(
    patient.birthYear !== null ? String(patient.birthYear) : "",
  );
  const [gender, setGender] = React.useState<PatientForEdit["gender"]>(
    patient.gender,
  );
  const [countryOfOrigin, setCountryOfOrigin] = React.useState(
    patient.countryOfOrigin ?? "",
  );
  const [primaryLanguage, setPrimaryLanguage] = React.useState(
    patient.primaryLanguage ?? "",
  );
  const [postalCodePrefix, setPostalCodePrefix] = React.useState(
    patient.postalCodePrefix ?? "",
  );
  const [residenceStatus, setResidenceStatus] = React.useState<
    PatientForEdit["residenceStatus"]
  >(patient.residenceStatus);
  const [insuranceStatus, setInsuranceStatus] = React.useState<
    PatientForEdit["insuranceStatus"]
  >(patient.insuranceStatus);

  const [notes, setNotes] = React.useState(patient.notes ?? "");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setPseudonym(patient.pseudonym);
    setBirthYear(patient.birthYear !== null ? String(patient.birthYear) : "");
    setGender(patient.gender);
    setCountryOfOrigin(patient.countryOfOrigin ?? "");
    setPrimaryLanguage(patient.primaryLanguage ?? "");
    setPostalCodePrefix(patient.postalCodePrefix ?? "");
    setResidenceStatus(patient.residenceStatus);
    setInsuranceStatus(patient.insuranceStatus);
    setNotes(patient.notes ?? "");
    setError(null);
  }, [open, patient]);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/patients/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonym: pseudonym.trim(),
        birthYear: birthYear === "" ? null : Number(birthYear),
        gender,
        countryOfOrigin: countryOfOrigin || null,
        primaryLanguage: primaryLanguage || null,
        postalCodePrefix: postalCodePrefix.trim().slice(0, 3) || null,
        residenceStatus,
        insuranceStatus,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Patient bearbeiten</DialogTitle>
          <DialogDescription className="sr-only">
            Patient-Daten bearbeiten
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
              <FieldLabel>Pseudonym</FieldLabel>
              <Input
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Geburtsjahr</FieldLabel>
                <Input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="z.B. 1985"
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel>Geschlecht</FieldLabel>
                <Select
                  value={gender}
                  onValueChange={(v) =>
                    setGender(v as PatientForEdit["gender"])
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">Weiblich</SelectItem>
                    <SelectItem value="MALE">Männlich</SelectItem>
                    <SelectItem value="DIVERSE">Divers</SelectItem>
                    <SelectItem value="UNKNOWN">Unbekannt</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Herkunftsland</FieldLabel>
                <Input
                  value={countryOfOrigin}
                  onChange={(e) => setCountryOfOrigin(e.target.value)}
                  placeholder="z.B. Syrien"
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel>Sprache</FieldLabel>
                <Input
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field className="gap-2">
                <FieldLabel>PLZ (3-stellig)</FieldLabel>
                <Input
                  value={postalCodePrefix}
                  maxLength={3}
                  onChange={(e) => setPostalCodePrefix(e.target.value)}
                  placeholder="353"
                />
              </Field>
              <Field className="gap-2">
                <FieldLabel>Aufenthaltsstatus</FieldLabel>
                <Select
                  value={residenceStatus}
                  onValueChange={(v) =>
                    setResidenceStatus(v as PatientForEdit["residenceStatus"])
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNDOCUMENTED">Ohne Papiere</SelectItem>
                    <SelectItem value="ASYLUM_PROCESS">
                      Im Asylverfahren
                    </SelectItem>
                    <SelectItem value="TOLERATED">Geduldet</SelectItem>
                    <SelectItem value="RECOGNIZED">Anerkannt</SelectItem>
                    <SelectItem value="EU_CITIZEN_NO_INSURANCE">
                      EU-Bürger ohne KV
                    </SelectItem>
                    <SelectItem value="OTHER">Sonstige</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="gap-2">
                <FieldLabel>Versicherung</FieldLabel>
                <Select
                  value={insuranceStatus}
                  onValueChange={(v) =>
                    setInsuranceStatus(v as PatientForEdit["insuranceStatus"])
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Keine</SelectItem>
                    <SelectItem value="BG">BG</SelectItem>
                    <SelectItem value="KSCHG">
                      Krankenscheinabrechnung
                    </SelectItem>
                    <SelectItem value="OTHER">Andere</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field className="gap-2">
              <FieldLabel>Notizen (intern)</FieldLabel>
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
