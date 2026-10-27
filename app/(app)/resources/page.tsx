import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { userCanManageResources } from "@/lib/utils/resources/permissions";
import ResourcesPage from "@/components/resources/resources-page";
import { getSession } from "@/lib/auth-session";

export default async function Page() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");

  const canEdit = await userCanManageResources(session.user.id, prisma);

  return <ResourcesPage canEdit={canEdit} />;
}
