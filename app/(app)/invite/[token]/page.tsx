// app/invite/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  LIMITED: "Eingeschränkt",
  VIEWER: "Betrachter",
  COORDINATOR: "Koordinator",
  ADMIN: "Admin",
};

type InviteData = {
  invite: {
    email: string;
    role: string;
    expiresAt: string;
    organization: { id: string; name: string; slug: string };
    inviter: { displayName?: string; firstName?: string; email: string };
  };
  loggedInEmail: string | null;
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) setError(json.error ?? "Fehler.");
        else setData(json);
      })
      .catch(() => setError("Netzwerkfehler."))
      .finally(() => setLoading(false));
  }, [token]);

  function handleLoginRedirect() {
    router.push(`/login?redirect=/invite/${token}`);
  }

  async function handleAccept() {
    setAccepting(true);
    const res = await fetch(`/api/invite/${token}/accept`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Fehler beim Annehmen.");
      setAccepting(false);
      return;
    }
    router.push(`/dashboard`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Lade Einladung...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Einladung ungültig</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/")}>
              Zur Startseite
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { invite, loggedInEmail } = data;
  const inviterName =
    invite.inviter.displayName ??
    invite.inviter.firstName ??
    invite.inviter.email;
  const isLoggedIn = !!loggedInEmail;
  const emailMismatch = isLoggedIn && loggedInEmail !== invite.email;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Einladung zu {invite.organization.name}</CardTitle>
          <CardDescription>
            {inviterName} hat dich eingeladen, als{" "}
            <Badge variant="secondary">
              {ROLE_LABELS[invite.role] ?? invite.role}
            </Badge>{" "}
            beizutreten.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Eingeladen: {invite.email}</p>
          {isLoggedIn && (
            <p>
              Angemeldet als:{" "}
              <span className="font-medium text-foreground">
                {loggedInEmail}
              </span>
            </p>
          )}
          {emailMismatch && (
            <p className="text-amber-600">
              Hinweis: Du bist mit einer anderen E-Mail angemeldet. Die
              Einladung gilt trotzdem.
            </p>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {!isLoggedIn ? (
            <Button className="w-full" onClick={handleLoginRedirect}>
              Anmelden und annehmen
            </Button>
          ) : (
            <>
              <Button
                className="flex-1"
                onClick={handleAccept}
                disabled={accepting}>
                {accepting ? "Wird angenommen..." : "Annehmen"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}>
                Ablehnen
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
