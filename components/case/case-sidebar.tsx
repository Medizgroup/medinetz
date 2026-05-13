/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit2, Languages, Plus, UserRoundPen } from "lucide-react";

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
import { Spinner } from "../ui/spinner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

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
              size="icon"
              variant="ghost"
              onClick={() => setPatientDialogOpen(true)}>
              <UserRoundPen className="size-4" />
            </Button>
          ) : null
        }
      />

      {loading || !patient ? (
        <Spinner className="mx-auto text-muted-foreground size-4" />
      ) : (
        <div className="space-y-1 text-sm">
          <div className="font-medium tabular-nums flex items-center gap-2 flex-wrap">
            <span
              className={`text-base pb-1 font-medium ${patient.gender === "MALE" ? "text-blue-500" : patient.gender === "FEMALE" ? "text-pink-500" : ""}`}>
              {GENDER_LABEL[patient.gender]}
            </span>
            {patient.pseudonym}{" "}
            {patient.primaryLanguage ? (
              <span className="text-muted-foreground pl-1 font-normal text-xs">
                <Languages className="size-4 inline-block text-muted-foreground" />{" "}
                {patient.primaryLanguage}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {patient.countryOfOrigin ? (
              <span>Aus {patient.countryOfOrigin}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="warning" className="text-[10px]">
              {RESIDENCE_LABEL[patient.residenceStatus]}
            </Badge>
            <Badge variant="info" className="text-[10px]">
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
              size="icon-sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setEditingDiagnosis(null);
                setDiagnosisDialogOpen(true);
              }}>
              <Plus className="size-4" />
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
              className={`group flex items-center justify-between gap-2  px-2 rounded-lg py-2 bg-muted ${
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
                <Button
                  variant="outline"
                  size="icon-sm"
                  type="button"
                  onClick={() => {
                    setEditingDiagnosis(d);
                    setDiagnosisDialogOpen(true);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 className="size-3 text-muted-foreground" />
                </Button>
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
              size="icon-sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setEditingMed(null);
                setMedDialogOpen(true);
              }}>
              <Plus className="size-4" />
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
              className={`group flex items-center justify-between gap-2  px-2 rounded-lg py-2 bg-muted ${
                !m.isActive ? "opacity-60" : ""
              }`}>
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {m.name} {m.dosage}
                </div>
              </div>
              {canEditPatient ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  type="button"
                  onClick={() => {
                    setEditingMed(m);
                    setMedDialogOpen(true);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 className="size-3 text-muted-foreground" />
                </Button>
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
              size="icon-sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setEditingCaseDoctor(null);
                setDoctorDialogOpen(true);
              }}>
              <Plus className="size-4" />
            </Button>
          ) : null
        }
      />
      {caseDoctors.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          Noch keine ärztliche Unterstützung
        </div>
      ) : (
        <ul className="space-y-1.5 text-sm ">
          {caseDoctors.map((cd) => (
            <li
              key={cd.id}
              className="group flex items-center justify-between gap-2  p-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">{cd.doctor.name}</span>
                </div>
                {cd.doctor.specialty ? (
                  <div className="text-sm text-muted-foreground">
                    {cd.doctor.specialty}
                  </div>
                ) : null}
                {cd.appointmentDate ? (
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(cd.appointmentDate), "PPP", {
                      locale: de,
                    })}
                  </div>
                ) : null}
                {cd.invoiceReceived ? (
                  <div className="text-xs mt-1">
                    <Badge
                      variant={cd.invoicePaid ? "info" : "warning"}
                      className="text-[10px]">
                      {cd.invoiceAmount?.toFixed(2)} €{" "}
                    </Badge>
                  </div>
                ) : null}
              </div>
              {canEditCase ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={() => {
                    setEditingCaseDoctor(cd);
                    setDoctorDialogOpen(true);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 className="size-3 text-muted-foreground" />
                </Button>
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
              size="icon-sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setEditingCaseInterpreter(null);
                setInterpreterDialogOpen(true);
              }}>
              <Plus className="size-4" />
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
              className="group flex items-center justify-between gap-2 p-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium truncate">
                    {ci.interpreter.name}
                  </span>
                </div>
                {ci.interpreter.languages.length > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {ci.interpreter.languages.join(", ")}
                  </div>
                ) : null}
                {/* {ci.appointmentDate ? (
                  <div className="ml-4 text-xs text-muted-foreground">
                    {new Date(ci.appointmentDate).toLocaleDateString("de-DE")}
                    {ci.hoursWorked ? ` · ${ci.hoursWorked}h` : ""}
                  </div>
                ) : null} */}
                {ci.invoiceReceived ? (
                  <div className=" text-xs text-muted-foreground mt-2">
                    <Badge
                      variant={ci.invoicePaid ? "info" : "warning"}
                      className="text-[10px]">
                      {ci.cost?.toFixed(2)} €{" "}
                    </Badge>

                    {ci.hoursWorked ? ` · ${ci.hoursWorked}h` : ""}
                  </div>
                ) : null}
              </div>
              {canEditCase ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={() => {
                    setEditingCaseInterpreter(ci);
                    setInterpreterDialogOpen(true);
                  }}
                  className="shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 className="size-3 text-muted-foreground" />
                </Button>
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
            {format(new Date(dueDate), "PPP", { locale: de })}
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
      <div className="text-xs font-medium text-foreground uppercase tracking-wide">
        {title}
      </div>
      {action}
    </div>
  );
}
