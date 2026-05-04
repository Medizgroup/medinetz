import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireInstanceAdmin } from "@/lib/utils/admin/permissions";
import UsersTable from "@/components/dashboard/users-table";

export default async function DashboardUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");
  await requireInstanceAdmin(session.user.id);

  const orgs = await prisma.organization.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Benutzer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Benutzer der Instanz verwalten — aktivieren, einladen.
          </p>
        </div>
      </div>
      <UsersTable availableOrgs={orgs} />
    </div>
  );
}
