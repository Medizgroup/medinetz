import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import type { OrganizationType } from "@/generated/prisma/client";

const VALID_TYPES: OrganizationType[] = [
  "ROUTINE",
  "PREGNANCY",
  "MANAGEMENT",
  "CUSTOM",
];

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = 30;

  const where: Parameters<typeof prisma.organization.findMany>[0]["where"] = {};
  if (search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        isArchived: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            cases: true,
          },
        },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  return NextResponse.json({ orgs, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Name und Slug sind erforderlich." },
      { status: 400 },
    );
  }

  const type: OrganizationType = VALID_TYPES.includes(body?.type)
    ? body.type
    : "ROUTINE";

  const existing = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Slug bereits vergeben." },
      { status: 409 },
    );
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      type,
    },
    select: { id: true, name: true },
  });

  // Ersteller als Admin hinzufügen
  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: session.user.id,
      role: "ADMIN",
    },
  });

  return NextResponse.json({ id: org.id });
}
