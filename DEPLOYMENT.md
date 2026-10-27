# Medinetz auf einem eigenen Server betreiben

Diese Anleitung richtet Medinetz auf einem kleinen VPS ein (ab **1 GB RAM**,
1 vCPU, 10 GB Speicher). Alles läuft in Docker:

| Dienst    | Aufgabe                                                        |
| --------- | -------------------------------------------------------------- |
| `app`     | Die App — **ein** Node-Prozess für Next.js und Live-Kollaboration (`/collab`) |
| `db`      | PostgreSQL 17, für kleine Server vorkonfiguriert               |
| `migrate` | Bringt die Datenbank vor jedem Start auf den neuesten Stand    |
| `caddy`   | HTTPS-Zertifikat (Let's Encrypt) und Weiterleitung zur App     |

Uploads (Bilder/Dateien in Protokollen) liegen im Volume `uploads`, die
Datenbank im Volume `pgdata`.

## 1. Voraussetzungen

- Ein Server mit Docker und dem Compose-Plugin (`docker compose version`).
- Eine (Sub-)Domain, deren DNS-A-Record auf die IP des Servers zeigt.
- Offene Ports 80 und 443.

## 2. Image bereitstellen

Next.js braucht zum **Bauen** mehr als 2 GB RAM, deshalb wird das Image nicht
auf einem kleinen VPS gebaut.

**Variante A — fertiges Image (empfohlen):** Der Workflow
`.github/workflows/docker.yml` baut bei jedem Push auf `main` (und bei Tags
`v*`) die Images `ghcr.io/<owner>/medinetz:latest` und `:migrate`. In der
`.env` auf dem Server dann setzen:

```env
MEDINETZ_IMAGE=ghcr.io/medizgroup/medinetz
```

**Variante B — auf einem stärkeren Rechner bauen und übertragen:**

```bash
docker compose build
docker save medinetz:latest medinetz:migrate | gzip > medinetz.tar.gz
scp medinetz.tar.gz server:
ssh server 'gunzip -c medinetz.tar.gz | docker load'
```

## 3. Einrichten

```bash
git clone https://github.com/Medizgroup/medinetz.git
cd medinetz
cp .env.example .env
```

In `.env` mindestens ausfüllen:

```env
DOMAIN=medinetz.beispielstadt.de
INSTITUT_NAME="Medinetz Beispielstadt"
POSTGRES_PASSWORD=<openssl rand -hex 24>
BETTER_AUTH_SECRET=<openssl rand -hex 32>
```

Starten:

```bash
docker compose up -d          # Variante B / Build: docker compose up -d --no-build
docker compose logs -f app    # bis "Medinetz läuft auf …" erscheint
```

## 4. Erster Login

Die **erste Person, die sich registriert, wird automatisch Instanz-Admin** und
ist sofort freigeschaltet. Alle weiteren Registrierungen sind inaktiv, bis ein
Admin sie freischaltet und unter *Admin → Organisationen → Mitglied
hinzufügen* einer Organisation zuweist.

Danach: unter *Admin → Organisationen* die Organisationen anlegen (z. B.
„Routine“, „Schwangerschaft“).

## 5. Updates

```bash
git pull
docker compose pull           # bei Variante A
docker compose up -d          # migrate läuft automatisch vor dem App-Start
```

## 6. Backups

Datenbank (täglich per Cron empfehlenswert):

```bash
docker compose exec -T db pg_dump -U medinetz medinetz | gzip > backup-$(date +%F).sql.gz
```

Uploads:

```bash
docker run --rm -v medinetz_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Wiederherstellen der Datenbank:

```bash
gunzip -c backup-2026-01-01.sql.gz | docker compose exec -T db psql -U medinetz medinetz
```

## 7. Ressourcen & Fehlersuche

- Speicherbedarf im Betrieb: App ca. 200–300 MB, Postgres ca. 100 MB,
  Caddy ca. 20 MB. Bei 1 GB RAM zusätzlich 1 GB Swap einrichten.
- Heap-Limit der App: `NODE_MAX_MEMORY_MB` (Standard 384).
- Zustand prüfen: `curl https://<domain>/api/health` → `{"ok":true}`.
- Logs: `docker compose logs -f app` bzw. `db`, `caddy`.

## Entwicklung

```bash
pnpm install
cp .env.example .env    # DATABASE_URL, BETTER_AUTH_URL, NEXT_PUBLIC_COLLAB_WS_URL setzen
pnpm prisma migrate deploy
pnpm dev                # App auf :3000
pnpm collab-server      # Live-Kollaboration auf :1234 (zweites Terminal)
```

In Produktion läuft beides in einem Prozess (`server.ts`); lokal bleiben die
Dev-Server getrennt, damit Hot Reload funktioniert.
