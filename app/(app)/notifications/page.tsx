import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import NotificationsList from "@/components/notifications/notifications-list";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Benachrichtigungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle deine Benachrichtigungen — gefiltert oder gruppiert nach Tag.
        </p>
      </div>
      <NotificationsList />
    </div>
  );
}
