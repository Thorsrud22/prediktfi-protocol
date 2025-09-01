import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WalletContextProvider from "./components/WalletContextProvider";
import ToastProvider from "./components/ToastProvider";
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
    default: "Predikt — Tokenized predictions",
    template: "%s | Predikt",
  },
  description: "Tokenized predictions. Turning insights into assets. Built on Solana.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Predikt — Tokenized predictions",
    description: "Predict markets without limits. Turning insights into assets. Built on Solana.",
    type: "website",
    images: ["/og/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Predikt — Tokenized predictions",
    description: "Predict markets without limits. Built on Solana.",
    images: ["/og/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1020' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased app-bg`}>
        <Navbar />
        <main className="min-h-screen">
          <WalletContextProvider>
            <ToastProvider>{children}</ToastProvider>
          </WalletContextProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
