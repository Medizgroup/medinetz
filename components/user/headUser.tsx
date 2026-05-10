import { GalleryVerticalEnd, ListTodo } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import UserBadge from "./user-badge";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import NotificationsPopover from "@/components/notifications/notifications-popover";
import Link from "next/link";
import QuickAddTodo from "../header/quick-add-todo";

async function HeadUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) return null;

  // Parallel fetchen — schneller als sequenziell
  const [user, openCasesCount, openTodosCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        avatarUrl: true,
        email: true,
        id: true,
      },
    }),
    prisma.case.count({
      where: {
        OR: [{ assigneeId: userId }, { creatorId: userId, assigneeId: null }],
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] },
      },
    }),
    prisma.todo.count({
      where: {
        assigneeId: userId,
        done: false,
      },
    }),
  ]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 px-4 h-4">
      <QuickAddTodo currentUserId={userId} />

      <NotificationsPopover />

      <Separator orientation="vertical" />

      <Link
        href="/cases"
        className="flex items-center gap-1 transition-colors hover:text-foreground"
        title="Offene Fälle">
        <GalleryVerticalEnd className="size-4.5" />
        <span className="text-sm text-muted-foreground tabular-nums">
          {openCasesCount}
        </span>
      </Link>

      <Link
        href="/todos"
        className="flex items-center gap-1 transition-colors hover:text-foreground"
        title="Offene Todos">
        <ListTodo className="size-4.5" />
        <span className="text-sm text-muted-foreground tabular-nums">
          {openTodosCount}
        </span>
      </Link>

      <UserBadge user={user} />
    </div>
  );
}

export default HeadUser;
