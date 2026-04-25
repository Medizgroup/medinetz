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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const title = String(body?.title ?? "").trim();
  const date = String(body?.date ?? "").trim();
  const description = body?.description;

  const protocol = await prisma.protocol.findUnique({
    where: { id },
    select: {
      id: true,
      organizationId: true,
      title: true,
    },
  });

  if (!protocol) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: protocol.organizationId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  if (!membership || !["COORDINATOR", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  await prisma.protocol.update({
    where: { id },
    data: {
      title,
      date: new Date(date),
      description,
      descriptionText: extractPlainTextFromNodes(description) || null,
    },
  });

  const mentionedUserIds = extractMentionedUserIds(description);
  const caseIds = extractReferencedCaseIds(description);

  const { newlyMentionedUserIds } = await syncProtocolMentions({
    protocolId: id,
    mentionedUserIds,
    mentioningUserId: session.user.id,
  });

  await syncProtocolCases({
    protocolId: id,
    caseIds,
  });

  // Nur User benachrichtigen, die VORHER nicht erwähnt waren
  await createMentionNotifications({
    mentionedUserIds,
    mentioningUserId: session.user.id,
    targetType: "protocol",
    targetId: id,
    title: `Du wurdest in Protokoll „${title}“ erwähnt`,
    notifyOnlyUserIds: newlyMentionedUserIds,
  });

  await prisma.activity.create({
    data: {
      organizationId: protocol.organizationId,
      userId: session.user.id,
      action: "UPDATED",
      targetType: "protocol",
      targetId: id,
      metadata: {
        title,
        mentionedUserIds,
        caseIds,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
