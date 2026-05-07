import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canCreateCase } from "@/lib/utils/cases";
import type { CasePriority } from "@/generated/prisma/client";

const PRIORITY_VALUES: CasePriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const title = String(body?.title ?? "").trim();
  const organizationId = String(body?.organizationId ?? "").trim();

  if (!title || !organizationId) {
    return NextResponse.json(
      { error: "Titel und Organisation sind erforderlich." },
      { status: 400 },
    );
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId: session.user.id },
    },
    select: { role: true },
  });
  if (!membership || !canCreateCase(membership.role)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  // ─── Patient resolution ───────────────────────────────────────────────────────
  // Drop-in replacement for the patient block in app/api/cases/route.ts

  let patientId: string;

  if (body?.patientId) {
    // Mode: reuse existing patient (user chose "Bestehenden verwenden")
    const exists = await prisma.patient.findUnique({
      where: { id: String(body.patientId) },
      select: { id: true, deletedAt: true },
    });
    if (!exists || exists.deletedAt) {
      return NextResponse.json(
        { error: "Patient nicht gefunden." },
        { status: 400 },
      );
    }
    patientId = exists.id;
  } else {
    // Mode: create or reuse by pseudonym
    const basePseudonym = String(body?.patientPseudonym ?? "").trim();
    if (!basePseudonym) {
      return NextResponse.json(
        { error: "Patient-Pseudonym ist erforderlich." },
        { status: 400 },
      );
    }

    const forceNew = body?.forceNewPatient === true;

    if (!forceNew) {
      // Standard: reuse if pseudonym already taken
      const existing = await prisma.patient.findUnique({
        where: { pseudonym: basePseudonym },
        select: { id: true, deletedAt: true },
      });
      if (existing && !existing.deletedAt) {
        patientId = existing.id;
      } else {
        const created = await prisma.patient.create({
          data: {
            pseudonym: basePseudonym,
            primaryLanguage: body?.patientLanguage
              ? String(body.patientLanguage).trim()
              : null,
          },
          select: { id: true },
        });
        patientId = created.id;
      }
    } else {
      // forceNew: user explicitly wants a new patient despite collision → append suffix
      const clashes = await prisma.patient.findMany({
        where: {
          pseudonym: { startsWith: basePseudonym },
          deletedAt: null,
        },
        select: { pseudonym: true },
      });

      // Find the highest existing suffix (base counts as 0)
      const suffixPattern = new RegExp(
        `^${escapeRegex(basePseudonym)}(?:-(\\d+))?$`,
      );
      const maxSuffix = clashes.reduce((max, { pseudonym }) => {
        const m = pseudonym.match(suffixPattern);
        if (!m) return max;
        const n = m[1] ? parseInt(m[1], 10) : 0;
        return Math.max(max, n);
      }, -1);

      const uniquePseudonym =
        maxSuffix === -1
          ? basePseudonym // no real clash found (race condition safety)
          : `${basePseudonym}-${maxSuffix + 1}`;

      const created = await prisma.patient.create({
        data: {
          pseudonym: uniquePseudonym,
          primaryLanguage: body?.patientLanguage
            ? String(body.patientLanguage).trim()
            : null,
        },
        select: { id: true },
      });
      patientId = created.id;
    }
  }

  // ─── Helper (add at module level) ─────────────────────────────────────────────
  function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Case anlegen
  const description = body?.description
    ? String(body.description).trim()
    : null;
  const priority: CasePriority = PRIORITY_VALUES.includes(body?.priority)
    ? body.priority
    : "MEDIUM";

  const sensitivityRaw = Number(body?.sensitivityLevel ?? 1);
  const sensitivityLevel = [1, 2, 3].includes(sensitivityRaw)
    ? sensitivityRaw
    : 1;

  const dueDate = body?.dueDate ? new Date(String(body.dueDate)) : null;
  const estimatedCosts =
    body?.estimatedCosts !== undefined &&
    body?.estimatedCosts !== null &&
    body?.estimatedCosts !== ""
      ? Number(body.estimatedCosts)
      : null;

  const latest = await prisma.case.findFirst({
    where: { organizationId },
    orderBy: { caseNumber: "desc" },
    select: { caseNumber: true },
  });

  const created = await prisma.case.create({
    data: {
      organizationId,
      caseNumber: (latest?.caseNumber ?? 0) + 1,
      title,
      description,
      priority,
      sensitivityLevel,
      patientId,
      creatorId: session.user.id,
      dueDate,
      estimatedCosts: estimatedCosts ?? undefined,
    },
    select: { id: true, title: true, caseNumber: true },
  });

  await prisma.activity.create({
    data: {
      organizationId,
      userId: session.user.id,
      action: "CREATED",
      targetType: "case",
      targetId: created.id,
      metadata: { title: created.title, caseNumber: created.caseNumber },
    },
  });

  return NextResponse.json({ case: created });
}
