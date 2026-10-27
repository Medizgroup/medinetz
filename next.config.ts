import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Schlanker Produktions-Build für den VPS: nur die tatsächlich benötigten
  // node_modules landen in .next/standalone (siehe Dockerfile/server.ts).
  // Auf Vercel (Testumgebung) übernimmt Vercel das Packaging selbst.
  output: process.env.VERCEL ? undefined : "standalone",
  // Dynamische Pfade (process.cwd() für Uploads) lassen den Tracer sonst
  // TypeScript und sharp (~40 MB) in den Build kopieren. Quellordner NICHT
  // ausschließen — von dort verfolgt der Tracer @prisma/client und pg.
  outputFileTracingExcludes: {
    "*": [
      "./*.md",
      "./Dockerfile*",
      "./tsconfig.tsbuildinfo",
      "**/node_modules/typescript/**",
      "**/node_modules/.pnpm/typescript@*/**",
      "**/node_modules/sharp/**",
      "**/node_modules/.pnpm/sharp@*/**",
      "**/node_modules/@img/**",
      "**/node_modules/.pnpm/@img+*/**",
    ],
  },
  // pnpm + Tracing lässt bei Prismas Laufzeit-Paketen die package.json weg
  // (→ "Cannot find module"). Nur diese plus die Postgres-Engine nachziehen,
  // nicht die Engines aller Datenbanken (~80 MB).
  outputFileTracingIncludes: {
    "*": [
      "./node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/package.json",
      "./node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/client.*",
      "./node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/runtime/*postgresql*",
      "./node_modules/.pnpm/@prisma+client-runtime-utils@*/node_modules/@prisma/client-runtime-utils/**",
    ],
  },
  poweredByHeader: false,
  images: {
    // Keine serverseitige Bildverarbeitung (sharp) — spart RAM auf kleinen
    // Servern; Avatare sind ohnehin kleine SVG/WebP-Dateien.
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      // Uploads werden über die API-Route ausgeliefert (next start liefert
      // neu hinzugekommene Dateien unter public/ nicht zuverlässig aus, siehe
      // app/api/uploads/[filename]/route.ts). Dieser Rewrite hält bereits
      // gespeicherte /uploads/...-URLs aus älteren Protokollen am Leben.
      {
        source: "/uploads/:filename",
        destination: "/api/uploads/:filename",
      },
    ];
  },
};

export default nextConfig;
