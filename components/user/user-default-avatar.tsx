
import Avatar from "boring-avatars";

export default function UserDefaultAvatar({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <Avatar size={size} name={name} variant="beam" colors={["#86efac","#22c55e", "#10b981", "#06b6d4", "#0284c7", "#edecb3","#fad928","#f59e0b"]} />
  );
}