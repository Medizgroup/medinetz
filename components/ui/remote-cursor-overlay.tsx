"use client";

import * as React from "react";
import { useRemoteCursorOverlayPositions } from "@slate-yjs/react";
import type { CursorOverlayData } from "@slate-yjs/react";

type CursorData = { name: string; color: string };

/**
 * Zeigt die Cursor/Selektionen anderer aktuell verbundener Nutzer:innen live
 * über dem Editor-Inhalt an (Google-Docs-Stil). Muss innerhalb eines
 * relativ/absolut positionierten Containers gerendert werden — siehe
 * containerRef in protocol-editor.tsx.
 */
export function RemoteCursorOverlay({
  containerRef,
}: {
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [cursors] = useRemoteCursorOverlayPositions<CursorData>({
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
  });

  return (
    <>
      {cursors.map((cursor) => (
        <RemoteSelection key={cursor.clientId} {...cursor} />
      ))}
    </>
  );
}

function RemoteSelection({ data, selectionRects, caretPosition }: CursorOverlayData<CursorData>) {
  if (!data) return null;

  return (
    <>
      {selectionRects.map((rect, i) => (
        <div
          key={i}
          style={{
            ...rect,
            position: "absolute",
            backgroundColor: data.color,
            opacity: 0.35,
            pointerEvents: "none",
            borderRadius: 2,
          }}
        />
      ))}
      {caretPosition ? <RemoteCaret caretPosition={caretPosition} data={data} /> : null}
    </>
  );
}

function RemoteCaret({
  caretPosition,
  data,
}: {
  caretPosition: NonNullable<CursorOverlayData<CursorData>["caretPosition"]>;
  data: CursorData;
}) {
  return (
    <div
      style={{
        ...caretPosition,
        position: "absolute",
        width: 2,
        background: data.color,
        pointerEvents: "none",
      }}>
      <div
        className="whitespace-nowrap rounded-t-sm px-1.5 py-0.5 text-[10px] text-white"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: "translateY(-100%)",
          background: data.color,
        }}>
        {data.name}
      </div>
    </div>
  );
}
