import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserDefaultAvatar from "./user-default-avatar";

/**
 * Profilbild mit generiertem Fallback (boring-avatars), wenn kein Bild
 * hinterlegt ist oder es nicht lädt — überall gleich statt Initialen.
 */
export default function UserAvatar({
  name,
  avatarUrl,
  size = 24,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const fallback = <UserDefaultAvatar name={name} size={size} />;

  if (!avatarUrl) {
    return (
      <span
        className={cn("inline-flex shrink-0 rounded-full", className)}
        title={name}>
        {fallback}
      </span>
    );
  }

  return (
    <Avatar
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
      title={name}>
      <AvatarImage src={avatarUrl} alt={name} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}
