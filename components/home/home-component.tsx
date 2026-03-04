// components/home/home-component.tsx
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

import HomeWelcome from "./home-welcome";
import HomeCard from "./home-card";
import HomeActivity from "./home-activity";
import { User } from "@/generated/prisma/client";

export default async function HomeComponent() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Nicht eingeloggt.</div>
    );
  }

  // 1) User
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  if (!user) return <div className="p-6">User not found</div>;

  // 2) Orgas (Mitgliedschaften) -> orgIds für Feed
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  // 3) Home Stats (für Cards)
  const [openTodosCount, assignedCasesCount, createdCasesCount] =
    await Promise.all([
      prisma.todo.count({ where: { userId, done: false } }),

      prisma.case.count({
        where: {
          assigneeId: userId,
          status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] },
        },
      }),

      prisma.case.count({ where: { creatorId: userId } }),
    ]);

  // 4) Todos (limit 5)
  const todos = await prisma.todo.findMany({
    where: { userId, done: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      createdAt: true,
    },
  });

  // 5) Activity Feed (limit 6) aus allen Orgas
  // Wenn du auch "global" Activities (organizationId NULL) zeigen willst, OR hinzufügen.
  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { organizationId: { in: orgIds } },
        // optional:
        // { organizationId: null },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      action: true,
      targetType: true,
      createdAt: true,
      organization: { select: { id: true, name: true } },
      user: {
        select: { id: true, displayName: true, name: true, avatarUrl: true },
      },
    },
  });

  return (
    <>
      <div>
        <HomeWelcome user={user as User} />
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-9">
        <HomeCard
          stats={{
            todosOpen: openTodosCount,
            casesAssignedOpen: assignedCasesCount,
            casesCreated: createdCasesCount,
          }}
          todos={todos}
          userId={userId}
        />

        <HomeActivity items={activities} />
      </div>
    </>
  );
}
