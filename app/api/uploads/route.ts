import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@/lib/auth";

// Kostenloser, selbst gehosteter Ersatz für den bezahlten Uploadthing-Dienst:
// Dateien landen lokal unter public/uploads und werden von Next.js wie jede
// andere statische Datei ausgeliefert. In Docker sollte dieses Verzeichnis
// auf ein persistentes Volume gemountet werden, sonst gehen Uploads beim
// Container-Neustart verloren.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_FILE_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function sanitizeFileName(name: string) {
  const base = path.basename(name).replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return base.slice(-100) || "datei";
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten." }, { status: 400 });
  }

  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
  const isAllowedFile = ALLOWED_FILE_TYPES.has(file.type);

  if (!isAllowedFile) {
    return NextResponse.json(
      { error: `Dateityp „${file.type || "unbekannt"}" ist nicht erlaubt.` },
      { status: 400 },
    );
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error: `Datei ist zu groß (max. ${Math.floor(maxBytes / 1024 / 1024)} MB).`,
      },
      { status: 400 },
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const safeName = sanitizeFileName(file.name || "upload");
  const storedName = `${randomUUID()}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(path.join(UPLOAD_DIR, storedName), Buffer.from(arrayBuffer));

  return NextResponse.json({
    key: storedName,
    name: file.name || safeName,
    size: file.size,
    type: file.type,
    url: `/uploads/${storedName}`,
  });
}
