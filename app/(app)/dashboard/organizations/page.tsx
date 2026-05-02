import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { requireInstanceAdmin } from "@/lib/utils/admin/permissions";

export default async function DashboardOrgsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");
  await requireInstanceAdmin(session.user.id);

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Organisationen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organisationen + Mitgliedschaften verwalten.
        </p>
      </div>
      <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
        Tabelle kommt in Phase 3.
      </div>
    </div>
  );
}
