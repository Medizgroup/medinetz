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

  const items = await prisma.expense.findMany({
    orderBy: { expenseDate: "desc" },
    select: {
      id: true,
      description: true,
      amount: true,
      expenseDate: true,
      vendor: true,
      category: true,
      isPaid: true,
      notes: true,
      organization: { select: { name: true } },
    },
  });

  const lines = [
    "Datum,Beschreibung,Betrag,Anbieter,Kategorie,Bezahlt,Organisation,Notizen",
  ];

  for (const i of items) {
    lines.push(
      [
        format(i.expenseDate, "dd.MM.yyyy"),
        i.description,
        Number(i.amount).toFixed(2).replace(".", ","),
        i.vendor ?? "",
        i.category ?? "",
        i.isPaid ? "ja" : "nein",
        i.organization?.name ?? "",
        i.notes ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ausgaben-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
