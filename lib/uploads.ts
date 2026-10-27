import path from "node:path";

/**
 * Ablageort für Datei-Uploads. In Docker per UPLOAD_DIR auf ein persistentes
 * Volume zeigen lassen, sonst gehen Uploads beim Neustart verloren.
 */
export const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads"),
);
