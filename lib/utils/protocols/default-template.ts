import type { Value } from "platejs";

// Framework-agnostic (kein "use client", kein JSX) — wird sowohl vom Editor
// im Browser als auch vom Collab-Server (Node, beim erstmaligen Laden eines
// Protokolls in Yjs) importiert.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const p = (text = "", color?: string): any => ({
  type: "p",
  children: [{ text, ...(color && { color }) }],
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const h2 = (text: string): any => ({ type: "h2", children: [{ text }] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hr = (): any => ({ type: "hr", children: [{ text: "" }] });
// Header-Zellen: fett + grauer Hintergrund (theme-aware über die --muted CSS-Variable,
// damit es im Dark Mode nicht zu hell/falsch aussieht).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const th = (text: string): any => ({
  type: "td",
  background: "var(--muted)",
  children: [{ type: "p", children: [{ text, bold: true }] }],
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const td = (text = ""): any => ({ type: "td", children: [p(text)] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tr = (cells: any[]): any => ({ type: "tr", children: cells });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (rows: any[], colSizes?: number[]): any => ({
  type: "table",
  colSizes,
  children: rows,
});

const caseTable = () =>
  table(
    [
      tr([
        th("Fall"),
        th("Betreuer"),
        th("Termine"),
        th("Status"),
        th("Bemerkung"),
      ]),
      tr([td(), td(), td(), td(), td()]),
      tr([td(), td(), td(), td(), td()]),
    ],
    [100, 200, 200, 150, 400],
  );

// Default-Template: Anwesenheit, Trenner, dann die drei Standard-Sections.
// Termine/Veranstaltungen laufen über die eigene /events-Seite statt über
// eine manuelle Liste hier.
export const defaultTemplate: Value = [
  p(" "),
  p("Anwesend: ", "#f59e0b"),
  p(" "),
  hr(),
  p(" "),
  h2("Aktuelle Fälle"),
  caseTable(),
  p(" "),
  p(" "),
  h2("Neue Anfragen"),
  caseTable(),
  p(" "),
  p(" "),
  h2("Orga"),
  table(
    [
      tr([th("Aufgaben"), th("Notizen")]),
      tr([td("☎️ Handy"), td()]),
      tr([td("📪 Mails"), td()]),
      tr([td("💰 Finanzen / Rechnungen"), td()]),
      tr([td("🏛️ Politische Arbeit / ABSH"), td()]),
    ],
    [300, 600],
  ),
  p(" "),
] as Value;
