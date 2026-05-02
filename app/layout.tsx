import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Shopify App Cost Tracker | Stop App Spend Leakage",
  description:
    "Track Shopify app subscriptions across stores, detect duplicate tools, and cut recurring spend before it compounds.",
  openGraph: {
    title: "Shopify App Cost Tracker",
    description:
      "Monitor app spend across stores, catch price changes, and uncover optimization opportunities in one dashboard.",
    url: siteUrl,
    siteName: "Shopify App Cost Tracker",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopify App Cost Tracker",
    description:
      "Track Shopify app costs across stores and eliminate overlapping subscriptions before they eat your margin."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2937_0%,#0d1117_40%,#0d1117_100%)]">
          {children}
        </div>
      </body>
    </html>
  );
}
