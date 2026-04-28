export function notificationHref(
  targetType: string | null,
  targetId: string | null,
): string | null {
  if (!targetType || !targetId) return null;
  switch (targetType) {
    case "case":
      return `/cases/${targetId}`;
    case "case_comment":
      // Comment-IDs ohne Cases nicht verlinkbar (wir haben keinen Direktlink) → null
      return null;
    case "protocol":
      return `/protocols/${targetId}`;
    case "protocol_comment":
      // gleich wie oben — wenn du den Parent kennst, kannst du `?comment=…` ergänzen
      return null;
    case "event":
      return `/events`;
    default:
      return null;
  }
}
