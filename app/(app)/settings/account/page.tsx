import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import AccountComponent from "@/components/settings/account-component";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!user) redirect("/sign-in");
  return (
    <div>
      <AccountComponent user={user} />
    </div>
  );
}
