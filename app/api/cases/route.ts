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
  const patientPseudonym = String(body?.patientPseudonym ?? "").trim();

  if (!title || !organizationId || !patientPseudonym) {
    return NextResponse.json(
      { error: "Titel, Organisation und Patient-Pseudonym sind erforderlich." },
      { status: 400 },
    );
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  if (!membership || !canCreateCase(membership.role)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const description = body?.description
    ? String(body.description).trim()
    : null;
  const patientLanguage = body?.patientLanguage
    ? String(body.patientLanguage).trim()
    : null;
  const patientNotes = body?.patientNotes
    ? String(body.patientNotes).trim()
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
      patientPseudonym,
      patientLanguage,
      patientNotes,
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
