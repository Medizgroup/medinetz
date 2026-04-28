import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type IdRef = { context: "case" | "protocol" | "user"; id: string };

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const ids: IdRef[] = Array.isArray(body?.ids) ? body.ids : [];

  if (ids.length === 0) {
    return NextResponse.json({ cases: {}, protocols: {}, users: {} });
  }

  const caseIds = ids.filter((x) => x.context === "case").map((x) => x.id);
  const protocolIds = ids
    .filter((x) => x.context === "protocol")
    .map((x) => x.id);
  const userIds = ids.filter((x) => x.context === "user").map((x) => x.id);

  // Memberships des aktuellen Users (für Sichtbarkeitsprüfung)
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  const [cases, protocols, users] = await Promise.all([
    caseIds.length
      ? prisma.case.findMany({
          where: {
            id: { in: caseIds },
            organizationId: { in: orgIds },
          },
          select: { id: true, caseNumber: true, title: true },
        })
      : Promise.resolve([]),
    protocolIds.length
      ? prisma.protocol.findMany({
          where: {
            id: { in: protocolIds },
            organizationId: { in: orgIds },
          },
          select: { id: true, protocolNumber: true, title: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            displayName: true,
            name: true,
            email: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const result = {
    cases: Object.fromEntries(
      cases.map((c) => [c.id, { caseNumber: c.caseNumber, title: c.title }]),
    ),
    protocols: Object.fromEntries(
      protocols.map((p) => [
        p.id,
        { protocolNumber: p.protocolNumber, title: p.title },
      ]),
    ),
    users: Object.fromEntries(
      users.map((u) => [
        u.id,
        u.displayName ?? u.name ?? u.email ?? `User ${u.id.slice(0, 6)}`,
      ]),
    ),
  };

  return NextResponse.json(result);
}
