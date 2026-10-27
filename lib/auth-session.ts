import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Session für Server Components — pro Request nur einmal aus der DB geladen,
 * auch wenn Layout, Header und Seite sie jeweils abfragen.
 */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
