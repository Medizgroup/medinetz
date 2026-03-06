"use client";

import * as React from "react";
import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";

import { Editor, EditorContainer } from "@/components/ui/editor";
import { FixedToolbar } from "@/components/ui/fixed-toolbar";
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button";
import { ToolbarButton } from "@/components/ui/toolbar";

import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { MentionKit } from "@/components/editor/plugins/mention-kit";
import { SlashKit } from "@/components/editor/plugins/slash-kit";

const emptyValue: Value = [
  {
    type: "p",
    children: [{ text: "" }],
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
    plugins: [...BasicNodesKit, ...MentionKit, ...SlashKit],
    value: value && value.length > 0 ? value : emptyValue,
  });

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        onChange(value);
      }}>
      <FixedToolbar className="flex flex-wrap justify-start gap-1 rounded-t-xl">
        <ToolbarButton onClick={() => editor.tf.h1.toggle()}>H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h2.toggle()}>H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h3.toggle()}>H3</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.ul.toggle()}>
          • Liste
        </ToolbarButton>

        <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">
          B
        </MarkToolbarButton>
        <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">
          I
        </MarkToolbarButton>
      </FixedToolbar>

      <EditorContainer className="min-h-[280px] rounded-b-xl border">
        <Editor placeholder={placeholder} />
      </EditorContainer>
    </Plate>
  );
}
