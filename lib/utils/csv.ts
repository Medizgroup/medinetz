// CSV-Erzeugung im Browser. Semikolon + BOM, damit Excel (deutsche
// Ländereinstellung) Spalten und Umlaute direkt richtig erkennt.
const SEPARATOR = ";";

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Formel-Injection verhindern (=, +, -, @ am Zellanfang)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(
  rows: T[],
  columns: { header: string; value: (row: T) => unknown }[],
): string {
  const lines = [
    columns.map((c) => escapeCell(c.header)).join(SEPARATOR),
    ...rows.map((r) =>
      columns.map((c) => escapeCell(c.value(r))).join(SEPARATOR),
    ),
  ];
  return "﻿" + lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
