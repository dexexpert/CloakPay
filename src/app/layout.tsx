import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";

import "@/app/globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "CloakPay",
  description: "Private payroll and contractor payments for Solana teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <div className="site-shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span aria-hidden="true" className="brand-mark">
                <span className="brand-mark-core" />
                <span className="brand-mark-cut" />
              </span>
              <div className="brand-copy">
                <strong>CloakPay</strong>
                <span>Private payroll on Solana</span>
              </div>
            </Link>
            <nav className="topnav">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/audit">Audit</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
