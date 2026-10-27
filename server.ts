/**
 * Produktions-Server: Next.js (standalone) und die Live-Kollaboration laufen
 * in EINEM Node-Prozess auf einem Port — spart RAM auf kleinen VPS und braucht
 * keine zweite Proxy-Route. WebSocket-Upgrades auf /collab gehen an
 * Hocuspocus, alles andere an Next.
 *
 * Wird beim Docker-Build mit esbuild nach .next/standalone/server.js gebündelt
 * (siehe Dockerfile). Für die Entwicklung weiterhin `pnpm dev` +
 * `pnpm collab-server`.
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createCollabServer } from "./collab-server/hocuspocus";

const dir = process.cwd();
const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const COLLAB_PATH = "/collab";

async function main() {
  // Wie im von Next erzeugten standalone/server.js — sonst lädt React die
  // Development-Builds, die im standalone-Output fehlen.
  (process.env as Record<string, string>).NODE_ENV = "production";

  // Wie das von Next erzeugte standalone/server.js: Konfiguration aus dem
  // Build übernehmen, damit zur Laufzeit kein next.config.ts nötig ist.
  const { config } = JSON.parse(
    readFileSync(path.join(dir, ".next", "required-server-files.json"), "utf8"),
  );
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(config);

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const next = require("next") as typeof import("next").default;
  const app = next({ dev: false, dir, hostname, port, conf: config });
  await app.prepare();
  const handle = app.getRequestHandler();
  const handleNextUpgrade = app.getUpgradeHandler();

  const collab = createCollabServer();

  const server = createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error(err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  });

  server.on("upgrade", (req, socket, head) => {
    if (req.url?.startsWith(COLLAB_PATH)) {
      collab.httpServer.emit("upgrade", req, socket, head);
    } else {
      handleNextUpgrade(req, socket, head);
    }
  });

  server.listen(port, hostname, () => {
    console.log(`Medinetz läuft auf http://${hostname}:${port}`);
  });

  // Offene Protokolle sauber speichern, bevor der Container stoppt.
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close();
    await collab.destroy().catch(() => {});
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
