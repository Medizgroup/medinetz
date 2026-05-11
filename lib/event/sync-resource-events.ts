import prisma from "@/lib/prisma";

function dayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function syncCaseDoctorEvent(caseDoctorId: string) {
  const cd = await prisma.caseDoctor.findUnique({
    where: { id: caseDoctorId },
    select: {
      id: true,
      appointmentDate: true,
      appointmentNotes: true,
      createdBy: true,
      doctor: { select: { name: true } },
      case: { select: { caseNumber: true, organizationId: true } },
      event: { select: { id: true } },
    },
  });
  if (!cd) return;

  if (!cd.appointmentDate) {
    if (cd.event) await prisma.event.delete({ where: { id: cd.event.id } });
    return;
  }

  const { start, end } = dayBounds(cd.appointmentDate);
  const title = `Termin: ${cd.doctor.name} – Case #${cd.case.caseNumber}`;
  const description = cd.appointmentNotes ?? null;

  if (cd.event) {
    await prisma.event.update({
      where: { id: cd.event.id },
      data: { title, description, startsAt: start, endsAt: end, allDay: true },
    });
  } else {
    await prisma.event.create({
      data: {
        title,
        description,
        startsAt: start,
        endsAt: end,
        allDay: true,
        color: "EMERALD",
        visibility: "ORGANIZATION",
        recurrence: "NONE",
        organizationId: cd.case.organizationId,
        creatorId: cd.createdBy,
        caseDoctorId: cd.id,
      },
    });
  }
}

export async function syncCaseInterpreterEvent(caseInterpreterId: string) {
  const ci = await prisma.caseInterpreter.findUnique({
    where: { id: caseInterpreterId },
    select: {
      id: true,
      appointmentDate: true,
      notes: true,
      createdBy: true,
      interpreter: { select: { name: true } },
      case: { select: { caseNumber: true, organizationId: true } },
      event: { select: { id: true } },
    },
  });
  if (!ci) return;

  if (!ci.appointmentDate) {
    if (ci.event) await prisma.event.delete({ where: { id: ci.event.id } });
    return;
  }

  const { start, end } = dayBounds(ci.appointmentDate);
  const title = `Termin: ${ci.interpreter.name} – Case #${ci.case.caseNumber}`;
  const description = ci.notes ?? null;

  if (ci.event) {
    await prisma.event.update({
      where: { id: ci.event.id },
      data: { title, description, startsAt: start, endsAt: end, allDay: true },
    });
  } else {
    await prisma.event.create({
      data: {
        title,
        description,
        startsAt: start,
        endsAt: end,
        allDay: true,
        color: "VIOLET",
        visibility: "ORGANIZATION",
        recurrence: "NONE",
        organizationId: ci.case.organizationId,
        creatorId: ci.createdBy,
        caseInterpreterId: ci.id,
      },
    });
  }
}
