import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import EnhancedNavbar from "./components/EnhancedNavbar";
import Footer from "./components/Footer";
import WalletProvider from "./components/WalletProviderDev";
import ToastProvider from "./components/ToastProvider";
import ConsentGate from "./components/ConsentGate";
import AttributionBoot from "./components/AttributionBoot";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { SITE } from "./config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: ["prediction markets", "AI", "Solana", "DeFi", "blockchain"],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    title: SITE.name,
    description: SITE.description,
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    creator: "@prediktfi",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased app-bg`}>
        <ThemeProvider>
          <ErrorBoundary>
            <WalletProvider>
              <ToastProvider>
                <div className="flex min-h-screen flex-col">
                  <EnhancedNavbar />
                  <main className="flex-1">
                    <Suspense fallback={<div className="min-h-screen bg-[color:var(--bg)]" />}>
                      {children}
                    </Suspense>
                  </main>
                  <Footer />
                </div>
                <AttributionBoot />
              </ToastProvider>
            </WalletProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
