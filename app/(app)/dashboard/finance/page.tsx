import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { requireInstanceAdmin } from "@/lib/utils/admin/permissions";
import FinanceTable from "@/components/dashboard/finance-table";
import { getSession } from "@/lib/auth-session";

export default async function DashboardFinancePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");
  await requireInstanceAdmin(session.user.id);

  const orgs = await prisma.organization.findMany({
    where: { isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finanzen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Spenden und Ausgaben verwalten.
        </p>
      </div>
      <FinanceTable availableOrgs={orgs} />
    </div>
  );
}
