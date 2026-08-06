import prisma from "@/lib/prisma";

/**
 * Synchronisiert Mentions für einen Protocol-Body — volle Reconciliation,
 * nicht auf einen einzelnen Autor beschränkt. Bei Live-Kollaboration (Yjs)
 * gibt es keinen einzelnen "Autor pro Speichervorgang" mehr, an dessen
 * bisherige Mentions man anknüpfen könnte — deshalb wird hier immer der
 * komplette Mentions-Stand des Protokolls durch den aktuell extrahierten
 * Stand ersetzt. `actingUserId` dient nur der Zuschreibung in der
 * Benachrichtigung ("X hat dich erwähnt"), nicht der Lösch-Auswahl.
 * Return die User-IDs, die NEU erwähnt wurden (für Notifications).
 */
export async function syncProtocolMentions(params: {
  protocolId: string;
  mentionedUserIds: string[];
  actingUserId: string;
}): Promise<{ newlyMentionedUserIds: string[] }> {
  const { protocolId, mentionedUserIds, actingUserId } = params;

  const existing = await prisma.mention.findMany({
    where: {
      targetType: "protocol",
      protocolId,
    },
    select: { mentionedUserId: true },
  });

  const existingIds = new Set(existing.map((m) => m.mentionedUserId));
  const newlyMentionedUserIds = mentionedUserIds.filter(
    (id) => !existingIds.has(id),
  );

  await prisma.mention.deleteMany({
    where: {
      targetType: "protocol",
      protocolId,
    },
  });

  if (mentionedUserIds.length === 0) {
    return { newlyMentionedUserIds: [] };
  }

  await prisma.mention.createMany({
    data: mentionedUserIds.map((mentionedUserId) => ({
      mentionedUserId,
      mentioningUserId: actingUserId,
      targetType: "protocol",
      targetId: protocolId,
      protocolId,
    })),
    skipDuplicates: true,
  });

  return { newlyMentionedUserIds };
}

/**
 * Synchronisiert Mentions für einen Protocol-Comment (textbasiert).
 * Bei Comments wird i.d.R. einmal gespeichert und nicht editiert; daher einfacher.
 */
export async function syncProtocolCommentMentions(params: {
  protocolCommentId: string;
  mentionedUserIds: string[];
  mentioningUserId: string;
}): Promise<{ newlyMentionedUserIds: string[] }> {
  const { protocolCommentId, mentionedUserIds, mentioningUserId } = params;

  if (mentionedUserIds.length === 0) {
    return { newlyMentionedUserIds: [] };
  }

  // Bei Comments gehen wir davon aus, dass alle "neu" sind (wird nicht editiert)
  await prisma.mention.createMany({
    data: mentionedUserIds.map((mentionedUserId) => ({
      mentionedUserId,
      mentioningUserId,
      targetType: "protocol_comment",
      targetId: protocolCommentId,
      protocolCommentId,
    })),
    skipDuplicates: true,
  });

  return { newlyMentionedUserIds: mentionedUserIds };
}

export async function syncProtocolCases(params: {
  protocolId: string;
  caseIds: string[];
}) {
  const { protocolId, caseIds } = params;

  await prisma.protocolCase.deleteMany({
    where: { protocolId },
  });

  if (!caseIds.length) return;

  await prisma.protocolCase.createMany({
    data: caseIds.map((caseId) => ({
      protocolId,
      caseId,
    })),
    skipDuplicates: true,
  });
}

export async function syncCaseCommentMentions(params: {
  caseCommentId: string;
  mentionedUserIds: string[];
  mentioningUserId: string;
}): Promise<{ newlyMentionedUserIds: string[] }> {
  const { caseCommentId, mentionedUserIds, mentioningUserId } = params;

  if (mentionedUserIds.length === 0) {
    return { newlyMentionedUserIds: [] };
  }

  await prisma.mention.createMany({
    data: mentionedUserIds.map((mentionedUserId) => ({
      mentionedUserId,
      mentioningUserId,
      targetType: "case_comment",
      targetId: caseCommentId,
      caseCommentId,
    })),
    skipDuplicates: true,
  });

  return { newlyMentionedUserIds: mentionedUserIds };
}
