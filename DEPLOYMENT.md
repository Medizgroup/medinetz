# Deployment: von Vercel zu Docker

Dieses Dokument erklärt, warum die bisherige Vercel-Testumgebung mit der
Live-Kollaboration an ihre Grenzen kommt, und wie das Setup aussehen soll,
sobald die App per Docker selbst gehostet wird (der geplante Zielzustand für
jede Medinetz-Instanz).

## Warum Vercel jetzt nicht mehr reicht

Bisher lief die App als einzelne Next.js-Anwendung auf Vercel — dafür ist
Vercel gut geeignet (Serverless-Functions, kurze Requests, kein eigener
Server nötig).

Mit Phase C sind zwei neue Anforderungen dazugekommen, die mit Vercels
Serverless-Modell nicht zusammenpassen:

1. **Der Collab-Server (`collab-server/index.ts`) ist ein dauerhaft
   laufender Prozess.** Er hält den Zustand aller offenen
   WebSocket-Verbindungen, die Editor-Warteschlange (max. 3 gleichzeitige
   Bearbeiter:innen pro Protokoll) und die Yjs-Dokumente im Arbeitsspeicher.
   Vercel-Functions werden dagegen pro Request neu gestartet (oder nach
   kurzer Inaktivität eingefroren) — ein Hocuspocus-Server mit
   In-Memory-State kann dort nicht sinnvoll laufen.
2. **Datei-Uploads landen lokal auf der Festplatte** (`public/uploads`,
   siehe `app/api/uploads`). Vercels Dateisystem ist zur Laufzeit nur
   read-only (außer `/tmp`, das nicht persistent ist) — hochgeladene Bilder
   und Dateien würden nach dem nächsten Kaltstart der Function wieder
   verschwinden.

Zusätzlich hat sich beim Testen gezeigt (siehe unten), dass **Next.js im
Produktions-Modus (`next start`) neu hinzugekommene Dateien unter
`public/` nicht zuverlässig ausliefert**, wenn sie erst nach dem Build
entstehen — das betrifft Uploads unabhängig davon, ob Vercel oder ein
eigener Server läuft. Deshalb läuft die Auslieferung jetzt über eine eigene
Route (`app/api/uploads/[filename]/route.ts`), die bei jedem Request live
vom Dateisystem liest, statt sich auf Next.js' statisches `public/`-Serving
zu verlassen.

**Kurz gesagt:** Sobald jemand aus dem Medinetz die App testen soll,
funktionieren Live-Kollaboration und dauerhafte Uploads auf der aktuellen
Vercel-Instanz nicht. Für einen Zwischentest vor der Docker-Migration gibt
es zwei Optionen:

- Die App unverändert auf Vercel lassen, aber der testenden Person sagen,
  dass Live-Kollaboration (gleichzeitiges Bearbeiten) und Uploads in dieser
  Übergangsphase nicht funktionieren — nur zum Testen der übrigen
  Funktionen.
- Den Collab-Server separat auf einem Dienst hosten, der dauerhafte
  Prozesse erlaubt (z. B. Fly.io, Railway, ein kleiner VPS), während die
  Next.js-App weiter auf Vercel bleibt. Das ist möglich (der Collab-Server
  ist bereits ein eigenständiger Prozess, siehe `npm run collab-server`),
  aber zusätzlicher Aufwand für eine Zwischenlösung, die mit dem
  Docker-Umzug ohnehin hinfällig wird.

Empfehlung: Falls keine Live-Kollaboration/Uploads getestet werden müssen,
einfach bei Vercel bleiben und ehrlich sagen, was (noch) nicht geht. Falls
doch, lohnt sich der Aufwand nicht — dann direkt auf Docker umziehen.

## Zielarchitektur mit Docker

Drei Bausteine laufen als eigene Container:

```
                         ┌─────────────────────────┐
                         │  Reverse Proxy (TLS)     │
                         │  z.B. Caddy / Traefik    │
                         └───────────┬─────────────┘
                    ┌────────────────┼─────────────────┐
                    │ https://domain.tld                │
                    │                │ wss://domain.tld/collab
                    ▼                                    ▼
         ┌────────────────────┐              ┌────────────────────┐
         │  Next.js App        │              │  Collab-Server      │
         │  (next start)       │              │  (Hocuspocus/Yjs)   │
         │  Port 3000           │              │  Port 1234           │
         └──────────┬──────────┘              └──────────┬──────────┘
                    │                                    │
                    │         ┌──────────────┐           │
                    └────────▶│  PostgreSQL   │◀──────────┘
                              └──────────────┘
                    │
                    ▼
         ┌────────────────────┐
         │  Volume: uploads     │  (persistiert public/uploads
         │                      │   zwischen Deployments/Neustarts)
         └────────────────────┘
```

### Die drei Services in `docker-compose.yml`

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://medinetz:${DB_PASSWORD}@postgres:5432/medinetz
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=https://protokoll.medinetz-beispiel.de
      - NEXT_PUBLIC_COLLAB_WS_URL=wss://protokoll.medinetz-beispiel.de/collab
    volumes:
      - uploads:/app/public/uploads
    depends_on:
      - postgres
    restart: unless-stopped

  collab-server:
    build:
      context: .
      dockerfile: Dockerfile.collab
    ports:
      - "1234:1234"
    environment:
      - DATABASE_URL=postgresql://medinetz:${DB_PASSWORD}@postgres:5432/medinetz
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - COLLAB_PORT=1234
    volumes:
      - uploads:/app/public/uploads
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=medinetz
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=medinetz
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  uploads:
  postgres-data:
```

Wichtige Punkte dabei:

- **`app` und `collab-server` teilen sich `BETTER_AUTH_SECRET`** — der
  Collab-Server verifiziert damit die kurzlebigen Tickets, die die App
  ausstellt (siehe `lib/collab/token.ts`). Ohne identisches Secret schlägt
  jede Collab-Verbindung mit „Nicht autorisiert“ fehl.
- **`app` und `collab-server` teilen sich denselben `uploads`-Volume.**
  Beide Prozesse müssen auf dieselben hochgeladenen Dateien zugreifen
  können — die App zum Ausliefern (`/api/uploads/[filename]`), der
  Collab-Server beim Aufräumen gelöschter Bilder/Dateien
  (`cleanupRemovedUploads` in `onStoreDocument`).
- **`postgres-data` als eigenes Volume** — sonst sind bei jedem
  `docker compose down` alle Daten weg.
- **`DATABASE_URL` zeigt auf den Service-Namen `postgres`**, nicht auf
  `localhost` — Docker-Compose löst Service-Namen intern per DNS auf.

### Der Reverse Proxy: HTTP und WebSocket auf derselben Domain

Nach außen soll alles über eine Domain laufen (kein extra Port für den
Collab-Server nötig). Der Reverse Proxy leitet normale Requests an `app`
und alles unter `/collab` (oder eine Subdomain, z. B.
`collab.protokoll.medinetz-beispiel.de`) an `collab-server` weiter, inkl.
WebSocket-Upgrade.

Beispiel mit **Caddy** (`Caddyfile`, sehr kurz weil Caddy TLS automatisch
per Let's Encrypt holt):

```
protokoll.medinetz-beispiel.de {
	handle /collab* {
		reverse_proxy collab-server:1234
	}
	handle {
		reverse_proxy app:3000
	}
}
```

Falls stattdessen eine eigene Subdomain für den Collab-Server bevorzugt
wird (einfacher, kein Pfad-Rewriting nötig):

```
protokoll.medinetz-beispiel.de {
	reverse_proxy app:3000
}

collab.protokoll.medinetz-beispiel.de {
	reverse_proxy collab-server:1234
}
```

In dem Fall wäre `NEXT_PUBLIC_COLLAB_WS_URL=wss://collab.protokoll.medinetz-beispiel.de`.

### Wichtige Stolperfalle: `NEXT_PUBLIC_*` wird beim Build eingebacken

`NEXT_PUBLIC_COLLAB_WS_URL` wird von Next.js **zur Build-Zeit** in den
Client-Code eingebettet, nicht zur Laufzeit gelesen. Das heißt:

- Der Wert muss schon **beim `docker build`** korrekt gesetzt sein (als
  Build-Argument), nicht erst beim `docker run`/`docker compose up`.
- Ändert sich die Domain später, muss das Image neu gebaut werden — ein
  reiner Container-Neustart mit neuer Umgebungsvariable reicht nicht.

Im `Dockerfile` also z. B.:

```dockerfile
ARG NEXT_PUBLIC_COLLAB_WS_URL
ENV NEXT_PUBLIC_COLLAB_WS_URL=$NEXT_PUBLIC_COLLAB_WS_URL
RUN npm run build
```

und beim Bauen:

```bash
docker build --build-arg NEXT_PUBLIC_COLLAB_WS_URL=wss://protokoll.medinetz-beispiel.de/collab -t medinetz-app .
```

(Alle anderen Variablen wie `DATABASE_URL` oder `BETTER_AUTH_SECRET`
werden zur Laufzeit gelesen und können in `docker-compose.yml`/`.env`
gesetzt werden, ohne neu zu bauen.)

### Datenbank-Migrationen

Beim Deployment sollte `prisma migrate deploy` (nicht `migrate dev`) als
Teil des Container-Starts laufen, bevor die App den Traffic annimmt — z. B.
als Startup-Command oder ein separater `migrate`-Init-Container, der vor
`app`/`collab-server` durchläuft.

### Checkliste für den Docker-Umzug

- [ ] `Dockerfile` für die Next.js-App (Multi-Stage-Build, `next build` +
      `next start`), mit `NEXT_PUBLIC_COLLAB_WS_URL` als Build-Arg.
- [ ] `Dockerfile.collab` für den Collab-Server (`tsx collab-server/index.ts`
      oder vorab zu JS kompiliert).
- [ ] `docker-compose.yml` mit den drei Services oben.
- [ ] Reverse Proxy mit TLS + WebSocket-Weiterleitung an `collab-server`.
- [ ] Persistentes Volume für `public/uploads`, gemountet in **beiden**
      Containern (`app` und `collab-server`).
- [ ] Persistentes Volume für Postgres-Daten.
- [ ] `.env`/Secrets: `DATABASE_URL`, `BETTER_AUTH_SECRET` (identisch in
      `app` und `collab-server`), `BETTER_AUTH_URL`,
      `NEXT_PUBLIC_COLLAB_WS_URL` (als Build-Arg).
- [ ] `prisma migrate deploy` läuft vor dem ersten Request.
- [ ] Backup-Strategie für das Postgres-Volume und den Uploads-Ordner
      (beides muss gesichert werden, nicht nur die Datenbank).
