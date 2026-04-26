"use client";

import * as React from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

import type { TComboboxInputElement, TElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import {
  PlateElement,
  useEditorRef,
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
      <FolderOpen className="size-3.5" />
      {label}
    </span>
  );

  return (
    <PlateElement
      {...props}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        "data-slate-value": label,
        "data-case-id": caseId,
        draggable: true,
      }}>
      {readOnly && caseId ? (
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
            {loading ? "Suche…" : "Keine Fälle gefunden"}
          </InlineComboboxEmpty>

          <InlineComboboxGroup>
            {results.map((c) => (
              <InlineComboboxItem
                key={c.id}
                value={`${c.caseNumber} ${c.title} ${c.patientPseudonym}`}
                onClick={() => insertCase(c)}>
                <div className="flex w-full items-start gap-2">
                  <span className="font-mono text-xs text-muted-foreground tabular-nums pt-0.5">
                    #{c.caseNumber}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium">{c.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.patientPseudonym} · {c.status}
                    </span>
                  </div>
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
