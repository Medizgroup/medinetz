import { redirect } from "next/navigation";

import { requireInstanceAdmin } from "@/lib/utils/admin/permissions";
import DashboardResourcesTable from "@/components/dashboard/resources-table";
import { getSession } from "@/lib/auth-session";

export default async function DashboardResourcesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");
  await requireInstanceAdmin(session.user.id);

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ressourcen-Verwaltung</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ärzt:innen und Dolmetscher:innen verwalten.
        </p>
      </div>
      <DashboardResourcesTable />
    </div>
  );
}
