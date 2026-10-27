"use client";
import { Button } from "@/components/ui/button";
import { EmptyContent } from "@/components/ui/empty";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default function RefreshComponent() {
  return (
    <EmptyContent>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" render={<Link href="/sign-in" />}>
          <LogIn /> Zur Anmeldung
        </Button>
      </div>
    </EmptyContent>
  );
}
