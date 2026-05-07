import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pseudonym = searchParams.get("pseudonym")?.trim();

  if (!pseudonym) {
    return NextResponse.json({ exists: false, patient: null });
  }

  const patient = await prisma.patient.findUnique({
    where: { pseudonym },
    select: {
      id: true,
      pseudonym: true,
      primaryLanguage: true,
      deletedAt: true,
    },
  });

  if (!patient || patient.deletedAt) {
    return NextResponse.json({ exists: false, patient: null });
  }

  return NextResponse.json({
    exists: true,
    patient: {
      id: patient.id,
      pseudonym: patient.pseudonym,
      primaryLanguage: patient.primaryLanguage,
    },
  });
}
