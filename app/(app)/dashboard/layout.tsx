import { redirect } from "next/navigation";

import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { getSession } from "@/lib/auth-session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/sign-in");

  const isAdmin = await isInstanceAdmin(session.user.id);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardNav isAdmin={isAdmin} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
