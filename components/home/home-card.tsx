"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GalleryVerticalEnd, LayersPlus, ListTodo } from "lucide-react";
import HomeTodo from "./home-todos";

const data = [
  {
    name: "Todos",
    value: "04",
    icon: ListTodo,
    href: "#",
  },
  {
    name: "Fälle",
    value: "03",
    icon: GalleryVerticalEnd,
    href: "#",
  },
  {
    name: "Erstellt",
    value: "27",
    icon: LayersPlus,
    href: "#",
  },
];

export default function HomeCard() {
  return (
    <div className="flex justify-center p-4 sm:p-10 w-full sm:col-span-4 flex-col gap-8 items-start">
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
      <HomeTodo />
    </div>
  );
}
