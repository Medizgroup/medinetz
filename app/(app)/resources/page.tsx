import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { userCanManageResources } from "@/lib/utils/resources/permissions";
import ResourcesPage from "@/components/resources/resources-page";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const canEdit = await userCanManageResources(session.user.id, prisma);

  return <ResourcesPage canEdit={canEdit} />;
}
