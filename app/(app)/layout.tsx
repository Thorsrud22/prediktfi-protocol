import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "@/app/globals.css";
import "@/src/styles/design-tokens.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import AppPillNav from "@/app/components/AppPillNav";
import Footer from "@/app/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Scripts kept for basic functionality/integrity if needed, but stripped of logic */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen bg-[#0F172A] text-slate-100`}>
        {/* Simplified Layout for Coming Soon: No Guards, No Providers */}
        <AppPillNav />
        <main className="flex min-h-screen flex-col pt-24">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
