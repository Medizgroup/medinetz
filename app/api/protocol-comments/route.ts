import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  extractMentionedUserIds,
  extractPlainTextFromNodes,
  extractReferencedCaseIds,
} from "@/lib/utils/protocols/extract";
import { syncProtocolCommentMentions } from "@/lib/utils/protocols/sync";
import { createMentionNotifications } from "@/lib/utils/notifications";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const protocolId = String(body?.protocolId ?? "").trim();
  const content = body?.content;

  if (!protocolId || !content || !Array.isArray(content)) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const contentText = extractPlainTextFromNodes(content);
  if (!contentText.trim()) {
    return NextResponse.json({ error: "Kommentar ist leer." }, { status: 400 });
  }

  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
    select: { id: true, organizationId: true, title: true },
  });

  if (!protocol) {
    return NextResponse.json(
      { error: "Protokoll nicht gefunden." },
      { status: 404 },
    );
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

  if (
    !membership ||
    !["VIEWER", "COORDINATOR", "ADMIN"].includes(membership.role)
  ) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const comment = await prisma.protocolComment.create({
    data: {
      protocolId: protocol.id,
      userId: session.user.id,
      content,
      contentText,
    },
    select: { id: true },
  });

  const mentionedUserIds = extractMentionedUserIds(content);
  const referencedCaseIds = extractReferencedCaseIds(content);

  const { newlyMentionedUserIds } = await syncProtocolCommentMentions({
    protocolCommentId: comment.id,
    mentionedUserIds,
    mentioningUserId: session.user.id,
  });

  await createMentionNotifications({
    mentionedUserIds,
    mentioningUserId: session.user.id,
    targetType: "protocol_comment",
    targetId: comment.id,
    title: `Neuer Kommentar in „${protocol.title}"`,
    message: contentText.slice(0, 200),
    notifyOnlyUserIds: newlyMentionedUserIds,
  });

  await prisma.activity.create({
    data: {
      organizationId: protocol.organizationId,
      userId: session.user.id,
      action: "COMMENTED",
      targetType: "protocol_comment",
      targetId: comment.id,
      metadata: {
        protocolId: protocol.id,
        protocolTitle: protocol.title,
        mentionedUserIds,
        referencedCaseIds,
      },
    },
  });

  return NextResponse.json({ ok: true, commentId: comment.id });
}
