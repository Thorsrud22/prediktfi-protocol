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
  title: `${SITE.name} - Tokenized Predictions on Solana`,
  description:
    "Tokenized predictions. Turning insights into assets. Built on Solana.",
  openGraph: {
    siteName: SITE.name,
    title: `${SITE.name} - Tokenized Predictions on Solana`,
    description:
      "Tokenized predictions. Turning insights into assets. Built on Solana.",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE.name} Open Graph Image`,
      },
    ],
  },
  twitter: {
    title: `${SITE.name} - Tokenized Predictions on Solana`,
    description:
      "Tokenized predictions. Turning insights into assets. Built on Solana.",
    card: "summary_large_image",
    images: [
      {
        url: "/opengraph-image",
        alt: `${SITE.name} Open Graph Image`,
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1f44",
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
