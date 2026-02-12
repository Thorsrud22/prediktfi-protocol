import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "../src/styles/design-tokens.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import AppPillNav from "./components/AppPillNav";
import Footer from "./components/Footer";
import PhantomProvider from "./components/wallet/PhantomProvider";
import ToastProvider from "./components/ToastProvider";
import ConsentGate from "./components/ConsentGate";
import AttributionBoot from "./components/AttributionBoot";
import ClientErrorBoundary from "./components/ClientErrorBoundary";
import DebugProvider from "./providers/DebugProvider";
import DebugOverlay from "./components/dev/DebugOverlay";
import IntentStorageGuard from "./components/IntentStorageGuard";
import AuthGuard from "./components/AuthGuard";
import RoutePreloader from "./components/RoutePreloader";
import ShellWrapper from "./components/ShellWrapper";
import Aurora from "./components/ui/Aurora";


import ProgressBarProvider from "./components/ProgressBarProvider";
import { CSPostHogProvider } from "./providers/CSPostHogProvider";
import PostHogPageView from "./components/PostHogPageView";
import { SITE } from "./config/site";
import { getPlanFromRequest } from "./lib/plan";
import { headers } from "next/headers";



const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const isProduction = process.env.NODE_ENV === 'production' && process.env.SOLANA_CLUSTER !== 'devnet';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://prediktfi.xyz"),
  title: {
    default: "Predikt — AI Evaluation Protocol for Web3",
    template: "%s | Predikt",
  },
  description: "Institutional-grade AI evaluation for Web3, DeFi, and Memecoins. Real-time market signals and on-chain security verification.",
  alternates: {
    // canonical: isProduction ? '/' : undefined, // Deleted to force explicit canonicals per page
  },
  robots: isProduction ? undefined : {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "PrediktFi — AI Evaluation Protocol for Web3",
    description: "Institutional-grade AI evaluation for Web3, DeFi, and Memecoins. Real-time market signals and on-chain security verification.",
    type: "website",
    images: ["/og"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PrediktFi — AI Evaluation Protocol for Web3",
    description: "Institutional-grade AI evaluation for Web3, DeFi, and Memecoins. Real-time market signals and on-chain security verification.",
    images: ["/og"],
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
  // Get plan and nonce from middleware headers
  const headersList = await headers();
  const plan = headersList.get('x-plan') || 'free';
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="x-plan" content={plan} />
        <script
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                // console.log('[BOOT] Starting comprehensive localStorage cleanup...');
                
                // Override JSON.parse temporarily to catch and log errors
                const originalJSONParse = JSON.parse;
                JSON.parse = function(text, reviver) {
                  try {
                    return originalJSONParse.call(this, text, reviver);
                  } catch (e) {
                    console.warn('[BOOT] JSON.parse error intercepted (suppressed):', {
                      // error: e.message,
                      // text: typeof text === 'string' ? text.substring(0, 100) : text
                    });
                    // Return null instead of throwing to prevent crashes
                    return null;
                  }
                };
                
                try {
                  // Clear localStorage but preserve wallet+intents data
                  // console.log('[BOOT] Clearing localStorage while preserving wallet+intents data...');
                  
                  function clearLocalStorageButKeep(prefixesToKeep = [
                    'predikt:intents',      // behold alle intents
                    'predikt:wallet',       // behold wallet-navn/pubkey
                    'predikt:auth',         // SIWS cache
                    'predikt:visited',      // evt. visited flagg
                    'predikt:feed'          // behold feed cache (includes predikt:feed:v1)
                  ]) {
                    try {
                      const keep = {}
                      for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i)
                        if (prefixesToKeep.some(p => k.startsWith(p))) {
                          const v = localStorage.getItem(k)
                          if (v != null) keep[k] = v
                        }
                      }
                      localStorage.clear()
                      for (const k in keep) localStorage.setItem(k, keep[k])
                      // console.log('[BOOT] localStorage cleared, preserved:', Object.keys(keep))
                    } catch (e) {
                      console.warn('[BOOT] selective clear failed, skipping:', e)
                    }
                  }
                  
                  clearLocalStorageButKeep()
                  
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
                    // console.log('[BOOT] JSON.parse monitoring restored');
                  }, 5000);
                  
                } catch (e) {
                  console.error('[BOOT] Critical error during localStorage cleanup:', e);
                }
              })();
            `,
          }}
        />
        <script
          suppressHydrationWarning
          nonce={nonce}
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
      <body className={`${inter.variable} antialiased min-h-screen bg-transparent text-slate-100 relative overflow-x-hidden`}>
        <CSPostHogProvider>
          <PostHogPageView />
          <ProgressBarProvider>
            {/* Persistent Aurora background - stays across route changes */}
            {/* Persistent Aurora background - stays across route changes */}
            <Aurora
              colorStops={['#1e293b', '#60A5FA', '#3B82F6']} // Lighter base (slate-800) and brighter blues (blue-400, blue-500)
              amplitude={1.2}
              blend={0.6}
              speed={0.5}
              className="fixed inset-0 -z-10"
            />


            <IntentStorageGuard />
            <AuthGuard>
              <PhantomProvider>
                <ClientErrorBoundary>
                  <ToastProvider>
                    <ConsentGate />
                    <RoutePreloader />
                    <RoutePreloader />
                    <ShellWrapper
                      navbar={<AppPillNav />}
                      footer={<Footer />}
                    >
                      {children}
                    </ShellWrapper>
                    {process.env.NODE_ENV === "development" && (
                      <DebugProvider>
                        <DebugOverlay />
                      </DebugProvider>
                    )}
                  </ToastProvider>
                </ClientErrorBoundary>
              </PhantomProvider>
            </AuthGuard>
          </ProgressBarProvider>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
