import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CareerHub — The Employment Gazette",
  description: "A job portal for candidates, recruiters and editors alike.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t-2 border-ink mt-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 sm:flex-row">
            <p className="font-display text-sm font-bold">
              Career<span className="text-oxblood">Hub</span>{" "}
              <span className="font-normal text-ink-faint">· The Employment Gazette</span>
            </p>
            <p className="dateline">Set in Space Grotesk & Inter · Printed on 100% recycled pixels</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
