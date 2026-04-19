export function getMentionQuery(text: string, cursor: number) {
  const sub = text.slice(0, cursor);
  const match = sub.match(/@([A-Za-z0-9_-]*)$/);
  return match ? match[1] : null;
}
