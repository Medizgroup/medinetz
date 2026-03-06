import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function extractPlainText(nodes: unknown): string {
  if (!Array.isArray(nodes)) return "";

  const walk = (node: any): string => {
    if (!node) return "";
    if (typeof node.text === "string") return node.text;
    if (!Array.isArray(node.children)) return "";
    return node.children.map(walk).join("");
  };

  return nodes.map(walk).join("\n").trim();
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const title = String(body?.title ?? "").trim();
  const organizationId = String(body?.organizationId ?? "").trim();
  const date = String(body?.date ?? "").trim();
  const description = body?.description;

  if (!title || !organizationId || !date) {
    return NextResponse.json(
      { error: "Titel, Organisation und Datum sind erforderlich." },
      { status: 400 },
    );
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.user.id,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership || !["COORDINATOR", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const latest = await prisma.protocol.findFirst({
    where: { organizationId },
    orderBy: { protocolNumber: "desc" },
    select: { protocolNumber: true },
  });

  const protocol = await prisma.protocol.create({
    data: {
      title,
      organizationId,
      date: new Date(date),
      protocolNumber: (latest?.protocolNumber ?? 0) + 1,
      creatorId: session.user.id,
      description,
      descriptionText: extractPlainText(description) || null,
    },
    select: {
      id: true,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId,
      userId: session.user.id,
      action: "CREATED",
      targetType: "protocol",
      targetId: protocol.id,
      metadata: {
        title,
      },
    },
  });

  return NextResponse.json({ protocol });
}
