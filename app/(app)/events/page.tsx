import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import EventCalendarComponent from "@/components/event-calendar-component";
import { getSession } from "@/lib/auth-session";

export default async function Page() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: {
      organization: { select: { id: true, name: true } },
    },
    orderBy: { organization: { name: "asc" } },
  });

  const orgs = memberships.map((m) => m.organization);

  return (
    <div className="px-4 py-6">
      <EventCalendarComponent initialOrgs={orgs} />
    </div>
  );
}
