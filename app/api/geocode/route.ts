import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { geocodeAddress } from "@/lib/utils/geocode";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("q") ?? "";
  if (!address.trim()) {
    return NextResponse.json({ result: null });
  }

  const result = await geocodeAddress(address);
  return NextResponse.json({ result });
}
