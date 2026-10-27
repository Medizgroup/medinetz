import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import InactiveComponent from "./inactive-component";

// Öffentlich erreichbar: inaktive Konten bekommen keine Session mehr (siehe
// lib/auth.ts), die Seite wird direkt nach der Registrierung und bei einem
// abgelehnten Login angezeigt.
export default async function InactivePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/home");

  return <InactiveComponent />;
}
