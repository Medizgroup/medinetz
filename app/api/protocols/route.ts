import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  extractMentionedUserIds,
  extractPlainTextFromNodes,
  extractReferencedCaseIds,
} from "@/lib/utils/protocols/extract";
import {
  syncProtocolCases,
  syncProtocolMentions,
} from "@/lib/utils/protocols/sync";
import { createMentionNotifications } from "@/lib/utils/notifications";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const title = String(body?.title ?? "").trim();
  const organizationId = String(body?.organizationId ?? "").trim();
  const date = String(body?.date ?? "").trim();
  const description = body?.description;

  if (!title || !organizationId || !date) {
    return NextResponse.json(
      { error: "Titel, Organisation und Datum sind erforderlich." },
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

  if (!membership || !["COORDINATOR", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const latest = await prisma.protocol.findFirst({
    where: { organizationId },
    orderBy: { protocolNumber: "desc" },
    select: { protocolNumber: true },
  });

  const protocol = await prisma.protocol.create({
    data: {
      title,
      organizationId,
      date: new Date(date),
      protocolNumber: (latest?.protocolNumber ?? 0) + 1,
      creatorId: session.user.id,
      description,
      descriptionText: extractPlainTextFromNodes(description) || null,
    },
    select: {
      id: true,
      title: true,
      organizationId: true,
    },
  });

  const mentionedUserIds = extractMentionedUserIds(description);
  const caseIds = extractReferencedCaseIds(description);

  // 1) Mentions in DB sync (alle "neu" beim Erstellen)
  const { newlyMentionedUserIds } = await syncProtocolMentions({
    protocolId: protocol.id,
    mentionedUserIds,
    mentioningUserId: session.user.id,
  });

  // 2) Cases verlinken (Phase B)
  await syncProtocolCases({
    protocolId: protocol.id,
    caseIds,
  });

  // 3) Notifications nur für NEUE Mentions
  await createMentionNotifications({
    mentionedUserIds,
    mentioningUserId: session.user.id,
    targetType: "protocol",
    targetId: protocol.id,
    title: `Du wurdest in Protokoll „${protocol.title}“ erwähnt`,
    notifyOnlyUserIds: newlyMentionedUserIds,
  });

  // 4) Activity (wie gehabt)
  await prisma.activity.create({
    data: {
      organizationId,
      userId: session.user.id,
      action: "CREATED",
      targetType: "protocol",
      targetId: protocol.id,
      metadata: {
        title,
        mentionedUserIds,
        caseIds,
      },
    },
  });

  return NextResponse.json({ protocol });
}
