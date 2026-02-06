import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CronPing - Simple Cron Job Monitoring",
    template: "%s | CronPing",
  },
  description: "Get alerted when your cron jobs stop running. Simple, reliable monitoring with email alerts. Free for up to 3 monitors.",
  keywords: ["cron job monitoring", "cron monitoring", "scheduled task monitoring", "uptime monitoring", "dead man's switch"],
  authors: [{ name: "CronPing" }],
  creator: "CronPing",
  metadataBase: new URL("https://cronping.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cronping.dev",
    siteName: "CronPing",
    title: "CronPing - Simple Cron Job Monitoring",
    description: "Get alerted when your cron jobs stop running. Simple, reliable monitoring with email alerts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CronPing - Simple Cron Job Monitoring",
    description: "Get alerted when your cron jobs stop running. Simple, reliable monitoring with email alerts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
