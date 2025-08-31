import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "./components/WalletContextProvider";
import ToastProvider from "./components/ToastProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
  title: `${SITE.name} - Tokenized Predictions on Solana`,
  description:
    "Tokenized predictions. Turning insights into assets. Built on Solana.",
  openGraph: {
    siteName: SITE.name,
    title: `${SITE.name} - Tokenized Predictions on Solana`,
    description:
      "Tokenized predictions. Turning insights into assets. Built on Solana.",
    type: "website",
  },
  twitter: {
    title: `${SITE.name} - Tokenized Predictions on Solana`,
    description:
      "Tokenized predictions. Turning insights into assets. Built on Solana.",
    card: "summary_large_image",
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
        <WalletContextProvider>
          <Navbar />
          <ToastProvider>{children}</ToastProvider>
          <Footer />
        </WalletContextProvider>
      </body>
    </html>
  );
}
