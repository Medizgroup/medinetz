import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? normalizeEmail(body.email) : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, message: "Invalid email." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, exists: Boolean(existing) });
}
