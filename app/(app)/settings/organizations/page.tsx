import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";

import { Separator } from "@/components/ui/separator";
import { OrganizationsComponent } from "@/components/settings/organizations-component";
import { getSession } from "@/lib/auth-session";

export default async function OrganizationsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");

  const [memberships, instanceAdmin] = await Promise.all([
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
    isInstanceAdmin(session.user.id),
  ]);

  return (
    <div className="p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Organisationen</h1>
        <p className="text-sm text-muted-foreground">
          Deine Mitgliedschaften.
        </p>
      </div>

      <Separator />

      <OrganizationsComponent
        memberships={memberships}
        isInstanceAdmin={instanceAdmin}
      />
    </div>
  );
}
