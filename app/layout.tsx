import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import { getStats } from "@/lib/db";
import { AuthenticatedAppShell } from "@/components/dashboard/AuthenticatedAppShell";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  // Absolute base for Open Graph/Twitter image and canonical URLs (the stable production alias).
  metadataBase: new URL("https://bacha-to.vercel.app"),
  title: { default: "BachaTo – grafik bachaty w Warszawie", template: "%s – BachaTo" },
  description: "Grafik zajęć bachaty w warszawskich szkołach tańca, wydarzenia i Twój plan tańca w jednym miejscu.",
  openGraph: { siteName: "BachaTo", locale: "pl_PL", type: "website" },
};

const EMPTY_STATS = { classCount: 0, schoolCount: 0, eventCount: 0, cityCount: 0 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  let stats = EMPTY_STATS;
  try {
    stats = getStats();
  } catch (error) {
    console.error("getStats() failed in root layout", error);
  }

  return (
    <html
      lang="pl"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground" suppressHydrationWarning>
        <div className="flex-1"><AuthenticatedAppShell>{children}</AuthenticatedAppShell></div>
        <Footer stats={stats} />
      </body>
    </html>
  );
}
