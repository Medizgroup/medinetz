import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import InactiveComponent from "./inactive-component";

export default async function InactivePage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  if (!session?.user) redirect("/sign-in");

  // DB-Check: aktiv?
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });

  if (user?.isActive) {
    redirect("/home");
  }

  return <InactiveComponent />;
}
