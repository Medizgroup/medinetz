import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { format } from "date-fns";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.donation.findMany({
    orderBy: { donationDate: "desc" },
    select: {
      id: true,
      donorName: true,
      amount: true,
      donationDate: true,
      isAnonymous: true,
      receiptSent: true,
      notes: true,
      organization: { select: { name: true } },
    },
  });

  const lines = ["Datum,Spender,Betrag,Anonym,Quittung,Organisation,Notizen"];

  for (const i of items) {
    lines.push(
      [
        format(i.donationDate, "dd.MM.yyyy"),
        i.isAnonymous ? "Anonym" : (i.donorName ?? ""),
        Number(i.amount).toFixed(2).replace(".", ","),
        i.isAnonymous ? "ja" : "nein",
        i.receiptSent ? "ja" : "nein",
        i.organization?.name ?? "Allgemein",
        i.notes ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spenden-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
