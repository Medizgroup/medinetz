import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import AccountComponent from "@/components/settings/account-component";
import { getSession } from "@/lib/auth-session";

export default async function Page() {
  const session = await getSession();
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
