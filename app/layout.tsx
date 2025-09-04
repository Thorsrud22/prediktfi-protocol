import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WalletProvider from "./components/WalletProviderDev";
import ToastProvider from "./components/ToastProvider";
import ConsentGate from "./components/ConsentGate";
import AttributionBoot from "./components/AttributionBoot";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SITE } from "./config/site";
import { getPlanFromRequest } from "./lib/plan";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const isProduction = process.env.NODE_ENV === 'production' && process.env.SOLANA_CLUSTER !== 'devnet';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "PrediktFi — AI prediction studio with freemium quotas",
    template: "%s | PrediktFi",
  },
  description: "AI prediction studio with freemium quotas and shareable insights. Get probability analysis with confidence scores.",
  alternates: {
    canonical: isProduction ? '/' : undefined,
  },
  robots: isProduction ? undefined : {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "PrediktFi — AI prediction studio with freemium quotas",
    description: "AI prediction studio with freemium quotas and shareable insights. Get probability analysis with confidence scores.",
    type: "website",
    images: ["/og/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PrediktFi — AI prediction studio with freemium quotas",
    description: "AI prediction studio with freemium quotas and shareable insights. Get probability analysis with confidence scores.",
    images: ["/og/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1020' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get plan from middleware header
  const headersList = await headers();
  const plan = headersList.get('x-plan') || 'free';

  return (
    <html lang="en">
      <head>
        <meta name="x-plan" content={plan} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased app-bg`}>
                <WalletProvider>
          <ToastProvider>
            <ConsentGate />
            <Navbar />
            <main className="flex min-h-screen flex-col">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <Footer />
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
