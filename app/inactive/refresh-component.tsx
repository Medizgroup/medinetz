"use client";
import { Button } from "@/components/ui/button";
import { EmptyContent } from "@/components/ui/empty";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RefreshComponent() {
  const router = useRouter();
  return (
    <EmptyContent>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/home")}>
          <RefreshCcw /> Erneut prüfen
        </Button>
      </div>
    </EmptyContent>
  );
}
