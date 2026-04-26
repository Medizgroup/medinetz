"use client";

import * as React from "react";
import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";

import { Editor, EditorContainer } from "@/components/ui/editor";
import { BasicNodesKit } from "@/components/editor/plugins/basic-nodes-kit";
import { MentionKit } from "@/components/editor/plugins/mention-kit";

import { ProtocolEditorProvider } from "@/components/protocols/protocol-editor-context";

const emptyValue: Value = [{ type: "p", children: [{ text: "" }] }];

export default function CaseCommentEditor({
  value,
  onChange,
  organizationId,
  placeholder = "Schreibe einen Kommentar…",
}: {
  value?: Value;
  onChange: (value: Value) => void;
  organizationId: string;
  placeholder?: string;
}) {
  const editor = usePlateEditor({
    plugins: [...BasicNodesKit, ...MentionKit],
    value: value && value.length > 0 ? value : emptyValue,
  });

  return (
    <ProtocolEditorProvider organizationId={organizationId}>
      <Plate editor={editor} onChange={({ value }) => onChange(value)}>
        <EditorContainer className="min-h-[120px] rounded-lg border bg-background">
          <Editor placeholder={placeholder} className="px-3! py-2! text-sm" />
        </EditorContainer>
      </Plate>
    </ProtocolEditorProvider>
  );
}
