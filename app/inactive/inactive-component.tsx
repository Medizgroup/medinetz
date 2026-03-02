import { RouteIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import RefreshComponent from "./refresh-component";

export default function InactiveComponent() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RouteIcon />
        </EmptyMedia>
        <EmptyTitle>Dein Konto wartet auf Freischaltung</EmptyTitle>
        <EmptyDescription>
          Dein Konto wurde erstellt, ist aber noch nicht aktiv. Ein Admin muss
          dich erst freischalten.
        </EmptyDescription>
      </EmptyHeader>
      <RefreshComponent />
    </Empty>
  );
}
