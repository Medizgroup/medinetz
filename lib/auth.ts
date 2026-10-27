import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import prisma from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    // Neue Konten sind inaktiv, bis ein Admin sie freischaltet — ein
    // automatischer Login nach der Registrierung würde sonst eine Session
    // für ein nicht freigeschaltetes Konto erzeugen.
    autoSignIn: false,
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

  databaseHooks: {
    user: {
      create: {
        // Neue Konten sind inaktiv (DB-Default is_active=false) und in keiner
        // Organisation — ein Admin schaltet sie frei und fügt sie direkt
        // einer Organisation hinzu. Ausnahme: der allererste User einer
        // frischen Instanz wird aktiver Instanz-Admin, sonst käme beim
        // Self-Hosting niemand hinein.
        after: async (user) => {
          const firstName = user.name?.split(" ")[0] || "";
          const lastName = user.name?.split(" ").slice(1).join(" ") || "";
          const displayName = user.name || "";
          const isFirstUser = (await prisma.user.count()) === 1;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              firstName,
              lastName,
              displayName,
              ...(isFirstUser ? { isActive: true, isInstanceAdmin: true } : {}),
            },
          });
        },
      },
    },
    session: {
      create: {
        // Zweite Absicherung zum Sign-in-Hook: inaktive Konten (nicht
        // freigeschaltet oder vom Admin deaktiviert) bekommen nie eine
        // Session und damit auch keinen Zugriff auf API-Routen.
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          if (!user?.isActive) return false;
        },
      },
    },
  },

  plugins: [nextCookies()],
});
