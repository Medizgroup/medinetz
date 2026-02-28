"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const h = await headers();
const session = await auth.api.getSession({ headers: h });

const userId = session?.user?.id;

export async function updateUser(formData: FormData) {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const firstName = formData.get("firstName")?.toString() || undefined;
  const lastName = formData.get("lastName")?.toString() || undefined;
  const avatarUrl = formData.get("avatarUrl")?.toString() || undefined;
  const name = formData.get("name")?.toString() || undefined;
  const displayName = formData.get("displayName")?.toString() || undefined;
}
