// import { OrganizationType } from "@/generated/prisma/client";
// import prisma from "@/lib/prisma";

// async function main() {
//   await prisma.organization.upsert({
//     where: { slug: "routine" },
//     update: {},
//     create: {
//       name: "Routine",
//       slug: "routine",
//       type: OrganizationType.ROUTINE,
//       color: "#64748b",
//     },
//   });
// }

// main().finally(async () => prisma.$disconnect());
