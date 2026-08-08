"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { unlink } from "node:fs/promises";
import path from "node:path";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ActionState, profileSchema, type FormErrors } from "@/lib/types/auth";
import {
  avatarConfigSchema,
  buildAvatarUrl,
  type AvatarConfig,
} from "@/lib/avatar/dicebear";
import { Prisma } from "@/generated/prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function isLocalUpload(url: string | null | undefined): url is string {
  return !!url && url.startsWith("/api/uploads/");
}

async function deleteLocalUpload(url: string) {
  const filePath = path.join(UPLOAD_DIR, path.basename(url));
  if (!filePath.startsWith(UPLOAD_DIR)) return; // Path-Traversal-Schutz
  await unlink(filePath).catch(() => {
    // Datei existiert evtl. schon nicht mehr — kein Fehler wert
  });
}

function toErrors(error: z.ZodError): FormErrors {
  const { fieldErrors } = z.flattenError(error);
  return fieldErrors as FormErrors;
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false, errors: {}, message: "Nicht eingeloggt." };
  }

  const raw = Object.fromEntries(formData.entries());

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: toErrors(parsed.error) };
  }

  // avatarConfig kommt als JSON-String (oder "" wenn gelöscht)
  let avatarConfig: AvatarConfig | null = null;
  const rawConfig = raw.avatarConfig;
  if (typeof rawConfig === "string" && rawConfig.trim() !== "") {
    let json: unknown;
    try {
      json = JSON.parse(rawConfig);
    } catch {
      return { ok: false, errors: { avatarConfig: "Ungültige Avatar-Daten." } };
    }
    const config = avatarConfigSchema.safeParse(json);
    if (!config.success) {
      return { ok: false, errors: { avatarConfig: "Ungültige Avatar-Daten." } };
    }
    avatarConfig = config.data;
  }

  // Bei einem generierten Avatar wird die URL immer serverseitig aus der
  // Config abgeleitet – der Client-Wert wird nicht vertraut. Bei einem
  // selbst hochgeladenen Bild vertrauen wir der URL nur, wenn sie über
  // unseren eigenen (authentifizierten, validierenden) Upload-Endpunkt
  // erzeugt wurde.
  const rawAvatarUrl = typeof raw.avatarUrl === "string" ? raw.avatarUrl : "";
  const uploadedAvatarUrl =
    !avatarConfig && isLocalUpload(rawAvatarUrl) ? rawAvatarUrl : null;

  const avatarUrl = avatarConfig
    ? buildAvatarUrl(avatarConfig)
    : uploadedAvatarUrl;

  const { firstName, lastName, displayName } = parsed.data;
  const computedName = displayName.trim() || `${firstName} ${lastName}`.trim();

  const previous = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName,
      lastName,
      displayName,
      name: computedName,
      avatarUrl,
      avatarConfig: avatarConfig
        ? (avatarConfig as Prisma.InputJsonValue)
        : Prisma.DbNull,
    },
  });

  // Ersetztes oder entferntes, selbst hochgeladenes Profilbild von der
  // Platte löschen — sonst sammeln sich verwaiste Dateien in
  // public/uploads an.
  if (isLocalUpload(previous?.avatarUrl) && previous!.avatarUrl !== avatarUrl) {
    await deleteLocalUpload(previous!.avatarUrl!);
  }

  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Server Action: Speichert einen neuen Avatar-Link in der Datenbank.
 * Erwartet ein Objekt { avatarUrl: string }
 */
export async function saveAvatarUrlAction(
  avatarUrl: string,
): Promise<{ ok: boolean; errors?: Record<string, string> }> {
  if (typeof avatarUrl !== "string" || !avatarUrl.trim()) {
    return { ok: false, errors: { avatarUrl: "Ungültige Avatar-URL." } };
  }

  // Authentifizieren
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, errors: { auth: "Nicht authentifiziert." } };
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  if (isLocalUpload(previous?.avatarUrl) && previous!.avatarUrl !== avatarUrl) {
    await deleteLocalUpload(previous!.avatarUrl!);
  }

  revalidatePath("settings/profile");

  return { ok: true };
}

/**
 * Server Action: Übernimmt ein selbst hochgeladenes Profilbild sofort in die
 * Datenbank (analog zu saveAvatarUrlAction für generierte Avatare) — sonst
 * geht die Auswahl beim nächsten Seitenaufruf verloren, weil sie sonst nur
 * im Formular-State liegt, bis "Speichern" geklickt wird. Löscht zusätzlich
 * eine evtl. noch gesetzte Avatar-Config, damit updateProfileAction beim
 * nächsten Absenden nicht wieder einen alten generierten Avatar herstellt.
 */
export async function saveUploadedAvatarAction(
  avatarUrl: string,
): Promise<{ ok: boolean; errors?: Record<string, string> }> {
  if (!isLocalUpload(avatarUrl)) {
    return { ok: false, errors: { avatarUrl: "Ungültige Avatar-URL." } };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, errors: { auth: "Nicht authentifiziert." } };
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl, avatarConfig: Prisma.DbNull },
  });

  if (isLocalUpload(previous?.avatarUrl) && previous!.avatarUrl !== avatarUrl) {
    await deleteLocalUpload(previous!.avatarUrl!);
  }

  revalidatePath("/settings/profile");

  return { ok: true };
}

/**
 * Server Action: Entfernt den Avatar sofort (DB + evtl. Datei auf der
 * Platte) — aus demselben Grund wie saveUploadedAvatarAction: "Avatar
 * löschen" darf nicht erst beim Klick auf "Speichern" wirken, sonst ist die
 * Datei nach einem Reload wieder da.
 */
export async function removeAvatarAction(): Promise<{
  ok: boolean;
  errors?: Record<string, string>;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, errors: { auth: "Nicht authentifiziert." } };
  }

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null, avatarConfig: Prisma.DbNull },
  });

  if (isLocalUpload(previous?.avatarUrl)) {
    await deleteLocalUpload(previous!.avatarUrl!);
  }

  revalidatePath("/settings/profile");

  return { ok: true };
}
