import prisma from "@/lib/prisma";

export async function syncProtocolMentions(params: {
  protocolId: string;
  mentionedUserIds: string[];
  mentioningUserId: string;
}) {
  const { protocolId, mentionedUserIds, mentioningUserId } = params;

  // delete old mentions for this protocol comments? no
  // for description mentions we store targetType = protocol
  await prisma.mention.deleteMany({
    where: {
      targetType: "protocol",
      targetId: protocolId,
      mentioningUserId,
    },
  });

  if (!mentionedUserIds.length) return;

  await prisma.mention.createMany({
    data: mentionedUserIds.map((mentionedUserId) => ({
      mentionedUserId,
      mentioningUserId,
      targetType: "protocol",
      targetId: protocolId,
    })),
    skipDuplicates: true,
  });
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
