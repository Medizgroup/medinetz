import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/enums";

const VALID_TYPES: NotificationType[] = [
  "MENTION",
  "ASSIGNMENT",
  "COMMENT",
  "CASE_UPDATE",
  "PROTOCOL_UPDATE",
  "EVENT_INVITE",
];

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "all"; // "all" | "unread"
  const typeParam = searchParams.get("type");
  const limitParam = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Math.min(Math.max(limitParam, 1), 100);
  const cursor = searchParams.get("cursor"); // notification id

  const where: {
    userId: string;
    read?: boolean;
    type?: NotificationType;
  } = {
    userId: session.user.id,
  };

  if (filter === "unread") {
    where.read = false;
  }

  if (typeParam && VALID_TYPES.includes(typeParam as NotificationType)) {
    where.type = typeParam as NotificationType;
  }

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1, // +1 um zu wissen ob's mehr gibt
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        targetType: true,
        targetId: true,
        read: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  const hasMore = items.length > limit;
  const result = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? result[result.length - 1].id : null;

  return NextResponse.json({ items: result, unreadCount, nextCursor });
}

/**
 * PATCH: { id?: string, all?: boolean }
 * - id: bestimmte Notification als gelesen markieren
 * - all: alle als gelesen markieren
 */
export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id ? String(body.id) : null;
  const all = Boolean(body?.all);

  const now = new Date();

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true, readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true, readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nichts zu tun." }, { status: 400 });
}
