import prisma from "@/lib/prisma";

async function main() {
  console.log("Starting patient backfill...");

  const cases = await prisma.case.findMany({
    where: { patientId: null },
    select: {
      id: true,
      patientPseudonym: true,
      patientLanguage: true,
      patientNotes: true,
    },
  });

  console.log(`Found ${cases.length} cases without patientId`);

  // Existierende Patients sammeln, falls Pseudonyme mehrfach vorkommen
  const pseudonymToPatientId = new Map<string, string>();

  for (const c of cases) {
    let patientId = pseudonymToPatientId.get(c.patientPseudonym);

    if (!patientId) {
      // Schau, ob Patient mit diesem Pseudonym schon existiert
      const existing = await prisma.patient.findUnique({
        where: { pseudonym: c.patientPseudonym },
        select: { id: true },
      });

      if (existing) {
        patientId = existing.id;
      } else {
        const created = await prisma.patient.create({
          data: {
            pseudonym: c.patientPseudonym,
            primaryLanguage: c.patientLanguage,
            notes: c.patientNotes,
          },
          select: { id: true },
        });
        patientId = created.id;
      }

      pseudonymToPatientId.set(c.patientPseudonym, patientId);
    }

    await prisma.case.update({
      where: { id: c.id },
      data: { patientId },
    });
  }

  console.log(
    `✓ Migrated ${cases.length} cases to ${pseudonymToPatientId.size} patients`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
