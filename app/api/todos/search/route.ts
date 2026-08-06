import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  const todos = await prisma.todo.findMany({
    where: {
      AND: [
        { OR: [{ assigneeId: userId }, { creatorId: userId }, { assigneeId: null }] },
        q ? { title: { contains: q, mode: "insensitive" } } : {},
      ],
    },
    take: 8,
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      done: true,
      priority: true,
    },
  });

  return NextResponse.json(todos);
}
