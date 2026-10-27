import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDeleteScope } from "@/lib/utils/admin/permissions";
import { cleanupAllUploads } from "@/lib/utils/protocols/upload-cleanup";

// Mehrfach-Löschen aus der Protokoll-Liste. Gleiche Regel wie DELETE
// /api/protocols/[id]: nur Org-ADMIN oder Instanz-Admin; Protokolle aus
// anderen Orgs werden übersprungen.
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
  const protocols = await prisma.protocol.findMany({
    where: {
      id: { in: ids },
      ...(scope.isInstanceAdmin
        ? {}
        : { organizationId: { in: scope.adminOrgIds } }),
    },
    select: {
      id: true,
      organizationId: true,
      title: true,
      protocolNumber: true,
      description: true,
    },
  });

  if (protocols.length === 0) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.protocol.deleteMany({
      where: { id: { in: protocols.map((p) => p.id) } },
    }),
    prisma.activity.createMany({
      data: protocols.map((p) => ({
        organizationId: p.organizationId,
        userId: session.user.id,
        action: "DELETED" as const,
        targetType: "protocol",
        targetId: p.id,
        metadata: { title: p.title, protocolNumber: p.protocolNumber },
      })),
    }),
  ]);
  await Promise.all(protocols.map((p) => cleanupAllUploads(p.description)));

  return NextResponse.json({
    deleted: protocols.length,
    skipped: ids.length - protocols.length,
  });
}
