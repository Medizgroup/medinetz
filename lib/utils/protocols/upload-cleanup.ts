import { unlink } from "node:fs/promises";
import path from "node:path";

import { extractUploadedFileUrls } from "./extract";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Löscht Dateien unter public/uploads, die in `oldNodes` referenziert waren,
 * aber in `newNodes` nicht mehr vorkommen — sonst sammeln sich verwaiste
 * Uploads dort für immer an (z.B. wenn ein Bild aus dem Protokoll entfernt
 * oder das ganze Protokoll gelöscht wird).
 */
export async function cleanupRemovedUploads(
  oldNodes: unknown,
  newNodes: unknown,
): Promise<void> {
  const oldUrls = new Set(extractUploadedFileUrls(oldNodes));
  const newUrls = new Set(extractUploadedFileUrls(newNodes));

  const removed = [...oldUrls].filter((url) => !newUrls.has(url));
  if (removed.length === 0) return;

  await Promise.all(
    removed.map(async (url) => {
      const filename = path.basename(url);
      const filePath = path.join(UPLOAD_DIR, filename);
      // Innerhalb von UPLOAD_DIR bleiben (Path-Traversal-Schutz)
      if (!filePath.startsWith(UPLOAD_DIR)) return;
      await unlink(filePath).catch(() => {
        // Datei existiert evtl. schon nicht mehr — kein Fehler wert
      });
    }),
  );
}

/** Löscht alle in einem Protokoll-Body referenzierten Uploads (z.B. beim Löschen des ganzen Protokolls). */
export async function cleanupAllUploads(nodes: unknown): Promise<void> {
  await cleanupRemovedUploads(nodes, []);
}
