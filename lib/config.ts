// Zentrale Institut-Konfiguration — zur LAUFZEIT aus der Umgebung gelesen,
// damit jedes Medinetz (Gießen, Marburg, Berlin, ...) dasselbe Docker-Image
// nutzen kann und nur INSTITUT_NAME / INSTITUT_SUBTITLE setzt.
// Client Components bekommen die Werte über <InstitutProvider> (app/layout).
export type InstitutConfig = { name: string; subtitle: string };

export function getInstitutConfig(): InstitutConfig {
  return {
    name:
      process.env.INSTITUT_NAME ||
      process.env.NEXT_PUBLIC_INSTITUT_NAME ||
      "Medinetz",
    subtitle:
      process.env.INSTITUT_SUBTITLE ||
      process.env.NEXT_PUBLIC_INSTITUT_SUBTITLE ||
      "Dein digitaler Medinetz-Arbeitsplatz",
  };
}
