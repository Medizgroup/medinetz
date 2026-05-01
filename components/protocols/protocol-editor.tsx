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

const emptyValue: Value = [
  {
    type: "p",
    children: [{ text: "Anwesende: " }],
  },
];

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
      // ...AutoformatKit,
      ...TableKit,
      ...MediaKit,
      ...BlockPlaceholderKit,
      ...ExitBreakKit,
      ...EmojiKit,
      ...FixedToolbarKit,
      ...FloatingToolbarKit,
      ...CursorOverlayKit,
    ],
    value: value && value.length > 0 ? value : emptyValue,
  });

  return (
    <ProtocolEditorProvider organizationId={organizationId}>
      <Plate
        editor={editor}
        onChange={({ value }) => {
          onChange(value);
        }}>
        <EditorContainer className="min-h-[280px] rounded-xl">
          <Editor placeholder={placeholder} className="" variant="fullWidth" />
        </EditorContainer>
      </Plate>
    </ProtocolEditorProvider>
  );
}
