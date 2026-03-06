import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProtocolsTable from "@/components/protocols/protocols-table";

export default async function ProtocolsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: {
      organizationId: true,
    },
  });

  const organizationIds = memberships.map((m) => m.organizationId);

  if (organizationIds.length === 0) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold">Protokolle</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Du bist aktuell keiner Organisation zugeordnet.
        </p>
      </div>
    );
  }

  const protocols = await prisma.protocol.findMany({
    where: {
      organizationId: {
        in: organizationIds,
      },
    },
    orderBy: [{ date: "desc" }, { protocolNumber: "desc" }],
    select: {
      id: true,
      title: true,
      protocolNumber: true,
      date: true,
      createdAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      _count: {
        select: {
          comments: true,
          protocolCases: true,
        },
      },
    },
  });

  const orgOptions = Array.from(
    new Map(
      protocols.map((p) => [
        p.organization.id,
        {
          id: p.organization.id,
          name: p.organization.name,
          type: p.organization.type,
        },
      ]),
    ).values(),
  );

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Protokolle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Protokolle aus deinen Organisationen.
        </p>
      </div>

      <ProtocolsTable data={protocols} orgOptions={orgOptions} />
    </div>
  );
}
