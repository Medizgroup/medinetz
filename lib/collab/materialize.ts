import type { Value } from "platejs";
import * as Y from "yjs";
import { yTextToSlateElement } from "@slate-yjs/core";
import { slateToDeterministicYjsState } from "@platejs/yjs";

// Framework-agnostic (kein React) — läuft im Collab-Server (Node-Prozess).
// Bindet an denselben Shared-Type-Key ("content"), den @platejs/yjs im
// Browser per Default verwendet (siehe YjsPlugin/withPlateYjs).
const SHARED_TYPE_KEY = "content";

/**
 * Erstellt den initialen Yjs-Zustand für ein Protokoll, das zum ersten Mal
 * live bearbeitet wird (noch kein gespeicherter ydocState vorhanden).
 * Deterministisch: dieselbe protocolId + derselbe Ausgangs-Value ergeben
 * überall identische Bytes.
 */
export async function seedYDocState(
  protocolId: string,
  value: Value,
): Promise<Uint8Array> {
  return slateToDeterministicYjsState(protocolId, value);
}

/**
 * Wendet einen gespeicherten Yjs-Update-Bytestream auf ein frisches Y.Doc an.
 */
export function applyStoredState(state: Uint8Array): Y.Doc {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, state);
  return ydoc;
}

/**
 * Liest den aktuellen Dokumentinhalt eines Y.Doc als Plate/Slate-Value aus —
 * für den lesbaren Snapshot in `Protocol.description` (Liste, Suche,
 * Mentions-/Fall-Extraktion, Export).
 */
export function materializeValue(ydoc: Y.Doc): Value {
  const sharedType = ydoc.get(SHARED_TYPE_KEY, Y.XmlText);
  const root = yTextToSlateElement(sharedType);
  return root.children as Value;
}

export function encodeState(ydoc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(ydoc);
}
