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
          Dein Konto ist noch nicht aktiv. Sobald ein Admin dich freigeschaltet
          und einer Organisation hinzugefügt hat, kannst du dich anmelden.
        </EmptyDescription>
      </EmptyHeader>
      <RefreshComponent />
    </Empty>
  );
}
