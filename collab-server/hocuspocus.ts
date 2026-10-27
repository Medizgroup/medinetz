/**
 * Live-Kollaboration für Protokolle (Yjs/Hocuspocus): Authentifizierung über
 * die von der App ausgestellten Collab-Tickets (lib/collab/token.ts),
 * Editor-Slots (max. 3) und Persistenz in Postgres.
 */
import { Server, type Connection } from "@hocuspocus/server";

import prisma from "../lib/prisma";
import { verifyCollabToken } from "../lib/collab/token";
import {
  seedYDocState,
  applyStoredState,
  materializeValue,
  encodeState,
} from "../lib/collab/materialize";
import {
  extractMentionedUserIds,
  extractReferencedCaseIds,
  extractPlainTextFromNodes,
} from "../lib/utils/protocols/extract";
import { syncProtocolMentions, syncProtocolCases } from "../lib/utils/protocols/sync";
import { createMentionNotifications } from "../lib/utils/notifications";
import { cleanupRemovedUploads } from "../lib/utils/protocols/upload-cleanup";
import { defaultTemplate } from "../lib/utils/protocols/default-template";

const MAX_EDITORS = 3;
const DOC_PREFIX = "protocol-";

type SlotContext = { userId: string; isEditorEligible: boolean };

type SlotEntry = { socketId: string; userId: string };

// In-Memory pro Dokument — reicht für einen einzelnen Collab-Server-Prozess.
// Für horizontale Skalierung müsste das über mehrere Instanzen geteilt
// werden (z.B. Redis); für eine einzelne Medinetz-Instanz ist ein Prozess
// die erwartete Betriebsart.
const activeEditors = new Map<string, SlotEntry[]>();
const waitingQueue = new Map<string, SlotEntry[]>();
// Nur zum Entscheiden, ob am Ende einer Session noch ein Aktivitäts-Eintrag
// fällig ist (vermeidet einen Activity-Log-Eintrag pro Debounce-Tick).
const hasPendingActivity = new Set<string>();

function parseProtocolId(documentName: string): string | null {
  if (!documentName.startsWith(DOC_PREFIX)) return null;
  const id = documentName.slice(DOC_PREFIX.length);
  return id || null;
}

function findConnection(
  instance: { documents: Map<string, { getConnections(): Connection[] }> },
  documentName: string,
  socketId: string,
): Connection | undefined {
  const document = instance.documents.get(documentName);
  return document?.getConnections().find((c) => c.socketId === socketId);
}

function sendAccess(
  connection: Connection | undefined,
  status: "editor" | "waiting" | "viewer",
  waitingPosition?: number,
) {
  connection?.sendStateless(JSON.stringify({ type: "access", status, waitingPosition }));
}

function notifyQueuePositions(documentName: string, instance: Parameters<typeof findConnection>[0]) {
  const queue = waitingQueue.get(documentName) ?? [];
  queue.forEach((entry, idx) => {
    const conn = findConnection(instance, documentName, entry.socketId);
    sendAccess(conn, "waiting", idx + 1);
  });
}

function promoteNextWaiting(documentName: string, instance: Parameters<typeof findConnection>[0]) {
  const editors = activeEditors.get(documentName) ?? [];
  if (editors.length >= MAX_EDITORS) return;

  const queue = waitingQueue.get(documentName) ?? [];
  const next = queue.shift();
  if (!next) return;
  waitingQueue.set(documentName, queue);

  const conn = findConnection(instance, documentName, next.socketId);
  if (conn) conn.readOnly = false;
  editors.push(next);
  activeEditors.set(documentName, editors);

  sendAccess(conn, "editor");
  notifyQueuePositions(documentName, instance);
}

/**
 * WICHTIG: Die Hook-Reihenfolge bei Hocuspocus ist onConnect (context noch
 * leer, VOR der Authentifizierung) -> onAuthenticate (liefert den Context) ->
 * connected (Context ist jetzt gefüllt, UND wir bekommen eine echte
 * Connection zum Senden von Stateless-Nachrichten). Die Slot-Vergabe gehört
 * deshalb hierhin, nicht in onConnect.
 */

/**
 * Erzeugt den Hocuspocus-Server, ohne einen Port zu öffnen. Produktion:
 * server.ts reicht WebSocket-Upgrades auf /collab an `httpServer` weiter
 * (ein Prozess für App + Collab). Entwicklung: collab-server/index.ts ruft
 * listen() auf einem eigenen Port auf.
 */
export function createCollabServer() {
  return new Server({
    stopOnSignals: false,
    quiet: true,
    debounce: 2000,
    maxDebounce: 10000,

    async onAuthenticate({ token, documentName, connectionConfig }) {
      const protocolId = parseProtocolId(documentName);
      if (!protocolId) throw new Error("Ungültiger Dokumentname.");

      const verified = token ? verifyCollabToken(token) : null;
      if (!verified || verified.protocolId !== protocolId) {
        throw new Error("Nicht autorisiert.");
      }

      const protocol = await prisma.protocol.findUnique({
        where: { id: protocolId },
        select: { organizationId: true },
      });
      if (!protocol) throw new Error("Protokoll nicht gefunden.");

      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: protocol.organizationId,
            userId: verified.userId,
          },
        },
        select: { role: true },
      });
      if (!membership) throw new Error("Keine Mitgliedschaft in dieser Organisation.");

      const isEditorEligible = membership.role === "COORDINATOR" || membership.role === "ADMIN";

      // Startwert; die endgültige Slot-Entscheidung (max. 3 gleichzeitige
      // Editoren) fällt in `connected`, sobald eine echte Connection existiert.
      connectionConfig.readOnly = !isEditorEligible;

      const context: SlotContext = { userId: verified.userId, isEditorEligible };
      return context;
    },

    async connected({ documentName, socketId, context, connection }) {
      const { isEditorEligible, userId } = context as SlotContext;

      if (!isEditorEligible) {
        sendAccess(connection, "viewer");
        return;
      }

      const editors = activeEditors.get(documentName) ?? [];

      // Dieselbe Person hat das Protokoll schon in einem anderen Tab offen
      // (oder React StrictMode hat im Dev-Modus doppelt verbunden) -> keinen
      // zusätzlichen Slot verbrauchen, einfach als Editor mitzählen.
      if (editors.some((e) => e.userId === userId)) {
        connection.readOnly = false;
        sendAccess(connection, "editor");
        return;
      }

      const entry: SlotEntry = { socketId, userId };

      if (editors.length < MAX_EDITORS) {
        editors.push(entry);
        activeEditors.set(documentName, editors);
        connection.readOnly = false;
        sendAccess(connection, "editor");
        return;
      }

      // Alle 3 Slots belegt -> in die Warteschlange, Verbindung bleibt read-only
      connection.readOnly = true;
      const queue = waitingQueue.get(documentName) ?? [];
      queue.push(entry);
      waitingQueue.set(documentName, queue);
      sendAccess(connection, "waiting", queue.length);
    },

    async onDisconnect({ documentName, socketId, instance, clientsCount }) {
      const editors = activeEditors.get(documentName);
      if (editors) {
        const idx = editors.findIndex((e) => e.socketId === socketId);
        if (idx !== -1) {
          editors.splice(idx, 1);
          activeEditors.set(documentName, editors);
          promoteNextWaiting(documentName, instance);
        }
      }

      const queue = waitingQueue.get(documentName);
      if (queue) {
        const idx = queue.findIndex((e) => e.socketId === socketId);
        if (idx !== -1) {
          queue.splice(idx, 1);
          waitingQueue.set(documentName, queue);
          notifyQueuePositions(documentName, instance);
        }
      }

      if (clientsCount === 0) {
        activeEditors.delete(documentName);
        waitingQueue.delete(documentName);
      }
    },

    async onLoadDocument({ documentName }) {
      const protocolId = parseProtocolId(documentName);
      if (!protocolId) return undefined;

      const protocol = await prisma.protocol.findUnique({
        where: { id: protocolId },
        select: { ydocState: true, description: true },
      });
      if (!protocol) return undefined;

      if (protocol.ydocState) {
        return applyStoredState(new Uint8Array(protocol.ydocState));
      }

      // Erstmaliger Live-Aufruf dieses Protokolls: aus dem bisherigen
      // (klassisch gespeicherten) Inhalt seeden, damit nichts verloren geht.
      const initialValue = (protocol.description as any) ?? defaultTemplate;
      const seeded = await seedYDocState(protocolId, initialValue);
      return applyStoredState(seeded);
    },

    async onStoreDocument({ documentName, document, clientsCount, lastContext }) {
      const protocolId = parseProtocolId(documentName);
      if (!protocolId) return;

      const previous = await prisma.protocol.findUnique({
        where: { id: protocolId },
        select: { description: true, title: true },
      });
      if (!previous) return;

      const newValue = materializeValue(document);
      const state = Buffer.from(encodeState(document));

      await cleanupRemovedUploads(previous.description, newValue);

      const mentionedUserIds = extractMentionedUserIds(newValue);
      const caseIds = extractReferencedCaseIds(newValue);
      const actingUserId = (lastContext as SlotContext | undefined)?.userId;

      await prisma.protocol.update({
        where: { id: protocolId },
        data: {
          ydocState: state,
          description: newValue as any,
          descriptionText: extractPlainTextFromNodes(newValue) || null,
        },
      });

      await syncProtocolCases({ protocolId, caseIds });

      if (actingUserId) {
        const { newlyMentionedUserIds } = await syncProtocolMentions({
          protocolId,
          mentionedUserIds,
          actingUserId,
        });

        if (newlyMentionedUserIds.length > 0) {
          await createMentionNotifications({
            mentionedUserIds,
            mentioningUserId: actingUserId,
            targetType: "protocol",
            targetId: protocolId,
            title: `Du wurdest in Protokoll „${previous.title}" erwähnt`,
            notifyOnlyUserIds: newlyMentionedUserIds,
          });
        }

        hasPendingActivity.add(documentName);
      }

      // Ein Aktivitäts-Eintrag pro Bearbeitungs-Session (wenn die letzte Person
      // das Dokument verlässt), nicht pro Debounce-Tick — sonst flutet Live-
      // Kollaboration den Aktivitäts-Feed.
      if (clientsCount === 0 && hasPendingActivity.has(documentName) && actingUserId) {
        hasPendingActivity.delete(documentName);
        const protocolOrg = await prisma.protocol.findUnique({
          where: { id: protocolId },
          select: { organizationId: true },
        });
        if (protocolOrg) {
          await prisma.activity.create({
            data: {
              organizationId: protocolOrg.organizationId,
              userId: actingUserId,
              action: "UPDATED",
              targetType: "protocol",
              targetId: protocolId,
              metadata: { title: previous.title, mentionedUserIds, caseIds },
            },
          });
        }
      }
    },
  });
}
