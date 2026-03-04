import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/generated/prisma/client";

export default function HomeWelcome({ user }: { user: User }) {
  return (
    <div className="p-8 flex items-center  ">
      <Avatar className="size-20">
        <AvatarImage alt="User" src={user.avatarUrl ?? ""} />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <div className="ml-4">
        <h1 className="text-4xl font-bold">
          Hallo, {user.firstName} {user.lastName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Hier ist ein Überblick über deine Aktivitäten.
        </p>
      </div>
    </div>
  );
}
