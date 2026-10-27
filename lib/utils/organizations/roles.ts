// Anzeige-Labels der Org-Rollen — zentral, damit Admin-Seiten, Settings und
// Dialoge dieselben Begriffe verwenden.
export const ROLE_LABEL: Record<string, string> = {
  LIMITED: "Eingeschränkt",
  VIEWER: "Betrachter",
  COORDINATOR: "Koordinator",
  ADMIN: "Admin",
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(
  ([value, label]) => ({ value, label }),
);
