import { Separator } from "@/components/ui/separator";
import UserBadge from "./user-badge";
import NotificationsPopover from "@/components/notifications/notifications-popover";
import Link from "next/link";
import QuickAddTodo from "../header/quick-add-todo";
import { Checklist, FolderOpen } from "@/lib/icons";

// Daten kommen aus dem App-Layout, damit Header und Sidebar dieselben
// Zahlen zeigen und nichts doppelt abgefragt wird.
function HeadUser({
  user,
  openCasesCount,
  openTodosCount,
}: {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    isInstanceAdmin: boolean;
  };
  openCasesCount: number;
  openTodosCount: number;
}) {
  return (
    <div className="flex items-center gap-4 px-4 h-4">
      <QuickAddTodo currentUserId={user.id} />

      <NotificationsPopover />

      <Separator orientation="vertical" />

      <Link
        href="/cases"
        className="flex items-center gap-1 transition-colors hover:text-foreground"
        title="Mir zugewiesene offene Fälle">
        <FolderOpen className="size-5" />
        <span className="text-sm text-muted-foreground tabular-nums">
          {openCasesCount}
        </span>
      </Link>

      <Link
        href="/todos"
        className="flex items-center gap-1 transition-colors hover:text-foreground"
        title="Meine offenen Todos">
        <Checklist className="size-5" />
        <span className="text-sm text-muted-foreground tabular-nums">
          {openTodosCount}
        </span>
      </Link>

      <UserBadge user={user} />
    </div>
  );
}

export default HeadUser;
