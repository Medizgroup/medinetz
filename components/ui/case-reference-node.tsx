"use client";

import * as React from "react";
import Link from "next/link";

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
import { Circle, CircleCheck, Clock, Loader } from "lucide-react";

type CaseSearchResult = {
  id: string;
  caseNumber: number;
  title: string;
  status: string;
  priority: string;
  patientPseudonym: string;
};

/**
 * Statisches Element, sobald eine Case-Referenz im Editor steckt.
 */
const onSelectItem = getMentionOnSelectItem();

export function CaseReferenceElement(
  props: PlateElementProps<TElement & { value?: string; caseId?: string }>,
) {
  const { element } = props;
  const selected = useSelected();
  const focused = useFocused();
  const readOnly = useReadOnly();
  const caseId = (element as any).caseId as string | undefined;
  const label = element.value ?? "";

  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 align-baseline text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        !readOnly && "cursor-pointer",
        selected && focused && "ring-2 ring-ring",
      )}>
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
        "data-case-id": caseId,
        draggable: true,
      }}>
      {caseId ? (
        <Link href={`/cases/${caseId}`} target="_blank" rel="noopener">
          {inner}
        </Link>
      ) : (
        inner
      )}
      {props.children}
    </PlateElement>
  );
}

/**
 * Eingabe-UI, während der User "#…" tippt.
 */
export function CaseReferenceInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [results, setResults] = React.useState<CaseSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  const { organizationId } = useProtocolEditorContext();

  React.useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("q", debouncedSearch);
    params.set("organizationId", organizationId);

    fetch(`/api/cases/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CaseSearchResult[]) => {
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

  const insertCase = React.useCallback(
    (c: CaseSearchResult) => {
      const label = `#${c.caseNumber}`;

      // 1) Lass Plate einen normalen mention-Node einfügen (clean)
      onSelectItem(editor, { key: c.id, text: label }, search);

      // 2) Den eben eingefügten Node finden und zu case_reference umtypen
      const matches = [
        ...editor.api.nodes<any>({
          at: [],
          match: (n: any) =>
            n.type === "mention" && n.value === label && !n.caseId,
        }),
      ];

      if (matches.length > 0) {
        const [, foundPath] = matches[matches.length - 1];
        editor.tf.setNodes(
          {
            type: "case_reference",
            caseId: c.id,
            caseTitle: c.title,
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
        trigger="#"
        filter={false}>
        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring focus-within:ring-2">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5 w-[360px]">
          <InlineComboboxEmpty>
            {loading ? (
              <Spinner className="size-4 text-muted-foreground" />
            ) : (
              "Keine Fälle gefunden"
            )}
          </InlineComboboxEmpty>

          <InlineComboboxGroup>
            {results.map((c) => (
              <InlineComboboxItem
                key={c.id}
                value={`${c.caseNumber} ${c.title} ${c.patientPseudonym}`}
                onClick={() => insertCase(c)}
                className="my-2 h-10">
                <div className="flex w-full items-center  gap-2 py-4 truncate min-w-0">
                  <span>
                    {c.status === "WAITING" ? (
                      <Clock className="size-4 text-muted-foreground/80" />
                    ) : c.status === "CLOSED" ? (
                      <CircleCheck className="size-4 text-blue-500" />
                    ) : c.status === "IN_PROGRESS" ? (
                      <Loader className="size-4  text-amber-500" />
                    ) : c.status === "OPEN" ? (
                      <Circle className="size-4 text-green-500" />
                    ) : null}
                  </span>
                  <span className="text-foreground tabular-nums pt-0.5">
                    #{c.caseNumber}{" "}
                    <span className="text-muted-foreground ">{c.title}</span>
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
