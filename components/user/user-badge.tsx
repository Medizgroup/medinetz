"use client";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getInitials } from "@/lib/helper/user";
import { Switch } from "../ui/switch";
import { WalkingRound } from "@solar-icons/react-perf/category/style/LineDuotone";
export default function UserBadge({
  user,
}: {
  user: {
    email: string;
    avatarUrl: string | null;
    id: string;
    displayName: string | null;
    isInstanceAdmin: boolean;
  };
}) {
  const { theme, setTheme } = useTheme();
  const id = "themes";

  const router = useRouter();
  const logOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
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
            className="rounded-full bg-muted"
          />
        }>
        <Avatar className="size-8 ">
          <AvatarImage src={user.avatarUrl ?? ""} />
          <AvatarFallback>
            {getInitials(user.displayName ?? user.email ?? "User")}
          </AvatarFallback>
        </Avatar>
      </MenuTrigger>
      <MenuPopup className="w-56">
        <MenuItem className="flex gap-0 flex-col items-start ">
          <span className="truncate">{user.displayName} </span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </MenuItem>

        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Konto</MenuGroupLabel>
          <MenuItem render={<Link href={`/m/${user.id}`} />}>Profil</MenuItem>
          <MenuItem render={<Link href="/settings/profile" />}>
            Profil bearbeiten
          </MenuItem>
          <MenuItem render={<Link href="/settings/organizations" />}>
            Organisationen
          </MenuItem>
          <MenuItem render={<Link href="/settings/account" />}>
            Einstellungen
          </MenuItem>
        </MenuGroup>

        <MenuSeparator />
        {/* Admin Panel */}

        {user.isInstanceAdmin && (
          <>
            <MenuGroup>
              <MenuGroupLabel>Admin</MenuGroupLabel>
              <MenuItem render={<Link href="/dashboard" />}>Dashboard</MenuItem>
              <MenuItem render={<Link href="/dashboard/organizations" />}>
                Organisation
              </MenuItem>
              <MenuItem render={<Link href="/dashboard/users" />}>
                Benutzer
              </MenuItem>
              <MenuItem render={<Link href="/dashboard/resources" />}>
                Ressourcen
              </MenuItem>
              <MenuItem render={<Link href="/dashboard/organizations" />}>
                Organisation
              </MenuItem>
              <MenuItem render={<Link href="/dashboard/finance" />}>
                Finanzen
              </MenuItem>
            </MenuGroup>

            <MenuSeparator />
          </>
        )}
        {/* <MenuGroup>
          <MenuGroupLabel>Admin</MenuGroupLabel>
          <MenuItem render={<Link href="/dashboard" />}>Dashboard</MenuItem>
          <MenuItem render={<Link href="/dashboard/organizations" />}>
            Organisation
          </MenuItem>
          <MenuItem render={<Link href="/dashboard/users" />}>
            Benutzer
          </MenuItem>
          <MenuItem render={<Link href="/dashboard/resources" />}>
            Ressourcen
          </MenuItem>
          <MenuItem render={<Link href="/dashboard/organizations" />}>
            Organisation
          </MenuItem>
          <MenuItem render={<Link href="/dashboard/finance" />}>
            Finanzen
          </MenuItem>
        </MenuGroup> */}

        {/* <MenuSeparator /> */}
        <MenuGroup>
          <MenuGroupLabel>preference</MenuGroupLabel>
          <MenuItem>Benachrichtigung</MenuItem>
          <div
            className="flex justify-between py-4 items-start gap-2 px-2"
            onClick={(e) => e.preventDefault()}>
            App Theme
            <div
              className="group inline-flex items-center gap-2 pt-1"
              data-state={theme === "dark" ? "checked" : "unchecked"}>
              <span
                aria-controls={id}
                className="flex-1 cursor-pointer text-right font-medium text-sm group-data-[state=unchecked]:text-muted-foreground/70"
                id={`${id}-off`}
                onClick={() => setTheme("dark")}>
                <MoonIcon aria-hidden="true" size={16} />
              </span>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(value) => setTheme(value ? "dark" : "light")}
              />
              <span
                aria-controls={id}
                className="flex-1 cursor-pointer text-left font-medium text-sm group-data-[state=checked]:text-muted-foreground/70"
                id={`${id}-on`}
                onClick={() => setTheme("dark")}>
                <SunIcon aria-hidden="true" size={16} />
              </span>
            </div>
          </div>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem variant="destructive" className="" onClick={logOut}>
          <WalkingRound className="size-5" aria-hidden="true" />
          <span>Sich abmelden</span>
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
