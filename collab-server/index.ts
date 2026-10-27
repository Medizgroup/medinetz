/**
 * Eigenständiger Collab-Server für die lokale Entwicklung
 * (`pnpm collab-server`, Port COLLAB_PORT bzw. 1234). In Produktion läuft
 * derselbe Server im App-Prozess mit (siehe server.ts).
 *
 * Benötigt dieselbe DATABASE_URL und denselben BETTER_AUTH_SECRET wie die
 * App (letzterer, um die Collab-Tickets zu verifizieren).
 */
import { createCollabServer } from "./hocuspocus";

process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error("[unhandledRejection]", err);
});

// PORT zuerst: Hoster wie Render/Railway weisen den Port darüber zu.
const PORT = Number(process.env.PORT || process.env.COLLAB_PORT || 1234);

createCollabServer()
  .listen(PORT)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(`Collab-Server läuft auf Port ${PORT}`);
  });
