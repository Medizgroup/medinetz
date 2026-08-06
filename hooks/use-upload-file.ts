import * as React from "react";

import { toast } from "sonner";

export type UploadedFile = {
  key: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

interface UseUploadFileProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
}: UseUploadFileProps = {}) {
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadThing(file: File) {
    setIsUploading(true);
    setUploadingFile(file);
    setProgress(30);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Upload fehlgeschlagen.");
      }

      const uploaded = data as UploadedFile;
      setProgress(100);
      setUploadedFile(uploaded);
      onUploadComplete?.(uploaded);

      return uploaded;
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      onUploadError?.(error);
      return undefined;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadingFile,
  };
}

export function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Etwas ist schiefgelaufen, bitte versuche es erneut.";
}

export function showErrorToast(err: unknown) {
  return toast.error(getErrorMessage(err));
}
