import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import NewProtocolForm from "@/components/protocols/new-protocol-form";

export default async function NewProtocolPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId: session.user.id,
      role: {
        in: ["COORDINATOR", "ADMIN"],
      },
    },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: {
      organization: {
        name: "asc",
      },
    },
  });

  if (memberships.length === 0) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold">Neues Protokoll</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Du hast keine Berechtigung, ein Protokoll zu erstellen.
        </p>
      </div>
    );
  }

  return <NewProtocolForm memberships={memberships} />;
}
