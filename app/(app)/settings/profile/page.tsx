import ProfileComponent from "@/components/settings/profile-component";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { AvatarConfig } from "@/lib/avatar/dicebear";
import { getSession } from "@/lib/auth-session";

export default async function Page() {
  const session = await getSession();
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
