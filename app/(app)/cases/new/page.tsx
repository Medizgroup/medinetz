import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import NewCaseForm from "@/components/case/new-case-form";
import { getSession } from "@/lib/auth-session";

export default async function NewCasePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");

  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId: session.user.id,
      role: { in: ["COORDINATOR", "ADMIN"] },
    },
    select: {
      organization: { select: { id: true, name: true, type: true } },
    },
    orderBy: { organization: { name: "asc" } },
  });

  if (memberships.length === 0) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold">Neuer Fall</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Du hast keine Berechtigung, einen Fall zu erstellen.
        </p>
      </div>
    );
  }

  return <NewCaseForm memberships={memberships} />;
}
