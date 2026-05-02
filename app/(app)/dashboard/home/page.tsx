import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function DashboardHomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Übersicht</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Statistiken und Charts deiner Organisationen.
        </p>
      </div>
      <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
        Charts kommen in Phase 2.
      </div>
    </div>
  );
}
