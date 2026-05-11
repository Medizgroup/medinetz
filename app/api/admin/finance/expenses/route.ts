import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = 30;
  const orgParam = searchParams.get("org") ?? "all";
  const search = (searchParams.get("search") ?? "").trim();
  const orgFilter = orgParam !== "all" ? orgParam : null;

  const [expenses, caseCosts, caseDoctors, caseInterpreters] =
    await Promise.all([
      prisma.expense.findMany({
        where: {
          ...(orgFilter ? { organizationId: orgFilter } : {}),
          ...(search
            ? {
                OR: [
                  { description: { contains: search, mode: "insensitive" } },
                  { vendor: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          description: true,
          amount: true,
          expenseDate: true,
          vendor: true,
          category: true,
          isPaid: true,
          notes: true,
          organizationId: true,
          organization: { select: { name: true } },
          caseId: true,
          case: { select: { caseNumber: true } },
        },
      }),
      prisma.caseCost.findMany({
        where: {
          ...(orgFilter ? { case: { organizationId: orgFilter } } : {}),
          ...(search
            ? { description: { contains: search, mode: "insensitive" } }
            : {}),
        },
        select: {
          id: true,
          description: true,
          amount: true,
          invoiceDate: true,
          invoicePaid: true,
          notes: true,
          category: true,
          createdAt: true,
          caseId: true,
          case: {
            select: {
              caseNumber: true,
              organizationId: true,
              organization: { select: { name: true } },
            },
          },
        },
      }),
      prisma.caseDoctor.findMany({
        where: {
          invoiceReceived: true,
          invoiceAmount: { not: null },
          ...(orgFilter ? { case: { organizationId: orgFilter } } : {}),
          ...(search
            ? {
                OR: [
                  {
                    doctor: { name: { contains: search, mode: "insensitive" } },
                  },
                  { diagnosis: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          invoiceAmount: true,
          invoiceDate: true,
          invoicePaid: true,
          appointmentDate: true,
          createdAt: true,
          notes: true,
          diagnosis: true,
          caseId: true,
          doctor: { select: { name: true } },
          case: {
            select: {
              caseNumber: true,
              organizationId: true,
              organization: { select: { name: true } },
            },
          },
        },
      }),
      prisma.caseInterpreter.findMany({
        where: {
          invoiceReceived: true,
          cost: { not: null },
          ...(orgFilter ? { case: { organizationId: orgFilter } } : {}),
          ...(search
            ? {
                interpreter: {
                  name: { contains: search, mode: "insensitive" },
                },
              }
            : {}),
        },
        select: {
          id: true,
          cost: true,
          invoicePaid: true,
          appointmentDate: true,
          hoursWorked: true,
          createdAt: true,
          notes: true,
          caseId: true,
          interpreter: { select: { name: true } },
          case: {
            select: {
              caseNumber: true,
              organizationId: true,
              organization: { select: { name: true } },
            },
          },
        },
      }),
    ]);

  const rows = [
    ...expenses.map((e) => ({
      id: `expense:${e.id}`,
      source: "expense" as const,
      description: e.description ?? "",
      amount: Number(e.amount),
      expenseDate: e.expenseDate.toISOString(),
      vendor: e.vendor,
      category: e.category,
      isPaid: e.isPaid,
      notes: e.notes,
      organizationId: e.organizationId,
      organization: e.organization,
      caseId: e.caseId,
      caseNumber: e.case?.caseNumber ?? null,
      editable: true,
    })),
    ...caseCosts.map((c) => ({
      id: `case_cost:${c.id}`,
      source: "case_cost" as const,
      description: c.description,
      amount: Number(c.amount),
      expenseDate: (c.invoiceDate ?? c.createdAt).toISOString(),
      vendor: null,
      category: c.category,
      isPaid: c.invoicePaid,
      notes: c.notes,
      organizationId: c.case.organizationId,
      organization: c.case.organization,
      caseId: c.caseId,
      caseNumber: c.case.caseNumber,
      editable: false,
    })),
    ...caseDoctors.map((cd) => ({
      id: `case_doctor:${cd.id}`,
      source: "case_doctor" as const,
      description: cd.diagnosis ?? `Arztrechnung – Case #${cd.case.caseNumber}`,
      amount: Number(cd.invoiceAmount ?? 0),
      expenseDate: (
        cd.invoiceDate ??
        cd.appointmentDate ??
        cd.createdAt
      ).toISOString(),
      vendor: cd.doctor.name,
      category: "DOCTOR" as const,
      isPaid: cd.invoicePaid,
      notes: cd.notes,
      organizationId: cd.case.organizationId,
      organization: cd.case.organization,
      caseId: cd.caseId,
      caseNumber: cd.case.caseNumber,
      editable: false,
    })),
    ...caseInterpreters.map((ci) => {
      const hours = ci.hoursWorked ? ` · ${ci.hoursWorked}h` : "";
      return {
        id: `case_interpreter:${ci.id}`,
        source: "case_interpreter" as const,
        description: `Dolmetschen – Case #${ci.case.caseNumber}${hours}`,
        amount: Number(ci.cost ?? 0),
        expenseDate: (ci.appointmentDate ?? ci.createdAt).toISOString(),
        vendor: ci.interpreter.name,
        category: "INTERPRETER" as const,
        isPaid: ci.invoicePaid,
        notes: ci.notes,
        organizationId: ci.case.organizationId,
        organization: ci.case.organization,
        caseId: ci.caseId,
        caseNumber: ci.case.caseNumber,
        editable: false,
      };
    }),
  ];

  rows.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));

  const total = rows.length;
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const items = rows.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ items, total, page, pageSize, totalAmount });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (
    !body?.amount ||
    !body?.description ||
    !body?.expenseDate ||
    !body?.organizationId
  ) {
    return NextResponse.json(
      {
        error: "amount, description, expenseDate, organizationId erforderlich.",
      },
      { status: 400 },
    );
  }

  const e = await prisma.expense.create({
    data: {
      amount: Number(body.amount),
      description: String(body.description).trim(),
      expenseDate: new Date(body.expenseDate),
      vendor: body.vendor ? String(body.vendor).trim() : null,
      category: String(
        body.category,
      ).trim() as Prisma.ExpenseCreateInput["category"],
      isPaid: Boolean(body.isPaid),
      notes: body.notes ? String(body.notes).trim() : null,
      organizationId: String(body.organizationId),
    },
    select: { id: true },
  });

  return NextResponse.json({ id: e.id });
}
