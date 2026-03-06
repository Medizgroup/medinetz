"use client";

import * as React from "react";
import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";

import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import { ToolbarButton, ToolbarGroup } from "@/components/ui/toolbar";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { MentionKit } from "@/components/editor/plugins/mention-kit";
import { SlashKit } from "@/components/editor/plugins/slash-kit";
import {
  BoldIcon,
  HighlighterIcon,
  ItalicIcon,
  PaintBucketIcon,
  QuoteIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";
import { ListKit } from "../editor/plugins/list-kit";
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from "../ui/list-toolbar-button";
import { BlockSelectionKit } from "../editor/plugins/block-selection-kit";
import { InsertToolbarButton } from "../ui/insert-toolbar-button";
import { TurnIntoToolbarButton } from "../ui/turn-into-toolbar-button";
import { FontSizeToolbarButton } from "../ui/font-size-toolbar-button";
import { AlignKit } from "../editor/plugins/align-kit";
import { FontKit } from "../editor/plugins/font-kit";
import { FontColorToolbarButton } from "../ui/font-color-toolbar-button";
import { DndKit } from "../editor/plugins/dnd-kit";
import { CalloutKit } from "../editor/plugins/callout-kit";

const emptyValue: Value = [
  {
    type: "p",
    children: [{ text: "Anwesende: " }],
  },
];

export default function ProtocolEditor({
  value,
  onChange,
  placeholder = "Schreibe dein Protokoll…",
}: {
  value?: Value;
  onChange: (value: Value) => void;
  placeholder?: string;
}) {
  const editor = usePlateEditor({
    plugins: [
      ...BasicNodesKit,
      ...MentionKit,
      ...SlashKit,
      ...ListKit,
      ...BlockSelectionKit,
      ...AlignKit,
      ...FontKit,
      ...DndKit,
      ...CalloutKit,
    ],
    value: value && value.length > 0 ? value : emptyValue,
  });

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        onChange(value);
      }}>
      <FixedToolbar className="flex justify-start p-1 rounded-xl gap-1 overflow-x-auto">
        <ToolbarGroup>
          <InsertToolbarButton />
          <TurnIntoToolbarButton />
          <FontSizeToolbarButton />
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton onClick={() => editor.tf.h1.toggle()}>
            H1
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h2.toggle()}>
            H2
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h3.toggle()}>
            H3
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.blockquote.toggle()}>
            <QuoteIcon size={16} />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarGroup>
          <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
            <BoldIcon />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
            <ItalicIcon />
          </MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">
            <UnderlineIcon />
          </MarkToolbarButton>
          <MarkToolbarButton
            nodeType="strikethrough"
            tooltip="Strikethrough (⌘+Shift+X)">
            <StrikethroughIcon />
          </MarkToolbarButton>
          <MarkToolbarButton
            nodeType="highlight"
            tooltip="Highlight (⌘+Shift+H)">
            <HighlighterIcon />
          </MarkToolbarButton>
          <FontColorToolbarButton nodeType="color">
            <PaintBucketIcon />
          </FontColorToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <TodoListToolbarButton></TodoListToolbarButton>
          <BulletedListToolbarButton></BulletedListToolbarButton>
          <NumberedListToolbarButton></NumberedListToolbarButton>
        </ToolbarGroup>
      </FixedToolbar>

      <EditorContainer className="min-h-[280px] rounded-xl border">
        <Editor placeholder={placeholder} className="px-10!" />
      </EditorContainer>
    </Plate>
  );
}
