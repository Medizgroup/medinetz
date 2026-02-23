import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  // Nicht eingeloggt → login
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // DB-Check: aktiv?
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });

  if (!user?.isActive) {
    redirect("/inactive");
  }

  return children;
}
