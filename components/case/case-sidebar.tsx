"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit2, Languages, Plus, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import CaseStatusControls from "./case-status-controls";
import PatientEditDialog, {
  type PatientForEdit,
} from "@/components/patients/patient-edit-dialog";
import DiagnosisDialog, {
  type DiagnosisForEdit,
} from "@/components/patients/diagnosis-dialog";
import MedicationDialog, {
  type MedicationForEdit,
} from "@/components/patients/medication-dialog";
import { ResourceOption } from "./resource-picker";
import CaseDoctorDialog, { CaseDoctorForEdit } from "./case-doctor-dialog";
import CaseInterpreterDialog, {
  CaseInterpreterForEdit,
} from "./case-interpreter-dialog";

type Member = { id: string; displayName: string; email: string };

type PatientFull = PatientForEdit & {
  diagnoses: DiagnosisForEdit[];
  medications: MedicationForEdit[];
};

const RESIDENCE_LABEL: Record<PatientForEdit["residenceStatus"], string> = {
  UNDOCUMENTED: "Ohne Papiere",
  ASYLUM_PROCESS: "Im Asylverfahren",
  TOLERATED: "Geduldet",
  RECOGNIZED: "Anerkannt",
  EU_CITIZEN_NO_INSURANCE: "EU-Bürger ohne KV",
  OTHER: "Sonstige",
};

const INSURANCE_LABEL: Record<PatientForEdit["insuranceStatus"], string> = {
  NONE: "Keine",
  BG: "BG",
  KSCHG: "Krankenschein",
  OTHER: "Andere",
};

const GENDER_LABEL: Record<PatientForEdit["gender"], string> = {
  FEMALE: "♀",
  MALE: "♂",
  DIVERSE: "⚧",
  UNKNOWN: "—",
};

type Props = {
  caseId: string;
  patientId: string;
  status: string;
  assigneeId: string | null;
  members: Member[];
  estimatedCosts: number | null;
  totalCosts: number;
  dueDate: Date | null;
  canEditCase: boolean;
  canEditPatient: boolean;
  doctorOptions: ResourceOption[];
  interpreterOptions: ResourceOption[];
};

export default function CaseSidebar({
  caseId,
  patientId,
  status,
  assigneeId,
  members,
  estimatedCosts,
  totalCosts,
  dueDate,
  canEditCase,
  canEditPatient,
  doctorOptions,
  interpreterOptions,
}: Props) {
  const router = useRouter();
  const [patient, setPatient] = React.useState<PatientFull | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [patientDialogOpen, setPatientDialogOpen] = React.useState(false);
  const [diagnosisDialogOpen, setDiagnosisDialogOpen] = React.useState(false);
  const [editingDiagnosis, setEditingDiagnosis] =
    React.useState<DiagnosisForEdit | null>(null);
  const [medDialogOpen, setMedDialogOpen] = React.useState(false);
  const [editingMed, setEditingMed] = React.useState<MedicationForEdit | null>(
    null,
  );
  const [caseDoctors, setCaseDoctors] = React.useState<CaseDoctorForEdit[]>([]);
  const [caseInterpreters, setCaseInterpreters] = React.useState<
    CaseInterpreterForEdit[]
  >([]);

  const [doctorDialogOpen, setDoctorDialogOpen] = React.useState(false);
  const [editingCaseDoctor, setEditingCaseDoctor] =
    React.useState<CaseDoctorForEdit | null>(null);
  const [interpreterDialogOpen, setInterpreterDialogOpen] =
    React.useState(false);
  const [editingCaseInterpreter, setEditingCaseInterpreter] =
    React.useState<CaseInterpreterForEdit | null>(null);

  const reloadDoctors = React.useCallback(async () => {
    const r = await fetch(`/api/cases/${caseId}/doctors`);
    if (!r.ok) return;
    const data = await r.json();
    setCaseDoctors(data.items);
  }, [caseId]);

  const reloadInterpreters = React.useCallback(async () => {
    const r = await fetch(`/api/cases/${caseId}/interpreters`);
    if (!r.ok) return;
    const data = await r.json();
    setCaseInterpreters(data.items);
  }, [caseId]);

  React.useEffect(() => {
    reloadDoctors();
    reloadInterpreters();
  }, [reloadDoctors, reloadInterpreters]);

  const onCaseResourceSaved = () => {
    reloadDoctors();
    reloadInterpreters();
    router.refresh(); // damit totalCosts aktualisiert wird
  };

  const reloadPatient = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/patients/${patientId}`);
      if (!r.ok) return;
      const data = await r.json();
      setPatient(data.patient);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  React.useEffect(() => {
    reloadPatient();
  }, [reloadPatient]);

  const onPatientSaved = () => {
    reloadPatient();
    router.refresh();
  };

  return (
    <aside className="space-y-5">
      {/* STATUS + ZUWEISUNG */}
      {canEditCase ? (
        <CaseStatusControls
          caseId={caseId}
          status={status}
          assigneeId={assigneeId}
          members={members}
        />
      ) : null}

      <Separator />

      {/* PATIENT */}
      <SectionHeader
        title="Patient"
        action={
          canEditPatient ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => setPatientDialogOpen(true)}>
              <Edit2 className="size-3" />
            </Button>
          ) : null
        }
      />

      {loading || !patient ? (
        <div className="text-xs text-muted-foreground">Lädt…</div>
      ) : (
        <div className="space-y-1.5 text-sm">
          <div className="font-medium tabular-nums">{patient.pseudonym}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{GENDER_LABEL[patient.gender]}</span>
            {patient.birthYear ? (
              <span>
                {patient.birthYear} (
                {new Date().getFullYear() - patient.birthYear} J.)
              </span>
            ) : null}
            {patient.primaryLanguage ? (
              <span>{patient.primaryLanguage}</span>
            ) : null}
            {patient.countryOfOrigin ? (
              <span>{patient.countryOfOrigin}</span>
            ) : null}
            {patient.postalCodePrefix ? (
              <span>PLZ {patient.postalCodePrefix}xx</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="secondary" className="text-[10px]">
              {RESIDENCE_LABEL[patient.residenceStatus]}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {INSURANCE_LABEL[patient.insuranceStatus]}
            </Badge>
          </div>
        </div>
      )}

      <Separator />

      {/* DIAGNOSEN */}
      <SectionHeader
        title="Diagnosen"
        action={
          canEditPatient ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => {
                setEditingDiagnosis(null);
                setDiagnosisDialogOpen(true);
              }}>
              <Plus className="size-3" />
            </Button>
          ) : null
        }
      />
      {patient && patient.diagnoses.length === 0 ? (
        <div className="text-xs text-muted-foreground">Keine Diagnosen.</div>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {patient?.diagnoses.map((d) => (
            <li
              key={d.id}
              className={`group flex items-start justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted/40 ${
                !d.isActive ? "opacity-60" : ""
              }`}>
              <div className="min-w-0 flex-1">
                {d.icdCode ? (
                  <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                    {d.icdCode}
                  </span>
                ) : null}
                <span>{d.description}</span>
                {!d.isActive ? (
                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                    (inaktiv)
                  </span>
                ) : null}
              </div>
              {canEditPatient ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDiagnosis(d);
                    setDiagnosisDialogOpen(true);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 className="size-3 text-muted-foreground" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Separator />

      {/* MEDIKAMENTE */}
      <SectionHeader
        title="Medikamente"
        action={
          canEditPatient ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => {
                setEditingMed(null);
                setMedDialogOpen(true);
              }}>
              <Plus className="size-3" />
            </Button>
          ) : null
        }
      />
      {patient && patient.medications.length === 0 ? (
        <div className="text-xs text-muted-foreground">Keine Medikamente.</div>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {patient?.medications.map((m) => (
            <li
              key={m.id}
              className={`group flex items-start justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted/40 ${
                !m.isActive ? "opacity-60" : ""
              }`}>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {[m.dosage, m.frequency].filter(Boolean).join(" · ") || "—"}
                  {!m.isActive ? " · inaktiv" : null}
                </div>
              </div>
              {canEditPatient ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMed(m);
                    setMedDialogOpen(true);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 className="size-3 text-muted-foreground" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Separator />

      {/* ÄRZT:INNEN */}
      <SectionHeader
        title="Ärzt:innen"
        action={
          canEditCase ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => {
                setEditingCaseDoctor(null);
                setDoctorDialogOpen(true);
              }}>
              <Plus className="size-3" />
            </Button>
          ) : null
        }
      />
      {caseDoctors.length === 0 ? (
        <div className="text-xs text-muted-foreground">Niemand zugewiesen.</div>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {caseDoctors.map((cd) => (
            <li
              key={cd.id}
              className="group flex items-start justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="size-3 shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate">{cd.doctor.name}</span>
                </div>
                {cd.doctor.specialty ? (
                  <div className="ml-4 text-xs text-muted-foreground">
                    {cd.doctor.specialty}
                  </div>
                ) : null}
                {cd.appointmentDate ? (
                  <div className="ml-4 text-xs text-muted-foreground">
                    {new Date(cd.appointmentDate).toLocaleDateString("de-DE")}
                  </div>
                ) : null}
                {cd.invoiceReceived ? (
                  <div className="ml-4 text-xs">
                    <Badge
                      variant={cd.invoicePaid ? "info" : "warning"}
                      className="text-[10px]">
                      {cd.invoiceAmount?.toFixed(2)} €{" "}
                      {cd.invoicePaid ? "✓ bezahlt" : "offen"}
                    </Badge>
                  </div>
                ) : null}
              </div>
              {canEditCase ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCaseDoctor(cd);
                    setDoctorDialogOpen(true);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 className="size-3 text-muted-foreground" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Separator />

      {/* DOLMETSCHER:INNEN */}
      <SectionHeader
        title="Dolmetscher:innen"
        action={
          canEditCase ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => {
                setEditingCaseInterpreter(null);
                setInterpreterDialogOpen(true);
              }}>
              <Plus className="size-3" />
            </Button>
          ) : null
        }
      />
      {caseInterpreters.length === 0 ? (
        <div className="text-xs text-muted-foreground">Niemand zugewiesen.</div>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {caseInterpreters.map((ci) => (
            <li
              key={ci.id}
              className="group flex items-start justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Languages className="size-3 shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate">
                    {ci.interpreter.name}
                  </span>
                </div>
                {ci.interpreter.languages.length > 0 ? (
                  <div className="ml-4 text-xs text-muted-foreground">
                    {ci.interpreter.languages.join(", ")}
                  </div>
                ) : null}
                {ci.appointmentDate ? (
                  <div className="ml-4 text-xs text-muted-foreground">
                    {new Date(ci.appointmentDate).toLocaleDateString("de-DE")}
                    {ci.hoursWorked ? ` · ${ci.hoursWorked}h` : ""}
                  </div>
                ) : null}
                {ci.invoiceReceived ? (
                  <div className="ml-4 text-xs">
                    <Badge
                      variant={ci.invoicePaid ? "info" : "warning"}
                      className="text-[10px]">
                      {ci.cost?.toFixed(2)} €{" "}
                      {ci.invoicePaid ? "✓ bezahlt" : "offen"}
                    </Badge>
                  </div>
                ) : null}
              </div>
              {canEditCase ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCaseInterpreter(ci);
                    setInterpreterDialogOpen(true);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 className="size-3 text-muted-foreground" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <Separator />

      {/* KOSTEN */}
      <SectionHeader title="Kosten" />
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Geschätzt</span>
          <span className="tabular-nums">
            {estimatedCosts ? `${estimatedCosts.toFixed(2)} €` : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bisher</span>
          <span className="tabular-nums">{totalCosts.toFixed(2)} €</span>
        </div>
      </div>

      {dueDate ? (
        <>
          <Separator />
          <SectionHeader title="Frist" />
          <div className="text-sm">
            {new Date(dueDate).toLocaleDateString("de-DE")}
          </div>
        </>
      ) : null}

      {/* Dialogs */}
      {patient ? (
        <>
          <PatientEditDialog
            open={patientDialogOpen}
            onOpenChange={setPatientDialogOpen}
            patient={patient}
            onSaved={onPatientSaved}
          />
          <DiagnosisDialog
            open={diagnosisDialogOpen}
            onOpenChange={setDiagnosisDialogOpen}
            patientId={patient.id}
            diagnosis={editingDiagnosis}
            onSaved={onPatientSaved}
          />
          <MedicationDialog
            open={medDialogOpen}
            onOpenChange={setMedDialogOpen}
            patientId={patient.id}
            medication={editingMed}
            onSaved={onPatientSaved}
          />
          <CaseDoctorDialog
            open={doctorDialogOpen}
            onOpenChange={setDoctorDialogOpen}
            caseId={caseId}
            doctorOptions={doctorOptions}
            caseDoctor={editingCaseDoctor}
            onSaved={onCaseResourceSaved}
          />
          <CaseInterpreterDialog
            open={interpreterDialogOpen}
            onOpenChange={setInterpreterDialogOpen}
            caseId={caseId}
            interpreterOptions={interpreterOptions}
            caseInterpreter={editingCaseInterpreter}
            onSaved={onCaseResourceSaved}
          />
        </>
      ) : null}
    </aside>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </div>
      {action}
    </div>
  );
}
