import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function extractCommentMentions(text: string): string[] {
  const matches = text.match(/@([A-Za-z0-9_-]+)/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1))));
}

function extractMentions(text: string): { id: string; label: string }[] {
  const matches = text.match(/\@\[(.*?)\]\((.*?)\)/g) ?? [];

  return matches.map((m) => {
    const [, label, id] = m.match(/\@\[(.*?)\]\((.*?)\)/)!;
    return { id, label };
  });
}

function extractCommentCaseRefs(text: string): string[] {
  const matches = text.match(/\/case:([A-Za-z0-9_-]+)/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.replace("/case:", ""))));
}

function commentTextToNodes(text: string) {
  return [
    {
      type: "p",
      children: [{ text }],
    },
  ];
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const protocolId = String(body?.protocolId ?? "").trim();
  const contentText = String(body?.content ?? "").trim();

  if (!protocolId || !contentText) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
    select: {
      id: true,
      organizationId: true,
      title: true,
    },
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
      protocolId,
      userId: session.user.id,
      content: commentTextToNodes(contentText),
      contentText,
    },
    select: { id: true },
  });

  const mentionedUserIds = extractCommentMentions(contentText);

  const caseIds = extractCommentCaseRefs(contentText);

  const mentions = extractMentions(contentText);

  await prisma.mention.createMany({
    data: mentions.map((m) => ({
      mentionedUserId: m.id,
      mentioningUserId: session.user.id,
      targetType: "protocol_comment",
      targetId: comment.id,
    })),
  });

  // if (mentionedUserIds.length) {
  //   await prisma.mention.createMany({
  //     data: mentionedUserIds.map((mentionedUserId) => ({
  //       mentionedUserId,
  //       mentioningUserId: session.user.id,
  //       targetType: "protocol_comment",
  //       targetId: comment.id,
  //     })),
  //     skipDuplicates: true,
  //   });
  // }

  if (caseIds.length) {
    await prisma.protocolCase.createMany({
      data: caseIds.map((caseId) => ({
        protocolId,
        caseId,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.activity.create({
    data: {
      organizationId: protocol.organizationId,
      userId: session.user.id,
      action: "COMMENTED",
      targetType: "protocol_comment",
      targetId: protocol.id,
      metadata: {
        protocolTitle: protocol.title,
        mentionedUserIds,
        caseIds,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
