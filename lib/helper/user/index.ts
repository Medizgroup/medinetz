export function getInitials(displayName: string): string {
  if (!displayName) return "";

  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "";

  if (parts.length === 1) {
    // Take first two letters of the single word
    return parts[0].slice(0, 2).toUpperCase();
  } else {
    // Take first letter of first and last part
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
