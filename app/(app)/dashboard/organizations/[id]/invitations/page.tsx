import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireOrgManager } from "@/lib/utils/organizations/permissions";
import { Separator } from "@/components/ui/separator";
import { JoinRequestsManager } from "@/components/dashboard/join-requests-manager";

export default async function OrgInvitationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  // Instanz-Admin oder mind. Koordinator dieser Org – sonst notFound()
  await requireOrgManager(session.user.id, id);

  const org = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!org) notFound();

  const requests = await prisma.organizationJoinRequest.findMany({
    where: { organizationId: id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          name: true,
          avatarUrl: true,
        },
      },
      decider: { select: { id: true, name: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Beitrittsanfragen</h1>
        <p className="text-sm text-muted-foreground">
          Anfragen für <span className="text-foreground">{org.name}</span>{" "}
          annehmen oder ablehnen.
        </p>
      </div>

      <Separator />

      <JoinRequestsManager orgId={org.id} requests={requests} />
    </div>
  );
}
