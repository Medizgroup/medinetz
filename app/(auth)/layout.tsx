import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getInstitutConfig } from "@/lib/config";

export function generateMetadata() {
  return { title: `Anmelden | ${getInstitutConfig().name}` };
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  if (session?.user) {
    redirect("/home");
  }

  return children;
}
