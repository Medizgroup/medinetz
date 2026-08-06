/**
 * Deterministische, gut unterscheidbare Farbe pro Nutzer-ID — für
 * Yjs-Awareness-Cursor: derselbe Nutzer bekommt über Sitzungen hinweg immer
 * dieselbe Farbe, ohne dass wir sie irgendwo speichern müssen.
 */
export function userColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}
