import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { isInstanceAdmin: true },
  });
  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  const [todos, events, inactiveUsers] =
    await Promise.all([
      // Todos: offen, heute fällig oder überfällig, mir zugewiesen oder für alle
      prisma.todo.findMany({
        where: {
          done: false,
          dueDate: { lt: startOfTomorrow },
          OR: [{ assigneeId: userId }, { assigneeId: null }],
        },
        select: { id: true, title: true, dueDate: true, priority: true },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      // Termine heute (sichtbar in meinen Orgs)
      prisma.event.findMany({
        where: {
          startsAt: { gte: startOfToday, lt: startOfTomorrow },
          OR: [
            { creatorId: userId, visibility: "PRIVATE" },
            { visibility: "ORGANIZATION", organizationId: { in: orgIds } },
            { visibility: "PUBLIC" },
          ],
        },
        select: {
          id: true,
          title: true,
          startsAt: true,
          allDay: true,
          location: true,
        },
        orderBy: { startsAt: "asc" },
        take: 20,
      }),
      // Inaktive Accounts — nur Instanz-Admin
      me.isInstanceAdmin
        ? prisma.user.findMany({
            where: { isActive: false, deletedAt: null },
            select: { id: true, email: true, name: true, displayName: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

  return NextResponse.json({
    todosToday: todos.map((t) => ({
      id: `todo:${t.id}`,
      kind: "todo",
      dedup: "daily",
      title: t.title,
      dueDate: t.dueDate,
      overdue: t.dueDate ? t.dueDate < startOfToday : false,
      href: "/todos",
    })),
    eventsToday: events.map((e) => ({
      id: `event:${e.id}`,
      kind: "event",
      dedup: "daily",
      title: e.title,
      startsAt: e.startsAt,
      allDay: e.allDay,
      location: e.location,
      href: "/events",
    })),
    pendingApprovals: [
      ...inactiveUsers.map((u) => ({
        id: `inactive:${u.id}`,
        kind: "inactive",
        dedup: "once",
        userLabel: u.displayName ?? u.name ?? u.email,
        href: `/dashboard/users`,
      })),
    ],
  });
}
