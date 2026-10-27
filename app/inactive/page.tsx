import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import InactiveComponent from "./inactive-component";
import { getSession } from "@/lib/auth-session";

// Öffentlich erreichbar: inaktive Konten bekommen keine Session mehr (siehe
// lib/auth.ts), die Seite wird direkt nach der Registrierung und bei einem
// abgelehnten Login angezeigt.
export default async function InactivePage() {
  const session = await getSession();
  if (session?.user) redirect("/home");

  return <InactiveComponent />;
}
