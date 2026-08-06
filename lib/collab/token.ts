import { createHmac, timingSafeEqual } from "node:crypto";

// Kurzlebiges, signiertes Ticket, das den Collab-Server (ein separater
// Prozess/Container) autorisiert, OHNE ihm das rohe better-auth-Session-Cookie
// zu geben. Beide Seiten teilen sich BETTER_AUTH_SECRET (schon vorhanden).
// Wird serverseitig (in der Protokoll-Seite) ausgestellt und clientseitig nur
// durchgereicht.

const TTL_MS = 2 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET ist nicht gesetzt.");
  }
  return secret;
}

export function createCollabToken(userId: string, protocolId: string): string {
  const payload = JSON.stringify({
    userId,
    protocolId,
    exp: Date.now() + TTL_MS,
  });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyCollabToken(
  token: string,
): { userId: string; protocolId: string } | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expectedSig = createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.userId !== "string" || typeof payload.protocolId !== "string") {
      return null;
    }
    return { userId: payload.userId, protocolId: payload.protocolId };
  } catch {
    return null;
  }
}
