import prisma from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";

type CreateMentionNotificationsParams = {
  mentionedUserIds: string[];
  mentioningUserId: string;
  targetType: "protocol" | "case_comment" | "protocol_comment" | "case";
  targetId: string;
  title: string;
  message?: string;
  /**
   * Optional: nur diese User benachrichtigen (z.B. wirklich neue Mentions).
   * Wenn leer → keine Notifications.
   */
  notifyOnlyUserIds?: string[];
};

/**
 * Erzeugt Notifications für erwähnte User.
 * - Erwähnt sich der User selbst, bekommt er nichts.
 * - Wenn `notifyOnlyUserIds` gesetzt ist, werden nur diese benachrichtigt.
 */
export async function createMentionNotifications(
  params: CreateMentionNotificationsParams,
) {
  const {
    mentionedUserIds,
    mentioningUserId,
    targetType,
    targetId,
    title,
    message,
    notifyOnlyUserIds,
  } = params;

  const recipients = (notifyOnlyUserIds ?? mentionedUserIds).filter(
    (id) => id !== mentioningUserId,
  );

  if (recipients.length === 0) return;

  const type: NotificationType = "MENTION";

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type,
      title,
      message: message ?? null,
      targetType,
      targetId,
    })),
  });
}
