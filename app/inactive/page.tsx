import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { RouteIcon } from "lucide-react";
export default async function InactivePage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  if (!session?.user) redirect("/sign-in");

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RouteIcon />
        </EmptyMedia>
        <EmptyTitle>Dein Konto wartet auf Freischaltung</EmptyTitle>
        <EmptyDescription>
          Dein Konto wurde erstellt, ist aber noch nicht aktiv. Ein Admin muss
          dich erst freischalten.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
