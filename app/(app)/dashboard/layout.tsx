import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import DashboardNav from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const isAdmin = await isInstanceAdmin(session.user.id);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardNav isAdmin={isAdmin} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
