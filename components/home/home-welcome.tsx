import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/generated/prisma/client";
import { getInitials } from "@/lib/helper/user";

export default function HomeWelcome({ user }: { user: User }) {
  const displayName = user.displayName ?? `${user.firstName} ${user.lastName}`;
  return (
    <div className="p-8 flex items-center ">
      <Avatar className="size-20">
        <AvatarImage alt="User" src={user.avatarUrl ?? ""} />
        <AvatarFallback>
          {getInitials(user.displayName ?? user.email ?? "User")}{" "}
        </AvatarFallback>
      </Avatar>
      <div className="ml-4">
        <h1 className="text-4xl font-bold">Hallo, {displayName} !</h1>
        <p className="text-sm text-muted-foreground">
          Hier ist ein Überblick über deine Aktivitäten.
        </p>
      </div>
    </div>
  );
}
