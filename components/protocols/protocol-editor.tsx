/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";

import { Editor, EditorContainer } from "@/components/ui/editor";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { MentionKit } from "@/components/editor/plugins/mention-kit";
import { SlashKit } from "@/components/editor/plugins/slash-kit";
import { TableKit } from "@/components/editor/plugins/table-kit";
import { MediaKit } from "@/components/editor/plugins/media-kit";
import { ListKit } from "../editor/plugins/list-kit";
import { BlockSelectionKit } from "../editor/plugins/block-selection-kit";
import { AlignKit } from "../editor/plugins/align-kit";
import { FontKit } from "../editor/plugins/font-kit";
import { DndKit } from "../editor/plugins/dnd-kit";
import { CalloutKit } from "../editor/plugins/callout-kit";

import { ProtocolEditorProvider } from "./protocol-editor-context";
import { CaseReferenceKit } from "../editor/plugins/case-reference-kit";
import { BlockPlaceholderKit } from "../editor/plugins/block-placeholder-kit";
import { IndentKit } from "../editor/plugins/indent-kit";
import { ExitBreakKit } from "../editor/plugins/exit-break-kit";
import { EmojiKit } from "../editor/plugins/emoji-kit";
import { FixedToolbarKit } from "../editor/plugins/fixed-toolbar-kit";
import { FloatingToolbarKit } from "../editor/plugins/floating-toolbar-kit";
import { CursorOverlayKit } from "../editor/plugins/cursor-overlay-kit";
import { AutoformatKit } from "../editor/plugins/autoformat-kit";
import { LinkKit } from "../editor/plugins/link-kit";

// Helper functions
const p = (text = "", color?: string) => ({
  type: "p",
  children: [{ text, ...(color && { color }) }],
});
const h2 = (text: string) => ({ type: "h2", children: [{ text }] });
const blockquote = (text: string, color?: string) => ({
  type: "blockquote",
  children: [{ text, ...(color && { color }) }],
});
const th = (text: string) => ({ type: "td", children: [p(text)] });
const td = (text = "") => ({ type: "td", children: [p(text)] });
const tr = (cells: any[]) => ({ type: "tr", children: cells });
const table = (rows: any[], colSizes?: number[]) => ({
  type: "table",
  colSizes,
  children: rows,
});

const caseTable = () =>
  table(
    [
      tr([
        th("Fall"),
        th("Betreuer"),
        th("Termine"),
        th("Status"),
        th("Bemerkung"),
      ]),
      tr([td(), td(), td(), td(), td()]),
      tr([td(), td(), td(), td(), td()]),
    ],
    [100, 200, 200, 150, 400],
  );

const agTable = () =>
  table(
    [tr([th("Protokoll Link"), th("Bemerkungen")]), tr([td(), td()])],
    [300, 550],
  );

// Removed illegal call to useTheme. React hooks must be called inside a component or custom Hook.
export const defaultTemplate: Value = [
  p("Anwesend: ", "#f59e0b"),
  p(" "),
  p(" "),
  h2("1. Aktuelle Fälle"),
  p(" "),
  caseTable(),

  h2("2. Neue Anfragen"),
  p(" "),
  caseTable(),
  p(" "),
  blockquote("Tipp: Fälle können auch nachträglich hinzugefügt werden!"),
  p(" "),
  h2("3. AG Schwangerenprojekt"),
  p(" "),
  p(" "),
  agTable(),
  p(" "),
  h2("4. AG Clearingstelle Gießen Marburg"),
  p(" "),
  agTable(),
  p(" "),
  h2("5. AG Öffentlichkeitsarbeit"),
  p(" "),
  agTable(),
  p(" "),
  h2("6. Termine & Organisatorisches"),
  p(" "),
  p("Kommende Termine und Veranstaltungen:"),
  p(" "),
  table(
    [
      tr([th("Aufgaben"), th("Notizen")]),
      tr([td("📅 Termine / Veranstaltungen"), td()]),
      tr([td("☎️ Handy"), td()]),
      tr([td("📪 Mails"), td()]),
      tr([td("💰 Finanzen / Rechnungen"), td()]),
      tr([td("🏛️ Politische Arbeit / ABSH"), td()]),
    ],
    [300, 600],
  ),
  p(" "),
] as Value;

export default function ProtocolEditor({
  value,
  onChange,
  organizationId,
  placeholder = "Schreibe dein Protokoll…",
}: {
  value?: Value;
  onChange: (value: Value) => void;
  organizationId: string;
  placeholder?: string;
}) {
  const editor = usePlateEditor({
    plugins: [
      ...BasicNodesKit,
      ...MentionKit,
      ...CaseReferenceKit,
      ...SlashKit,
      ...ListKit,
      ...BlockSelectionKit,
      ...AlignKit,
      ...FontKit,
      ...DndKit,
      ...CalloutKit,
      ...IndentKit,
      ...AutoformatKit,
      ...TableKit,
      ...MediaKit,
      ...BlockPlaceholderKit,
      ...ExitBreakKit,
      ...EmojiKit,
      ...FixedToolbarKit,
      ...FloatingToolbarKit,
      ...CursorOverlayKit,
      ...LinkKit,
    ],
    value: value && value.length > 0 ? value : defaultTemplate,
  });

  return (
    <ProtocolEditorProvider organizationId={organizationId}>
      <Plate
        editor={editor}
        onChange={({ value }) => {
          onChange(value);
        }}>
        <EditorContainer className="min-h-[280px] rounded-xl overflow-x-clip overflow-y-visible!">
          <Editor
            placeholder={placeholder}
            className="px-6!"
            variant="fullWidth"
          />
        </EditorContainer>
      </Plate>
    </ProtocolEditorProvider>
  );
}
