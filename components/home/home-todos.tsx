"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { Todo } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import { toastManager } from "../ui/toast";
import React from "react";
type Props = {
  todos: {
    id: string;
    title: string;
    done: boolean;
    dueDate: Date | null;
    priority: number;
    createdAt: Date;
    description: string | null;
  }[];
};

export default function HomeTodo({ todos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  function toggleDone(t: Todo) {
    setLoading(true);
    try {
      fetch(`/api/todos/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ done: !t.done }),
      }).catch(() => {});

      toastManager.add({
        title: "Success",
        description: "Aufgabe als erledigt markiert",
        type: "success",
      });

      router.refresh();
    } catch (e) {
      toastManager.add({
        title: "Error",
        description: "Fehler beim Markieren als erledigt" + e,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="w-full space-y-3">
      <div className="text-sm font-medium text-muted-foreground dark:text-foreground/80">
        Zu erledigende Aufgaben
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-5">
          {todos.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Keine offenen Todos 🎉
            </div>
          ) : (
            todos.map((t) => (
              <div key={t.id} className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => toggleDone(t as Todo)}
                    className="bg-accent size-4 sm:size-5"></Button>
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <div
                    className={`text-sm font-medium truncate ${t.done ? "line-through text-foreground" : ""}`}>
                    {t.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Badge
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
              </div>
            ))
          )}

          <Link
            href="/todos"
            className="text-sm text-muted-foreground hover:text-primary/90">
            Alle Aufgaben ansehen &#8594;
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
