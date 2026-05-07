import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import HeadUser from "@/components/user/headUser";
import BreadcrumbComponent from "@/components/breadcrumb-component";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  // Nicht eingeloggt redirect zu login
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // DB-Check: aktiv?
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });

  if (!user?.isActive) {
    redirect("/inactive");
  }

  // get OrgIds
  const orgIds = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });

  const orgIdsArray = orgIds.map((m) => m.organizationId);

  const userId = session.user.id;

  const [openTodosCount, assignedCasesCount, eventsCount] = await Promise.all([
    prisma.todo.count({ where: { userId, done: false } }),

    prisma.case.count({
      where: {
        assigneeId: userId,
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] },
      },
    }),

    prisma.event.count({
      where: {
        OR: [
          {
            creatorId: userId,
            visibility: "PRIVATE",
          },
          {
            visibility: "ORGANIZATION",
            organizationId: { in: orgIdsArray },
          },
        ],
      },
    }),
  ]);

  const organizations = await prisma.organizationMember.findMany({
    where: { userId },
    select: {
      organization: {
        select: { id: true, name: true, color: true, slug: true },
      },
    },
    orderBy: { organization: { createdAt: "asc" } },
  });

  return (
    <SidebarProvider>
      <AppSidebar
        openTodosCount={openTodosCount}
        assignedCasesCount={assignedCasesCount}
        eventsCount={eventsCount}
        organizations={organizations.map((org) => ({
          id: org.organization.id,
          name: org.organization.name,
          color: org.organization.color ?? "#cccccc",
          slug: org.organization.slug,
        }))}
      />
      <SidebarInset>
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
            <HeadUser />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
