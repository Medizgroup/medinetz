// components/home/home-card.tsx
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GalleryVerticalEnd, LayersPlus, ListTodo } from "lucide-react";
import HomeTodo from "./home-todos";

type Props = {
  userId: string;
  stats: {
    todosOpen: number;
    casesAssignedOpen: number;
    casesCreated: number;
  };
  todos: {
    id: string;
    title: string;
    dueDate: Date | null;
    priority: number;
    createdAt: Date;
    description: string | null;
  }[];
};

export default function HomeCard({ stats, todos }: Props) {
  const data = [
    {
      name: "Todos",
      value: String(stats.todosOpen).padStart(2, "0"),
      icon: ListTodo,
      href: "/todos",
    },
    {
      name: "Fälle",
      value: String(stats.casesAssignedOpen).padStart(2, "0"),
      icon: GalleryVerticalEnd,
      href: "/cases",
    },
    {
      name: "Erstellt",
      value: String(stats.casesCreated).padStart(2, "0"),
      icon: LayersPlus,
      href: "/cases?filter=created",
    },
  ];

  return (
    <div className="flex justify-center p-4 sm:p-10 w-full sm:col-span-6 flex-col gap-8 items-start">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {data.map((item) => (
          <Card key={item.name} className="p-0 gap-0">
            <CardContent className="p-6">
              <dd className="flex items-start justify-between space-x-2">
                <span className="truncate text-muted-foreground">
                  {item.name}
                </span>
                <span className="flex items-center justify-center rounded-full bg-sidebar p-2">
                  <item.icon className={cn("size-5 text-foreground")} />
                </span>
              </dd>
              <dd className="tabular-nums mt-1 text-3xl font-semibold text-foreground">
                {item.value}
              </dd>
            </CardContent>

            <CardFooter className="flex justify-end border-t border-border p-0!">
              <a
                href={item.href}
                className="px-6 py-3 text-sm font-medium text-primary hover:text-primary/90">
                Alles ansehen &#8594;
              </a>
            </CardFooter>
          </Card>
        ))}
      </dl>

      <HomeTodo todos={todos} />
    </div>
  );
}
