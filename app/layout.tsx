import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "../src/styles/design-tokens.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SolanaProviders from "./solana-providers";
import ToastProvider from "./components/ToastProvider";
import ConsentGate from "./components/ConsentGate";
import AttributionBoot from "./components/AttributionBoot";
import ClientErrorBoundary from "./components/ClientErrorBoundary";
import DebugProvider from "./providers/DebugProvider";
import DebugOverlay from "./components/dev/DebugOverlay";
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
  width: 'device-width',
  initialScale: 1,
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="x-plan" content={plan} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                console.log('[BOOT] Starting comprehensive localStorage cleanup...');
                
                // Override JSON.parse temporarily to catch and log errors
                const originalJSONParse = JSON.parse;
                JSON.parse = function(text, reviver) {
                  try {
                    return originalJSONParse.call(this, text, reviver);
                  } catch (e) {
                    console.warn('[BOOT] JSON.parse error intercepted (suppressed):', {
                      error: e.message,
                      text: typeof text === 'string' ? text.substring(0, 100) : text
                    });
                    // Return null instead of throwing to prevent crashes
                    return null;
                  }
                };
                
                try {
                  // Clear localStorage but preserve wallet persistence
                  console.log('[BOOT] Clearing localStorage while preserving wallet data...');
                  
                  // Preserve wallet persistence keys
                  const walletKeys = ['predikt:wallet:name', 'predikt:wallet:pubkey', 'predikt:wallet', 'predikt:auth:v1'];
                  const preservedData = {};
                  walletKeys.forEach(key => {
                    const value = localStorage.getItem(key);
                    if (value) {
                      preservedData[key] = value;
                    }
                  });
                  
                  // Clear all localStorage
                  localStorage.clear();
                  
                  // Restore preserved wallet data
                  Object.entries(preservedData).forEach(([key, value]) => {
                    localStorage.setItem(key, value);
                  });
                  
                  console.log('[BOOT] localStorage cleared, wallet data preserved');
                  
                  // Add global error handler to prevent dev overlay
                  window.addEventListener('error', function(event) {
                    if (event.message && event.message.includes('JSON.parse')) {
                      console.warn('[GLOBAL] Caught JSON.parse error:', event.message, event.filename, event.lineno);
                      event.preventDefault();
                      return true;
                    }
                  });
                  
                  // Add unhandledrejection handler for promise rejections
                  window.addEventListener('unhandledrejection', function(event) {
                    if (event.reason && event.reason.message && event.reason.message.includes('JSON.parse')) {
                      console.warn('[GLOBAL] Caught unhandled JSON.parse rejection:', event.reason.message);
                      event.preventDefault();
                      return true;
                    }
                  });
                  
                  // Restore original JSON.parse after a delay
                  setTimeout(function() {
                    JSON.parse = originalJSONParse;
                    console.log('[BOOT] JSON.parse monitoring restored');
                  }, 5000);
                  
                } catch (e) {
                  console.error('[BOOT] Critical error during localStorage cleanup:', e);
                }
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Hide Phantom wallet overlays as soon as possible
              (function() {
                const hidePhantomOverlays = () => {
                  const selectors = [
                    'div[id*="phantom"]',
                    'div[data-phantom]',
                    'iframe[src*="phantom"]',
                    'div[style*="position: fixed"][style*="z-index: 9999"]',
                    'div[style*="position: fixed"][style*="z-index: 10000"]'
                  ];
                  
                  selectors.forEach(selector => {
                    try {
                      document.querySelectorAll(selector).forEach(el => {
                        el.style.display = 'none';
                        el.style.visibility = 'hidden';
                        el.style.opacity = '0';
                      });
                    } catch(e) {}
                  });
                };
                
                // Run immediately
                hidePhantomOverlays();
                
                // Run when DOM is ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', hidePhantomOverlays);
                } else {
                  hidePhantomOverlays();
                }
                
                // Monitor for new elements
                if (typeof MutationObserver !== 'undefined') {
                  new MutationObserver(hidePhantomOverlays).observe(document.body || document.documentElement, {
                    childList: true,
                    subtree: true
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0F172A] text-slate-100`}>
        <SolanaProviders>
          {process.env.NODE_ENV === "development" ? (
            <DebugProvider>
              <ClientErrorBoundary>
                <ToastProvider>
                  <ConsentGate />
                  <Navbar />
                  <main className="flex min-h-screen flex-col">
                    {children}
                  </main>
                  <Footer />
                  <DebugOverlay />
                </ToastProvider>
              </ClientErrorBoundary>
            </DebugProvider>
          ) : (
            <ClientErrorBoundary>
              <ToastProvider>
                <ConsentGate />
                <Navbar />
                <main className="flex min-h-screen flex-col">
                  {children}
                </main>
                <Footer />
              </ToastProvider>
            </ClientErrorBoundary>
          )}
        </SolanaProviders>
      </body>
    </html>
  );
}
