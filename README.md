# Medinetz

Digitaler Arbeitsplatz für Medinetze — ehrenamtliche Netzwerke, die Menschen
ohne Krankenversicherung oder Papiere medizinische Versorgung vermitteln.
Jedes Medinetz betreibt seine eigene Instanz auf einem eigenen Server.

## Funktionen

- **Fälle** mit pseudonymisierten Patient:innen, Ärzt:innen-/Dolmetscher-
  Terminen, Kosten, Kommentaren und CSV-Export
- **Protokolle** mit Live-Zusammenarbeit (bis zu 3 gleichzeitig), Verknüpfung
  von Fällen (`#`), Personen (`@`), Todos (`!`) und Terminen (`$`)
- **Todos**, **Kalender**, **Aktivitäten** und **Benachrichtigungen**
- **Ressourcen**-Karte für Ärzt:innen und Dolmetscher:innen
- **Organisationen** mit Rollen (Admin, Koordinator, Betrachter, Eingeschränkt)
- **Admin-Bereich**: Benutzer freischalten/löschen, Organisationen, Finanzen,
  Statistiken

## Datenschutz

- Patient:innen werden nur über eine Referenz (z. B. `MU-AH-X-85`) geführt,
  ohne Klarnamen.
- Neue Konten haben keinen Zugriff, bis ein Admin sie freischaltet und einer
  Organisation hinzufügt; Daten sind pro Organisation getrennt.
- Gelöschte Benutzer werden anonymisiert, ihre Fälle bleiben erhalten.
- Keine externen Dienste nötig — Daten bleiben auf dem eigenen Server.

## Betrieb

Docker Compose mit App, PostgreSQL und Caddy (HTTPS), lauffähig ab 1 GB RAM:
siehe **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Entwicklung

Voraussetzungen: Node.js 22+, pnpm 11, PostgreSQL.

```bash
pnpm install
cp .env.example .env      # Abschnitt „Nur für die lokale Entwicklung“ ausfüllen
pnpm prisma migrate deploy
pnpm dev                  # http://localhost:3000
pnpm collab-server        # Live-Kollaboration (zweites Terminal)
```

Technik: Next.js (App Router), React, Prisma + PostgreSQL, better-auth,
Plate.js + Yjs/Hocuspocus, Tailwind CSS, Bklit UI (Charts).

## Lizenz

[MIT](LICENSE)
