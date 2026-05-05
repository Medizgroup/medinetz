import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { requireInstanceAdmin } from "@/lib/utils/admin/permissions";
import DashboardResourcesTable from "@/components/dashboard/resources-table";

export default async function DashboardResourcesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
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
