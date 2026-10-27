# Medinetz — Produktions-Image
#
# Ergebnis: ein schlanker Node-Prozess (Next.js standalone + Live-Collab auf
# /collab, siehe server.ts). Gebaut wird NICHT auf dem VPS (Next braucht dafür
# >2 GB RAM), sondern lokal oder per GitHub Actions; der VPS zieht nur das
# fertige Image. Siehe DEPLOYMENT.md.

FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
WORKDIR /app

# ── Abhängigkeiten ───────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
# postinstall führt `prisma generate` aus — Schema muss schon da sein.
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────────
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY . .
# better-auth verlangt beim Build ein Secret; das echte kommt zur Laufzeit.
RUN BETTER_AUTH_SECRET=build-only-placeholder pnpm build && pnpm build:server

# ── Migrationen (läuft einmal vor dem App-Start, siehe docker-compose.yml) ──
FROM node:24-alpine AS migrate
WORKDIR /migrate
RUN npm install --no-save --no-audit --no-fund prisma@7.8.0 dotenv@17 \
  && npm cache clean --force
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["npx", "prisma", "migrate", "deploy"]

# ── Laufzeit ─────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/data/uploads

RUN addgroup -S medinetz && adduser -S medinetz -G medinetz \
  && mkdir -p /data/uploads && chown medinetz:medinetz /data/uploads

COPY --from=build --chown=medinetz:medinetz /app/.next/standalone ./
COPY --from=build --chown=medinetz:medinetz /app/.next/static ./.next/static
COPY --from=build --chown=medinetz:medinetz /app/public ./public

USER medinetz
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.mjs"]
