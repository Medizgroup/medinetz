import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function Loading() {
  return (
    <div className="w-full overflow-hidden">
      {/* Overlay */}
      <Card className="bg-background/80 fixed inset-0 z-100000 backdrop-blur-xs">
        <CardContent className="flex grow flex-col items-center justify-center gap-2">
          <Spinner className="size-5 opacity-60" />
          <span className="text-muted-foreground text-sm">
            Daten werden aktualisiert...
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
