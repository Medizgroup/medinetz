import prisma from "@/lib/prisma";

export type AccessContext =
  | "case_view"
  | "patient_view"
  | "patient_edit"
  | "diagnosis_view"
  | "diagnosis_edit"
  | "medication_view"
  | "medication_edit";

const SENSITIVE_LEVEL = 3; // "Sehr hoch"

export async function logPatientAccess(params: {
  patientId: string;
  userId: string;
  context: AccessContext;
  contextId?: string;
}) {
  // Nur protokollieren, wenn der Patient mit mindestens einem Fall der
  // Sensibilitätsstufe "Sehr hoch" verknüpft ist — sonst würde jeder
  // Routine-Zugriff das Log unnötig aufblähen.
  // Fire-and-forget — soll niemals den eigentlichen Request blockieren
  prisma.case
    .findFirst({
      where: { patientId: params.patientId, sensitivityLevel: SENSITIVE_LEVEL },
      select: { id: true },
    })
    .then((sensitiveCase) => {
      if (!sensitiveCase) return null;
      return prisma.patientAccessLog.create({
        data: {
          patientId: params.patientId,
          userId: params.userId,
          context: params.context,
          contextId: params.contextId ?? null,
        },
      });
    })
    .catch((err) => {
      console.error("Failed to log patient access:", err);
    });
}
