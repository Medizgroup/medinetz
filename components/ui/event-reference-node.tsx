"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import type { TComboboxInputElement, TElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from "platejs/react";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useProtocolEditorContext } from "@/components/protocols/protocol-editor-context";

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxInput,
  InlineComboboxItem,
} from "./inline-combobox";
import { getMentionOnSelectItem } from "@platejs/mention";
import { Spinner } from "./spinner";

type EventSearchResult = {
  id: string;
  title: string;
  startsAt: string;
  allDay: boolean;
};

const onSelectItem = getMentionOnSelectItem();

export function EventReferenceElement(
  props: PlateElementProps<TElement & { value?: string; eventId?: string }>,
) {
  const { element } = props;
  const selected = useSelected();
  const focused = useFocused();
  const readOnly = useReadOnly();
  const eventId = (element as any).eventId as string | undefined;
  const label = element.value ?? "";

  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 align-baseline text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        !readOnly && "cursor-pointer",
        selected && focused && "ring-2 ring-ring",
      )}>
      <CalendarDays className="size-3.5" />
      {label}
    </span>
  );

  return (
    <PlateElement
      as="span"
      {...props}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        "data-slate-value": label,
        "data-event-id": eventId,
        draggable: true,
      }}>
      {eventId ? (
        <Link href="/events" target="_blank" rel="noopener">
          {inner}
        </Link>
      ) : (
        inner
      )}
      {props.children}
    </PlateElement>
  );
}

export function EventReferenceInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [results, setResults] = React.useState<EventSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  const { organizationId } = useProtocolEditorContext();

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("q", debouncedSearch);
    if (organizationId) params.set("organizationId", organizationId);

    fetch(`/api/events/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: EventSearchResult[]) => {
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, organizationId]);

  const insertEvent = React.useCallback(
    (e: EventSearchResult) => {
      onSelectItem(editor, { key: e.id, text: e.title }, search);

      const matches = [
        ...editor.api.nodes<any>({
          at: [],
          match: (n: any) =>
            n.type === "mention" && n.value === e.title && !n.eventId,
        }),
      ];

      if (matches.length > 0) {
        const [, foundPath] = matches[matches.length - 1];
        editor.tf.setNodes(
          {
            type: "event_reference",
            eventId: e.id,
          } as any,
          { at: foundPath, match: (n: any) => n.type === "mention" },
        );
      }
    },
    [editor, search],
  );

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="$"
        filter={false}>
        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5 w-[320px]">
          <button
            type="button"
            // Normale <a>/<Link>-Navigation wird hier vom Slate-Editor abgefangen
            // (der Combobox-Popover hängt per Portal trotzdem im selben React-Baum
            // wie der contentEditable-Bereich) -> Navigation manuell auslösen.
            // Fokus im Such-Input behalten, sonst schließt der Blur den
            // Combobox-Node im Editor, bevor der Klick verarbeitet wird.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => window.open("/events", "_blank", "noopener")}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-primary text-sm hover:bg-accent">
            <PlusCircle className="size-4" />
            Neuen Termin anlegen
          </button>

          <InlineComboboxEmpty>
            {loading ? (
              <Spinner className="size-4 text-muted-foreground" />
            ) : (
              "Keine Termine gefunden"
            )}
          </InlineComboboxEmpty>

          <InlineComboboxGroup>
            {results.map((e) => (
              <InlineComboboxItem
                key={e.id}
                value={e.title}
                onClick={() => insertEvent(e)}
                className="my-2 h-10">
                <div className="flex w-full items-center gap-2 py-4 truncate min-w-0">
                  <CalendarDays className="size-4 text-muted-foreground/80" />
                  <span className="text-foreground truncate">{e.title}</span>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {e.allDay
                      ? format(new Date(e.startsAt), "d. MMM", { locale: de })
                      : format(new Date(e.startsAt), "d. MMM, HH:mm", {
                          locale: de,
                        })}
                  </span>
                </div>
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
