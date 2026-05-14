import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { OrganizationType, UserRole } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },

  // 1) BLOCK sign-in wenn user inaktiv (vor dem Login)
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = String(ctx.body?.email || "")
        .trim()
        .toLowerCase();
      if (!email) return;

      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.isActive === false) {
        throw new APIError("FORBIDDEN", {
          message: "Dein Konto wartet auf Freischaltung durch einen Admin.",
        });
      }
    }),
  },

  // 2) Beim User-Erstellen: isActive=false setzen + Default Org membership anlegen
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              isActive: false,
            },
          };
        },

        after: async (user) => {
          // 1) User ist jetzt angelegt, firstName und lastName setzten
          const firstName = user.name?.split(" ")[0] || "";
          const lastName = user.name?.split(" ").slice(1).join(" ") || "";
          const displayName = user.name || "";

          await prisma.user.update({
            where: { id: user.id },
            data: { firstName, lastName, displayName },
          });

          // Default Org finden/erstellen
          const org = await prisma.organization.upsert({
            where: { slug: "routine" },
            update: {},
            create: {
              name: "Routine",
              slug: "routine",
              type: OrganizationType.ROUTINE,
            },
          });

          // Member anlegen (default role: LIMITED)
          await prisma.organizationMember.upsert({
            where: {
              organizationId_userId: {
                organizationId: org.id,
                userId: user.id,
              },
            },
            update: {},
            create: {
              organizationId: org.id,
              userId: user.id,
              role: UserRole.COORDINATOR,
            },
          });

          // Optional: preferences default org setzen
          await prisma.userPreference.upsert({
            where: { userId: user.id },
            update: { defaultOrganizationId: org.id },
            create: { userId: user.id, defaultOrganizationId: org.id },
          });
        },
      },
    },
  },

  plugins: [nextCookies()],
});
