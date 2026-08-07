/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import type { Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { YjsPlugin } from "@platejs/yjs/react";

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
import { DateKit } from "../editor/plugins/date-kit";
import { TodoReferenceKit } from "../editor/plugins/todo-reference-kit";
import { EventReferenceKit } from "../editor/plugins/event-reference-kit";
import { TocPlugin } from "@platejs/toc/react";
import { ProtocolTocSidebar } from "./protocol-toc-sidebar";
import { RemoteCursorOverlay } from "../ui/remote-cursor-overlay";
import { userColorFromId } from "@/lib/utils/user-color";

import { defaultTemplate } from "@/lib/utils/protocols/default-template";

export { defaultTemplate };

export type AccessStatus = "editor" | "waiting" | "viewer" | null;

export type CollabConfig = {
  protocolId: string;
  token: string;
  userId: string;
  userName: string;
  avatarUrl?: string | null;
};

export type PresenceUser = {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  color: string;
};

const COLLAB_WS_URL =
  process.env.NEXT_PUBLIC_COLLAB_WS_URL || "ws://localhost:1234";

export default function ProtocolEditor({
  value,
  onChange,
  organizationId,
  placeholder = "Schreibe dein Protokoll…",
  canEdit = true,
  collab,
  onAccessChange,
  onPresenceChange,
}: {
  value?: Value;
  onChange?: (value: Value) => void;
  organizationId: string;
  placeholder?: string;
  /** false = reine:r Betrachter:in: Editor startet gesperrt, Umschalter ausgeblendet. */
  canEdit?: boolean;
  /** Wenn gesetzt: Live-Kollaboration über Yjs/Hocuspocus statt lokalem State. */
  collab?: CollabConfig;
  /** Wird aufgerufen, sobald der Collab-Server mitteilt, ob dieser Client
   * gerade einen der 3 Editier-Plätze hat, wartet, oder reine:r Betrachter:in ist. */
  onAccessChange?: (status: AccessStatus, waitingPosition?: number) => void;
  /** Wird mit der Liste aller gerade live anwesenden Nutzer:innen aufgerufen
   * (Editor:innen UND reine Betrachter:innen), basierend auf der Yjs-Awareness. */
  onPresenceChange?: (users: PresenceUser[]) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isLive = Boolean(collab);
  // Optimistischer Startwert (Rolle), bis der Collab-Server den tatsächlichen
  // Slot-Status meldet (Editor / Warteschlange / reine:r Betrachter:in).
  const [accessStatus, setAccessStatus] = React.useState<AccessStatus>(
    canEdit ? "editor" : "viewer",
  );
  // PlateContent rendert `null`, solange editor.children leer ist (Slate
  // selbst mountet dann gar nicht erst -> keine React-Bindung, die auf
  // spätere Mutationen reagieren könnte). yjs.init() füllt editor.children
  // zwar imperativ, das allein löst aber KEIN Re-Render aus — ohne diesen
  // State bliebe die Komponente für immer bei `null` hängen, selbst nachdem
  // der Yjs-Sync längst abgeschlossen ist.
  const [yjsReady, setYjsReady] = React.useState(false);

  // Wichtig: onStateless braucht Zugriff auf den Editor, um readOnly zu
  // setzen — dafür einen Ref statt einer direkten Closure über `editor`
  // verwenden, damit dieses Objekt NICHT von `editor` abhängt (sonst
  // zirkuläre Abhängigkeit: editor -> plugins -> onStateless -> editor).
  const editorRef = React.useRef<any>(null);
  const onAccessChangeRef = React.useRef(onAccessChange);
  onAccessChangeRef.current = onAccessChange;
  const onPresenceChangeRef = React.useRef(onPresenceChange);
  onPresenceChangeRef.current = onPresenceChange;

  // KRITISCH: Dieses Array darf sich über die Lebensdauer der Komponente
  // NICHT ändern (stabil per useMemo mit leeren Deps). Würde es bei jedem
  // Render neu erzeugt, könnte usePlateEditor eine neue Editor-Instanz
  // erzeugen, während der yjs-Verbindungsaufbau (im useEffect unten, der
  // nur einmal läuft) noch an der ALTEN Instanz hängt — die tatsächlich
  // gerenderte Instanz bekäme dann nie eine echte Yjs-Verbindung
  // (leeres Dokument, verwaister WebSocket, "remove event handler that
  // doesn't exist"). Da collab/canEdit sich während einer Sitzung nicht
  // ändern, ist das unbedenklich.
  const plugins = React.useMemo(
    () =>
      [
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
        ...DateKit,
        ...TodoReferenceKit,
        ...EventReferenceKit,
        TocPlugin,
        ...(collab
          ? [
              YjsPlugin.configure({
                options: {
                  cursors: {
                    data: {
                      userId: collab.userId,
                      name: collab.userName,
                      avatarUrl: collab.avatarUrl ?? null,
                      color: userColorFromId(collab.userId),
                    },
                  },
                  onError: (p: any) =>
                    console.error("[collab] Verbindung zum Collab-Server fehlgeschlagen:", p),
                  providers: [
                    {
                      type: "hocuspocus",
                      options: {
                        name: `protocol-${collab.protocolId}`,
                        url: COLLAB_WS_URL,
                        token: collab.token,
                        onStateless: ({ payload }: { payload: string }) => {
                          try {
                            const msg = JSON.parse(payload);
                            if (msg.type === "access") {
                              setAccessStatus(msg.status);
                              onAccessChangeRef.current?.(msg.status, msg.waitingPosition);
                              (editorRef.current?.store as any)?.setReadOnly(
                                msg.status !== "editor",
                              );
                            }
                          } catch {
                            // Ignoriere unbekannte Stateless-Payloads
                          }
                        },
                      },
                    },
                  ],
                },
                render: { afterEditable: () => <RemoteCursorOverlay containerRef={containerRef} /> },
              }),
            ]
          : []),
      ] as any,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const editor = usePlateEditor({
    plugins,
    skipInitialization: isLive,
    value: isLive ? undefined : (value && value.length > 0 ? value : defaultTemplate),
  });
  editorRef.current = editor;

  React.useEffect(() => {
    if (!isLive) return;

    // StrictMode-sicher: React (dev) mountet Effekte doppelt (mount ->
    // cleanup -> mount). yjs.init() ist async — ohne diese Absicherung kann
    // destroy() mitten in einer noch laufenden Verbindung feuern. Falls die
    // Verbindung erst NACH dem Cleanup fertig aufgebaut wird, sofort wieder
    // trennen statt eine verwaiste Verbindung offen zu lassen.
    let cancelled = false;
    let awareness: any = null;
    const handleAwarenessChange = () => {
      const states: Map<number, any> = awareness.getStates();
      const byUserId = new Map<string, PresenceUser>();
      for (const state of states.values()) {
        const data = state?.data;
        if (!data?.userId) continue;
        byUserId.set(data.userId, {
          userId: data.userId,
          userName: data.name ?? "?",
          avatarUrl: data.avatarUrl ?? null,
          color: data.color ?? "hsl(0, 0%, 60%)",
        });
      }
      onPresenceChangeRef.current?.(Array.from(byUserId.values()));
    };

    editor
      .getApi(YjsPlugin)
      .yjs.init({
        id: `protocol-${collab!.protocolId}`,
        value: value && value.length > 0 ? value : defaultTemplate,
      })
      .then(() => {
        if (cancelled) {
          editor.getApi(YjsPlugin).yjs.destroy();
        } else {
          setYjsReady(true);
          awareness = editor.getOptions(YjsPlugin).awareness;
          awareness?.on("change", handleAwarenessChange);
          handleAwarenessChange();
        }
      });

    return () => {
      cancelled = true;
      awareness?.off("change", handleAwarenessChange);
      onPresenceChangeRef.current?.([]);
      editor.getApi(YjsPlugin).yjs.destroy();
    };
    // Nur beim Mount verbinden — collab/value ändern sich nicht während einer Sitzung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (isLive) return;
    if (!canEdit) (editor.store as any).setReadOnly(true);
    // Nur beim Mount anwenden — canEdit ändert sich während einer Sitzung nicht.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveCanEdit = isLive ? accessStatus === "editor" : canEdit;

  return (
    <ProtocolEditorProvider organizationId={organizationId} canEdit={effectiveCanEdit}>
      <Plate
        editor={editor}
        onChange={({ value }) => {
          if (!isLive) onChange?.(value);
        }}>
        <div className="flex items-start gap-4">
          <EditorContainer
            ref={containerRef}
            className="min-h-70 min-w-0 flex-1 rounded-xl overflow-x-clip overflow-y-visible!">
            <Editor
              placeholder={placeholder}
              className="px-6!"
              variant="fullWidth"
            />
          </EditorContainer>
          <ProtocolTocSidebar />
        </div>
      </Plate>
    </ProtocolEditorProvider>
  );
}
