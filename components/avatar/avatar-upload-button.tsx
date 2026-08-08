"use client";

import * as React from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { saveUploadedAvatarAction } from "@/app/(app)/actions/users/profile";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB, siehe app/api/uploads/route.ts

export function AvatarUploadButton({
  disabled,
  onUploaded,
}: {
  disabled?: boolean;
  onUploaded: (url: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // erlaubt erneutes Auswählen derselben Datei

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toastManager.add({
        title: "Nicht unterstütztes Bildformat.",
        description: "Erlaubt: PNG, JPEG, WebP, GIF.",
        type: "error",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toastManager.add({
        title: "Datei ist zu groß.",
        description: "Maximal 10 MB.",
        type: "error",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/uploads", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => null);
    setUploading(false);

    if (!res.ok || !data?.url) {
      toastManager.add({
        title: data?.error ?? "Hochladen fehlgeschlagen.",
        type: "error",
      });
      return;
    }

    onUploaded(data.url);

    // Sofort persistieren, sonst geht die Auswahl beim nächsten Laden der
    // Seite verloren, falls "Speichern" im Formular nicht geklickt wird.
    const saved = await saveUploadedAvatarAction(data.url);
    if (!saved.ok) {
      toastManager.add({
        title: "Profilbild konnte nicht gespeichert werden.",
        type: "error",
      });
      return;
    }

    toastManager.add({ title: "Profilbild hochgeladen", type: "success" });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}>
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        Profilbild hochladen
      </Button>
    </>
  );
}
