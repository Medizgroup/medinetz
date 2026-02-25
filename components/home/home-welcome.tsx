import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export default function HomeWelcome() {
  return (
    <div className="p-8 flex items-center  ">
      <Avatar className="size-20">
        <AvatarImage
          alt="User"
          src="https://api.dicebear.com/9.x/lorelei/svg?backgroundType[]&backgroundRotation=360,-50,-30&glassesProbability=90&backgroundColor[]&seed=Brian"
        />
        <AvatarFallback>AV</AvatarFallback>
      </Avatar>
      <div className="ml-4">
        <h1 className="text-4xl font-bold">Hallo, Brian!</h1>
        <p className="text-sm text-muted-foreground">
          Hier ist ein Überblick über deine Aktivitäten.
        </p>
      </div>
    </div>
  );
}
