import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineItem,
} from "@/components/ui/timeline";
import { Form, GalleryVerticalEnd } from "lucide-react";
import { Button } from "../ui/button";

const items = [
  {
    date: new Date("2024-01-09T10:55:00"),
    description: "Max hat dir erwähnt in einem Kommentar zu Fall #123.",
    case: "#123",
    protocol: "-123",
    id: 1,
  },
  {
    date: new Date("2024-01-09T10:50:00"),
    description: "Anna hat dir den Fall #457 zugewiesen.",
    case: "#457",
    protocol: "-2",
    id: 2,
  },
  {
    date: new Date("2024-01-09T10:45:00"),
    description: "Du hast dich selbst den Fall #789 zugewiesen.",
    case: "#789",
    protocol: "-456",
    id: 3,
  },
  {
    date: new Date("2024-01-09T10:40:00"),
    description: "Jo hat dich in dem Protokoll -345 erwähnt.",
    case: "",
    protocol: "-345",
    id: 4,
  },
];

export default function HomeTodo() {
  return (
    <div className="w-full">
      <h3 className="py-4 text-muted-foreground font-medium">
        Dinge, die deine Aufmerksamkeit benötigen
      </h3>
      <Timeline className="divide-y rounded-lg border w-full">
        {items.map((item) => (
          <TimelineItem
            className="m-0! px-4! py-3! relative"
            key={item.id}
            step={item.id}>
            <TimelineContent className="text-foreground">
              <div className="flex gap-2 font-medium text-muted-foreground">
                {item.protocol && (
                  <div className="flex items-center gap-1">
                    <Form className="size-3" /> <span>{item.protocol}</span>
                  </div>
                )}
                {item.protocol && item.case && "/"}
                {item.case && (
                  <div className="flex items-center gap-1">
                    <GalleryVerticalEnd className="size-3" />{" "}
                    <span>{item.case}</span>
                  </div>
                )}
              </div>
              {item.description}
              <TimelineDate className="mt-1">
                {item.date.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </TimelineDate>
            </TimelineContent>
            <div className="flex items-center gap-2 pt-2">
              <Button
                className="inline-flex text-xs"
                variant="destructive-outline"
                size="xs">
                Erledigt
              </Button>
            </div>
          </TimelineItem>
        ))}
      </Timeline>
      <span>
        <a
          href="#"
          className="py-2 block text-sm  text-muted-foreground hover:text-foreground">
          Alle Todos ansehen &#8594;
        </a>
      </span>
    </div>
  );
}
