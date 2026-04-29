import prisma from "@/lib/prisma";

/**
 * Re-berechnet Case.totalCosts basierend auf allen Kosten-Quellen.
 * - CaseDoctor.invoiceAmount (wenn invoice empfangen)
 * - CaseInterpreter.cost (wenn invoice empfangen)
 * - CaseCost.amount (alle direkten Kosten)
 */
export async function recalculateCaseTotal(caseId: string) {
  const [doctorCosts, interpreterCosts, otherCosts] = await Promise.all([
    prisma.caseDoctor.aggregate({
      where: { caseId, invoiceReceived: true },
      _sum: { invoiceAmount: true },
    }),
    prisma.caseInterpreter.aggregate({
      where: { caseId, invoiceReceived: true },
      _sum: { cost: true },
    }),
    prisma.caseCost.aggregate({
      where: { caseId },
      _sum: { amount: true },
    }),
  ]);

  const total =
    Number(doctorCosts._sum.invoiceAmount ?? 0) +
    Number(interpreterCosts._sum.cost ?? 0) +
    Number(otherCosts._sum.amount ?? 0);

  await prisma.case.update({
    where: { id: caseId },
    data: { totalCosts: total },
  });

  return total;
}
