import ProfileComponent from "@/components/settings/profile-component";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AvatarConfig } from "@/lib/avatar/dicebear";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      isActive: true,
      emailVerified: true,
      name: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      avatarConfig: true,
    },
  });

  if (!user) redirect("/sign-in");
  return (
    <div>
      <ProfileComponent
        user={{
          ...user,
          avatarConfig: user.avatarConfig as AvatarConfig | null,
        }}
      />
    </div>
  );
}
