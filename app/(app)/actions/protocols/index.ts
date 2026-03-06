"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { plainTextToRichText } from "@/lib/utils/protocols/rich-text";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

async function getMembership(userId: string, organizationId: string) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });
}

function canEdit(role?: string) {
  return role === "COORDINATOR" || role === "ADMIN";
}

function canComment(role?: string) {
  return role === "VIEWER" || role === "COORDINATOR" || role === "ADMIN";
}

export async function createProtocolAction(formData: FormData) {
  const user = await getSessionUser();

  const title = String(formData.get("title") ?? "").trim();
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const dateValue = String(formData.get("date") ?? "").trim();
  const descriptionInput = String(formData.get("description") ?? "").trim();

  if (!title || !organizationId || !dateValue) {
    throw new Error("Bitte Titel, Organisation und Datum angeben.");
  }

  const membership = await getMembership(user.id, organizationId);

  if (!membership || !canEdit(membership.role)) {
    throw new Error("Keine Berechtigung zum Erstellen eines Protokolls.");
  }

  const latest = await prisma.protocol.findFirst({
    where: { organizationId },
    orderBy: { protocolNumber: "desc" },
    select: { protocolNumber: true },
  });

  const protocolNumber = (latest?.protocolNumber ?? 0) + 1;
  const descriptionJson = plainTextToRichText(descriptionInput);

  const protocol = await prisma.protocol.create({
    data: {
      organizationId,
      protocolNumber,
      title,
      date: new Date(dateValue),
      description: descriptionJson,
      descriptionText: descriptionInput || null,
      creatorId: user.id,
    },
    select: {
      id: true,
      title: true,
      organizationId: true,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId,
      userId: user.id,
      action: "CREATED",
      targetType: "protocol",
      targetId: protocol.id,
      metadata: {
        title: protocol.title,
      },
    },
  });

  redirect(`/protocols/${protocol.id}`);
}

export async function updateProtocolAction(formData: FormData) {
  const user = await getSessionUser();

  const protocolId = String(formData.get("protocolId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const dateValue = String(formData.get("date") ?? "").trim();
  const descriptionInput = String(formData.get("description") ?? "").trim();

  if (!protocolId || !title || !dateValue) {
    throw new Error("Ungültige Daten.");
  }

  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
    select: {
      id: true,
      organizationId: true,
      title: true,
    },
  });

  if (!protocol) {
    throw new Error("Protokoll nicht gefunden.");
  }

  const membership = await getMembership(user.id, protocol.organizationId);

  if (!membership || !canEdit(membership.role)) {
    throw new Error("Keine Berechtigung zum Bearbeiten.");
  }

  const descriptionJson = plainTextToRichText(descriptionInput);

  await prisma.protocol.update({
    where: { id: protocolId },
    data: {
      title,
      date: new Date(dateValue),
      description: descriptionJson,
      descriptionText: descriptionInput || null,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId: protocol.organizationId,
      userId: user.id,
      action: "UPDATED",
      targetType: "protocol",
      targetId: protocol.id,
      metadata: {
        title,
      },
    },
  });
}

export async function addProtocolCommentAction(formData: FormData) {
  const user = await getSessionUser();

  const protocolId = String(formData.get("protocolId") ?? "").trim();
  const contentInput = String(formData.get("content") ?? "").trim();

  if (!protocolId || !contentInput) {
    throw new Error("Kommentar darf nicht leer sein.");
  }

  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
    select: {
      id: true,
      title: true,
      organizationId: true,
    },
  });

  if (!protocol) {
    throw new Error("Protokoll nicht gefunden.");
  }

  const membership = await getMembership(user.id, protocol.organizationId);

  if (!membership || !canComment(membership.role)) {
    throw new Error("Keine Berechtigung zum Kommentieren.");
  }

  const contentJson = plainTextToRichText(contentInput);

  await prisma.protocolComment.create({
    data: {
      protocolId: protocol.id,
      userId: user.id,
      content: contentJson,
      contentText: contentInput,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId: protocol.organizationId,
      userId: user.id,
      action: "COMMENTED",
      targetType: "protocol_comment",
      targetId: protocol.id,
      metadata: {
        protocolTitle: protocol.title,
      },
    },
  });
}
