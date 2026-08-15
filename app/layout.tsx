import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import { getStats } from "@/lib/db";
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
  title: "Grafik bachaty — Warszawa",
  description: "Grafik zajęć bachaty w warszawskich szkołach tańca, aktualizowany automatycznie.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const stats = getStats();

  return (
    <html
      lang="pl"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground" suppressHydrationWarning>
        <div className="flex-1">{children}</div>
        <Footer stats={stats} />
      </body>
    </html>
  );
}
