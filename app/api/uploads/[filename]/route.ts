import { NextResponse } from "next/server";
import { stat, readFile } from "node:fs/promises";
import path from "node:path";

// Next.js liefert Dateien unter public/ in Produktion NICHT zuverlässig aus,
// wenn sie erst NACH dem Build hinzukommen (next start scheint eine zur
// Build-Zeit erstellte statische Liste zu verwenden — neue Dateien landen
// sonst in einem 404). Uploads laufen deshalb über diese Route statt über
// den statischen public/uploads-Ordner: API-Routes lesen bei jedem Request
// live vom Dateisystem, unabhängig vom Build-Zeitpunkt.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  const safeName = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeName);

  if (!filePath.startsWith(UPLOAD_DIR)) {
    return NextResponse.json({ error: "Ungültiger Dateiname." }, { status: 400 });
  }

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) throw new Error("not a file");

    const buffer = await readFile(filePath);
    const contentType =
      EXT_TO_MIME[path.extname(safeName).toLowerCase()] ??
      "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stats.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Datei nicht gefunden." }, { status: 404 });
  }
}
