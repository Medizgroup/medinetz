import prisma from "@/lib/prisma";

export type AccessContext =
  | "case_view"
  | "patient_view"
  | "patient_edit"
  | "diagnosis_view"
  | "diagnosis_edit"
  | "medication_view"
  | "medication_edit";

export async function logPatientAccess(params: {
  patientId: string;
  userId: string;
  context: AccessContext;
  contextId?: string;
}) {
  // Fire-and-forget — soll niemals den eigentlichen Request blockieren
  prisma.patientAccessLog
    .create({
      data: {
        patientId: params.patientId,
        userId: params.userId,
        context: params.context,
        contextId: params.contextId ?? null,
      },
    })
    .catch((err) => {
      console.error("Failed to log patient access:", err);
    });
}
