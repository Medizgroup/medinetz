import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CasesTable from "@/components/case/cases-table";

export default async function CasesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true, role: true },
  });

  const orgIds = memberships.map((m) => m.organizationId);
  const canCreate = memberships.some(
    (m) => m.role === "COORDINATOR" || m.role === "ADMIN",
  );

  if (orgIds.length === 0) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold">Fälle</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Du bist aktuell keiner Organisation zugeordnet.
        </p>
      </div>
    );
  }

  const cases = await prisma.case.findMany({
    where: { organizationId: { in: orgIds } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      caseNumber: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      patient: {
        select: { pseudonym: true },
      },
      organization: { select: { id: true, name: true } },
      creator: { select: { displayName: true, name: true } },
      assignee: { select: { id: true, displayName: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  const orgOptions = Array.from(
    new Map(
      cases.map((c) => [
        c.organization.id,
        { id: c.organization.id, name: c.organization.name },
      ]),
    ).values(),
  );

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 overflow-x-hidden">
        <div>
          <h1 className="text-2xl font-semibold">Fälle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Fälle aus deinen Organisationen.
          </p>
        </div>

        {canCreate ? (
          <Button render={<Link href="/cases/new" />} className="rounded-full">
            <Plus className="size-4" />
            Neuer Fall
          </Button>
        ) : null}
      </div>

      <CasesTable data={cases} orgOptions={orgOptions} />
    </div>
  );
}
