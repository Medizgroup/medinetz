import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const quicksand = Quicksand({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medizgroup",
  description:
    "Medizgroup is a platform for managing medical records and patient data",
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
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange>
          <ToastProvider limit={10} position="top-center">
            <AnchoredToastProvider>{children}</AnchoredToastProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
