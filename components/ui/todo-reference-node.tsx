"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, PlusCircle } from "lucide-react";

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

type TodoSearchResult = {
  id: string;
  title: string;
  done: boolean;
};

const onSelectItem = getMentionOnSelectItem();

export function TodoReferenceElement(
  props: PlateElementProps<TElement & { value?: string; todoId?: string; todoDone?: boolean }>,
) {
  const { element } = props;
  const selected = useSelected();
  const focused = useFocused();
  const readOnly = useReadOnly();
  const todoId = (element as any).todoId as string | undefined;
  const done = Boolean((element as any).todoDone);
  const label = element.value ?? "";

  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-violet-100 px-1.5 py-0.5 align-baseline text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
        !readOnly && "cursor-pointer",
        selected && focused && "ring-2 ring-ring",
        done && "opacity-50",
      )}>
      {done ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <Circle className="size-3.5" />
      )}
      !{label}
      {done ? " (erledigt)" : ""}
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
        "data-todo-id": todoId,
        draggable: true,
      }}>
      {todoId ? (
        <Link href="/todos" target="_blank" rel="noopener">
          {inner}
        </Link>
      ) : (
        inner
      )}
      {props.children}
    </PlateElement>
  );
}

export function TodoReferenceInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [results, setResults] = React.useState<TodoSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("q", debouncedSearch);

    fetch(`/api/todos/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TodoSearchResult[]) => {
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
  }, [debouncedSearch]);

  const insertTodo = React.useCallback(
    (t: TodoSearchResult) => {
      onSelectItem(editor, { key: t.id, text: t.title }, search);

      const matches = [
        ...editor.api.nodes<any>({
          at: [],
          match: (n: any) =>
            n.type === "mention" && n.value === t.title && !n.todoId,
        }),
      ];

      if (matches.length > 0) {
        const [, foundPath] = matches[matches.length - 1];
        editor.tf.setNodes(
          {
            type: "todo_reference",
            todoId: t.id,
            todoDone: t.done,
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
        trigger="!"
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
            onClick={() => window.open("/todos", "_blank", "noopener")}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-primary text-sm hover:bg-accent">
            <PlusCircle className="size-4" />
            Neues Todo anlegen
          </button>

          <InlineComboboxEmpty>
            {loading ? (
              <Spinner className="size-4 text-muted-foreground" />
            ) : (
              "Keine Todos gefunden"
            )}
          </InlineComboboxEmpty>

          <InlineComboboxGroup>
            {results.map((t) => (
              <InlineComboboxItem
                key={t.id}
                value={t.title}
                onClick={() => insertTodo(t)}
                className={cn("my-2 h-10", t.done && "opacity-50")}>
                <div className="flex w-full items-center gap-2 py-4 truncate min-w-0">
                  {t.done ? (
                    <CheckCircle2 className="size-4 text-blue-500" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/80" />
                  )}
                  <span className="text-foreground truncate">
                    {t.title}
                    {t.done ? " (erledigt)" : ""}
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
