import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDeleteScope } from "@/lib/utils/admin/permissions";

// Mehrfach-Löschen aus der Fall-Liste. Gleiche Regel wie DELETE
// /api/cases/[id]: nur Org-ADMIN oder Instanz-Admin; Fälle aus anderen Orgs
// werden übersprungen statt den ganzen Vorgang abzubrechen.
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids)
    ? body.ids.map(String).slice(0, 500)
    : [];
  if (body?.action !== "delete" || ids.length === 0) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const scope = await getDeleteScope(session.user.id);
  const cases = await prisma.case.findMany({
    where: {
      id: { in: ids },
      ...(scope.isInstanceAdmin
        ? {}
        : { organizationId: { in: scope.adminOrgIds } }),
    },
    select: { id: true, organizationId: true, title: true, caseNumber: true },
  });

  if (cases.length === 0) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.case.deleteMany({ where: { id: { in: cases.map((c) => c.id) } } }),
    prisma.activity.createMany({
      data: cases.map((c) => ({
        organizationId: c.organizationId,
        userId: session.user.id,
        action: "DELETED" as const,
        targetType: "case",
        targetId: c.id,
        metadata: { title: c.title, caseNumber: c.caseNumber },
      })),
    }),
  ]);

  return NextResponse.json({
    deleted: cases.length,
    skipped: ids.length - cases.length,
  });
}
