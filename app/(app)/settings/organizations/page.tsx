import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { Separator } from "@/components/ui/separator";
import { OrganizationsComponent } from "@/components/settings/organizations-component";

export default async function OrganizationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || !session.user.email) redirect("/sign-in");

  const [memberships, invites, joinRequests] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            isArchived: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.organizationInvite.findMany({
      where: {
        email: session.user.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            isArchived: true,
          },
        },
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organizationJoinRequest.findMany({
      where: { userId: session.user.id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, type: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Organisationen</h1>
        <p className="text-sm text-muted-foreground">
          Verwalte deine Mitgliedschaften, Einladungen und Beitrittsanfragen.
        </p>
      </div>

      <Separator />

      <OrganizationsComponent
        memberships={memberships}
        invites={invites}
        joinRequests={joinRequests}
      />
    </div>
  );
}
