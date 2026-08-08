import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { institutName, institutSubtitle } from "@/lib/config";

const quicksand = Quicksand({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: institutName,
  description: institutSubtitle,
};

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
          <ToastProvider limit={3}>
            <AnchoredToastProvider>{children}</AnchoredToastProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
