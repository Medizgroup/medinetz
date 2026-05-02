import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import TodosList from "@/components/todos/todos-list";

export default async function TodosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meine Todos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Persönliche Aufgaben — separat von Fällen.
        </p>
      </div>
      <TodosList />
    </div>
  );
}
