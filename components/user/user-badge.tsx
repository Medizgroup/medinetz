"use client";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/menu";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
export default function UserBadge() {
  const router = useRouter();
  const logOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/signin"); // redirect to login page
        },
      },
    });
  };
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            size="icon-xl"
            variant="ghost"
            className="rounded-full border"
          />
        }>
        <span className="absolute h-1.5 w-1.5 bg-green-500 rounded-full top-0.5 right-0.75 -0"></span>
        <Avatar className="size-8 b">
          <AvatarImage src="https://api.dicebear.com/9.x/lorelei/svg?backgroundType[]&backgroundRotation=360,-50,-30&glassesProbability=90&backgroundColor[]&seed=Brian" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </MenuTrigger>
      <MenuPopup className="w-56">
        <MenuItem className="flex gap-0 flex-col items-start ">
          <span>Brian Neumann</span>
          <span className="text-xs text-muted-foreground">mail@mail.com</span>
        </MenuItem>

        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Konto</MenuGroupLabel>
          <MenuItem>Status</MenuItem>
          <MenuItem>Profil bearbeiten</MenuItem>
          <MenuItem>Einstellungen</MenuItem>
        </MenuGroup>

        <MenuSeparator />
        {/* Admin Panel */}
        <MenuGroup>
          <MenuGroupLabel>Admin</MenuGroupLabel>
          <MenuSub>
            <MenuSubTrigger>Organisations</MenuSubTrigger>
            <MenuSubPopup>
              <MenuItem>Org. hinzufügen</MenuItem>
              <MenuItem>Org. verwalten</MenuItem>
            </MenuSubPopup>
          </MenuSub>
          <MenuSub>
            <MenuSubTrigger>Benutzer</MenuSubTrigger>
            <MenuSubPopup>
              <MenuItem>Benutzer verwalten</MenuItem>
              <MenuItem>Benutzer freigeben</MenuItem>
              <MenuItem>Benutzer hinzufügen</MenuItem>
            </MenuSubPopup>
          </MenuSub>
          <MenuSub>
            <MenuSubTrigger>Ressourcen</MenuSubTrigger>
            <MenuSubPopup>
              <MenuItem>Praxen und Instituten </MenuItem>
              <MenuItem>Dolmetscher</MenuItem>
            </MenuSubPopup>
          </MenuSub>
          <MenuItem>Finanzen</MenuItem>
        </MenuGroup>

        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>preference</MenuGroupLabel>
          <MenuItem>Benachrichtigung</MenuItem>
          <MenuItem>App Theme</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem variant="destructive" onClick={logOut}>
          <LogOut aria-hidden="true" />
          Sich abmelden
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
