"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";

import type { TDateElement } from "platejs";
import type { PlateElementProps } from "platejs/react";

import { PlateElement, useReadOnly } from "platejs/react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function formatDateLabel(dateStr?: string) {
  if (!dateStr) return "Datum wählen";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Datum wählen";

  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) return "Heute";
  if (isSameDay(date, yesterday)) return "Gestern";
  if (isSameDay(date, tomorrow)) return "Morgen";

  return format(date, "PPP", { locale: de });
}

export function DateElement(props: PlateElementProps<TDateElement>) {
  const { editor, element } = props;
  const readOnly = useReadOnly();

  const trigger = (
    <span
      className={cn(
        "w-fit rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground text-sm",
        !readOnly && "cursor-pointer hover:bg-muted/70",
      )}
      contentEditable={false}
      draggable>
      {formatDateLabel(element.date)}
    </span>
  );

  return (
    <PlateElement
      {...props}
      as="span"
      className="inline-block"
      attributes={{
        ...props.attributes,
        contentEditable: false,
      }}>
      {readOnly ? (
        trigger
      ) : (
        <Popover>
          <PopoverTrigger>{trigger}</PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              selected={element.date ? new Date(element.date) : undefined}
              defaultMonth={element.date ? new Date(element.date) : undefined}
              onSelect={(date) => {
                if (!date) return;

                editor.tf.setNodes(
                  { date: date.toISOString() },
                  { at: props.path },
                );
              }}
              mode="single"
            />
          </PopoverContent>
        </Popover>
      )}
      {props.children}
    </PlateElement>
  );
}
