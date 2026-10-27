import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import NotificationDigestToaster from "@/components/notifications/notification-digest-toaster";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import HeadUser from "@/components/user/headUser";
import BreadcrumbComponent from "@/components/breadcrumb-component";
import { getNews } from "@/lib/news/get-news";
import ForcePasswordChangeDialog from "@/components/auth/force-password-change-dialog";
import { getSession } from "@/lib/auth-session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Nicht eingeloggt redirect zu login
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  const userId = session.user.id;

  // Alles, was Sidebar und Header brauchen, in einem Durchgang.
  const [user, openTodosCount, assignedCasesCount, { news, recentCount }] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          isActive: true,
          isInstanceAdmin: true,
          mustChangePassword: true,
        },
      }),
      prisma.todo.count({ where: { assigneeId: userId, done: false } }),
      prisma.case.count({
        where: {
          assigneeId: userId,
          status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] },
        },
      }),
      getNews(),
    ]);

  if (!user?.isActive) {
    redirect("/inactive");
  }

  return (
    <SidebarProvider>
      {user.mustChangePassword ? <ForcePasswordChangeDialog /> : null}
      <AppSidebar
        openTodosCount={openTodosCount}
        assignedCasesCount={assignedCasesCount}
        news={news}
        newsCount={recentCount}
      />
      <SidebarInset className="overflow-x-clip">
        <NotificationDigestToaster />
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <BreadcrumbComponent />
            </div>
            <HeadUser
              user={user}
              openCasesCount={assignedCasesCount}
              openTodosCount={openTodosCount}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
