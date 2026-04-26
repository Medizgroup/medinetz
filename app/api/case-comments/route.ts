import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  extractMentionedUserIds,
  extractPlainTextFromNodes,
} from "@/lib/utils/protocols/extract";
import { syncCaseCommentMentions } from "@/lib/utils/protocols/sync";
import { createMentionNotifications } from "@/lib/utils/notifications";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const caseId = String(body?.caseId ?? "").trim();
  const content = body?.content;

  if (!caseId || !content || !Array.isArray(content)) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const contentText = extractPlainTextFromNodes(content);
  if (!contentText.trim()) {
    return NextResponse.json({ error: "Kommentar ist leer." }, { status: 400 });
  }

  const targetCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      organizationId: true,
      caseNumber: true,
      title: true,
      assigneeId: true,
      creatorId: true,
    },
  });

  if (!targetCase) {
    return NextResponse.json(
      { error: "Fall nicht gefunden." },
      { status: 404 },
    );
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: targetCase.organizationId,
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

  const comment = await prisma.caseComment.create({
    data: {
      caseId: targetCase.id,
      userId: session.user.id,
      content,
      contentText,
    },
    select: { id: true },
  });

  const mentionedUserIds = extractMentionedUserIds(content);

  // Mentions
  const { newlyMentionedUserIds } = await syncCaseCommentMentions({
    caseCommentId: comment.id,
    mentionedUserIds,
    mentioningUserId: session.user.id,
  });

  // Mention-Notifications
  await createMentionNotifications({
    mentionedUserIds,
    mentioningUserId: session.user.id,
    targetType: "case_comment",
    targetId: comment.id,
    title: `Erwähnung in Fall #${targetCase.caseNumber} „${targetCase.title}"`,
    message: contentText.slice(0, 200),
    notifyOnlyUserIds: newlyMentionedUserIds,
  });

  // Zusatz: Assignee benachrichtigen, wenn er kommentiert wurde
  // (außer er kommentiert selbst oder ist schon erwähnt)
  if (
    targetCase.assigneeId &&
    targetCase.assigneeId !== session.user.id &&
    !mentionedUserIds.includes(targetCase.assigneeId)
  ) {
    await prisma.notification.create({
      data: {
        userId: targetCase.assigneeId,
        type: "COMMENT",
        title: `Neuer Kommentar in Fall #${targetCase.caseNumber}`,
        message: contentText.slice(0, 200),
        targetType: "case",
        targetId: targetCase.id,
      },
    });
  }

  // Activity
  await prisma.activity.create({
    data: {
      organizationId: targetCase.organizationId,
      userId: session.user.id,
      action: "COMMENTED",
      targetType: "case_comment",
      targetId: comment.id,
      metadata: {
        caseId: targetCase.id,
        caseNumber: targetCase.caseNumber,
        title: targetCase.title,
        mentionedUserIds,
      },
    },
  });

  return NextResponse.json({ ok: true, commentId: comment.id });
}
