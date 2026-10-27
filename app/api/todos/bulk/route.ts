import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canDeleteAllTodos,
  todoVisibility,
} from "@/lib/utils/todos/permissions";

// Mehrfach-Löschen auf der Todo-Seite: eigene Todos immer, alle sichtbaren
// nur für Koordinator:innen/Admins (siehe canDeleteAllTodos).
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids)
    ? body.ids.map(String).slice(0, 500)
    : [];
  if (body?.action !== "delete" || ids.length === 0) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const canDeleteAll = await canDeleteAllTodos(userId);
  const { count } = await prisma.todo.deleteMany({
    where: {
      id: { in: ids },
      AND: [todoVisibility(userId), canDeleteAll ? {} : { creatorId: userId }],
    },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }
  return NextResponse.json({ deleted: count, skipped: ids.length - count });
}
