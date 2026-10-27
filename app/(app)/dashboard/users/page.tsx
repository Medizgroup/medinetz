import { redirect } from "next/navigation";

import { requireInstanceAdmin } from "@/lib/utils/admin/permissions";
import UsersTable from "@/components/dashboard/users-table";
import { getSession } from "@/lib/auth-session";

export default async function DashboardUsersPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");
  await requireInstanceAdmin(session.user.id);

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Benutzer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Benutzer der Instanz verwalten — freischalten, Rechte vergeben, löschen.
          </p>
        </div>
      </div>
      <UsersTable />
    </div>
  );
}
