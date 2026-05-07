// app/invite/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Send } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/loading-component";
import { NotProduct } from "@/components/not-product";
import { Spinner } from "@/components/ui/spinner";

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

  async function handleAccept() {
    setAccepting(true);
    const res = await fetch(`/api/invite/${token}/accept`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Fehler beim Annehmen.");
      setAccepting(false);
      return;
    }
    router.push(`/home`);
  }

  if (loading) {
    return <Loading />;
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

  if (emailMismatch) {
    return NotProduct();
  }

  return (
    <div className="flex  items-center justify-center p-4">
      <Alert>
        <Send />
        <AlertTitle>Einladung zu {invite.organization.name}</AlertTitle>
        <AlertDescription className="flex-row items-center gap-2">
          <span className="text-foreground">{inviterName}</span>hat dich
          eingeladen, als{" "}
          <Badge variant="warning" className="inline-flex">
            {ROLE_LABELS[invite.role] ?? invite.role}
          </Badge>{" "}
          beizutreten.
        </AlertDescription>
        <AlertAction>
          <Button
            size="xs"
            variant="destructive-outline"
            onClick={() => router.push("/home")}>
            Ablehnen
          </Button>
          <Button size="xs" onClick={handleAccept} disabled={accepting}>
            {accepting ? (
              <>
                <Spinner /> Wird angenommen...
              </>
            ) : (
              "Annehmen"
            )}
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
