import { GalleryVerticalEnd, ListTodo, Plus } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import UserBadge from "./user-badge";
import { Button } from "../ui/button";

function HeadUser() {
  return (
    <div className="flex items-center gap-4 px-4 h-4">
      <Button size="icon-xs" variant="outline" className="rounded-full">
        <Plus className="size-4" />
      </Button>
      <Separator orientation="vertical" />
      <div className="flex items-center gap-1">
        <GalleryVerticalEnd className="size-4" />
        <span className="text-sm text-muted-foreground">3</span>
      </div>
      <div className="flex items-center gap-1">
        <ListTodo className="size-4" />
        <span className="text-sm text-muted-foreground">4</span>
      </div>
      <UserBadge />
    </div>
  );
}

export default HeadUser;
