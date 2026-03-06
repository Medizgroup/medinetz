"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  todos: {
    id: string;
    title: string;
    dueDate: Date | null;
    priority: number;
    createdAt: Date;
    description: string | null;
  }[];
};

export default function HomeTodo({ todos }: Props) {
  return (
    <div className="w-full space-y-3">
      <div className="text-sm font-medium text-muted-foreground">
        Meine Todos
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-5">
          {todos.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Keine offenen Todos 🎉
            </div>
          ) : (
            todos.map((t) => (
              <div
                key={t.id}
                className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    <Badge
                      size="sm"
                      variant={
                        t.priority === 1
                          ? "info"
                          : t.priority === 2
                            ? "warning"
                            : "error"
                      }>
                      {t.priority === 1
                        ? "Niedrig"
                        : t.priority === 2
                          ? "Medium"
                          : "Hoch"}
                    </Badge>
                    {t.description && (
                      <div className="text-xs text-muted-foreground ml-1 inline-flex">
                        {t.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon-xs" className="bg-accent">
                    <CheckIcon className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          <Link
            href="/todos"
            className="text-sm text-primary hover:text-primary/90">
            Alles ansehen &#8594;
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
