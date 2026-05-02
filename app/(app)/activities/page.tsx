import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import ActivitiesList from "@/components/activity/activities-list";

export default async function ActivitiesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Aktivitäten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Aktionen aus deinen Organisationen — gefiltert oder nach Tag
          gruppiert.
        </p>
      </div>
      <ActivitiesList />
    </div>
  );
}
