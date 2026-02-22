import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function InactivePage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  if (!session?.user) redirect("/sign-in");

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-3 rounded-2xl border p-6">
        <h1 className="text-xl font-semibold">
          Konto wartet auf Freischaltung
        </h1>
        <p className="text-sm text-muted-foreground">
          Dein Konto wurde erstellt, ist aber noch nicht aktiv. Ein Admin muss
          dich erst freischalten.
        </p>
      </div>
    </main>
  );
}
