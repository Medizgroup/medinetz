// Zentrale Institut-Konfiguration.
//
// Muss mit NEXT_PUBLIC_ Prefix gesetzt werden, damit Next.js den Wert beim
// Build in Client Components einbettet (reines process.env.INSTITUT_NAME
// ist im Browser-Bundle immer undefined). Jedes Medinetz (Gießen, Marburg,
// Berlin, ...) setzt beim Docker-Build nur seine eigenen NEXT_PUBLIC_INSTITUT_*
// Variablen, der Rest der App bleibt unverändert.
export const institutName =
  process.env.NEXT_PUBLIC_INSTITUT_NAME || "Medizgroup";

export const institutSubtitle =
  process.env.NEXT_PUBLIC_INSTITUT_SUBTITLE ||
  "Dein digitaler Mediznetz-Arbeitsplatz";
