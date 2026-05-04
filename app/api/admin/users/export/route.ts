import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      name: true,
      isActive: true,
      isInstanceAdmin: true,
      createdAt: true,
      organizationMembers: {
        select: {
          role: true,
          organization: { select: { name: true } },
        },
      },
    },
  });

  const lines: string[] = ["ID,Email,Name,Aktiv,Admin,Erstellt,Organisationen"];

  for (const u of users) {
    const orgs = u.organizationMembers
      .map((m) => `${m.organization.name}(${m.role})`)
      .join("|");
    lines.push(
      [
        u.id,
        u.email,
        u.displayName ?? u.name ?? "",
        u.isActive ? "ja" : "nein",
        u.isInstanceAdmin ? "ja" : "nein",
        u.createdAt.toISOString().slice(0, 10),
        orgs,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
