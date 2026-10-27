import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getInstitutConfig } from "@/lib/config";
import { InstitutProvider } from "@/components/providers/institut-provider";

const quicksand = Quicksand({
  variable: "--font-roboto",
  subsets: ["latin"],
});

// Institut-Name/-Untertitel kommen zur Laufzeit aus der Umgebung (siehe
// lib/config.ts) — daher nichts statisch vorrendern.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const { name, subtitle } = getInstitutConfig();
  return { title: name, description: subtitle };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${quicksand.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="default"
          enableSystem
          disableTransitionOnChange>
          <InstitutProvider value={getInstitutConfig()}>
            <ToastProvider limit={3}>
              <AnchoredToastProvider>{children}</AnchoredToastProvider>
            </ToastProvider>
          </InstitutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
