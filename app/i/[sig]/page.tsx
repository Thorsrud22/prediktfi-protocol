import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Receipt from '../../components/Receipt';
import { type Insight, type InsightErrorCode } from '../../lib/ai/types';
import { buildShareUrl, persistReferralData } from '../../lib/share';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{ sig: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ERROR_MESSAGES: Record<InsightErrorCode, string> = {
  "INVALID_SIGNATURE": "The transaction signature format is invalid",
  "NOT_FOUND": "Transaction not found on the blockchain",
  "NOT_CONFIRMED": "Transaction exists but is not yet confirmed",
  "NO_MEMO": "No memo instruction found in this transaction",
  "INVALID_MEMO": "Memo data is not valid JSON or missing required fields",
  "NOT_PREDIKT_INSIGHT": "This transaction is not a valid Predikt insight",
  "NETWORK_ERROR": "Unable to connect to Solana network",
};

async function fetchInsight(sig: string, cluster: string = 'devnet') {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    const response = await fetch(
      `${baseUrl}/api/insights?sig=${encodeURIComponent(sig)}&cluster=${cluster}`,
      { 
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error || 'NETWORK_ERROR' as InsightErrorCode 
      };
    }
    
    const data = await response.json();
    return { 
      success: true, 
      insight: data.insight as Insight, 
      slot: data.slot as number 
    };
  } catch (error) {
    console.error('Failed to fetch insight:', error);
    return { 
      success: false, 
      error: 'NETWORK_ERROR' as InsightErrorCode 
    };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sig } = await params;
  
  // Attempt to fetch insight for metadata
  const result = await fetchInsight(sig);
  
  if (result.success && result.insight) {
    const insight = result.insight;
    const shortQuestion = insight.question.length > 60 
      ? insight.question.substring(0, 57) + '...'
      : insight.question;
    
    const title = `Predikt • ${shortQuestion}`;
    const description = `AI insight • P=${Math.round(insight.prob * 100)}% • Model ${insight.model} • Verified on-chain`;
    const canonicalUrl = buildShareUrl(`/i/${sig}`);
    const ogImageUrl = buildShareUrl(`/api/og/insight/${sig}`);
    
    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Predikt',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `AI prediction: ${shortQuestion}`,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  }
  
  // Fallback metadata
  return {
    title: 'Predikt • AI Insight',
    description: 'On-chain AI prediction insight',
    openGraph: {
      title: 'Predikt • AI Insight',
      description: 'On-chain AI prediction insight',
      images: [buildShareUrl(`/api/og/insight/${sig}`)],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Predikt • AI Insight',
      description: 'On-chain AI prediction insight',
      images: [buildShareUrl(`/api/og/insight/${sig}`)],
    },
  };
}

function ReferralHandler({ searchParams }: { searchParams: PageProps['searchParams'] }) {
  // Handle referral persistence on client side
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        urlParams.set(key, value);
      }
    });
    persistReferralData(urlParams);
  }
  return null;
}

export default async function InsightPermalinkPage({ params, searchParams }: PageProps) {
  const { sig } = await params;
  
  if (!sig || typeof sig !== 'string') {
    notFound();
  }
  
  const cluster = 'devnet'; // Default cluster
  const result = await fetchInsight(sig, cluster);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <ReferralHandler searchParams={searchParams} />
      </Suspense>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/feed" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🔮</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Predikt</span>
            </Link>
            
            {result.success && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Verified on-chain
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {result.success ? (
          // Success: Show receipt
          <div className="space-y-6">
            {/* JSON-LD Schema */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "CreativeWork",
                  "name": result.insight!.question,
                  "description": result.insight!.rationale ? result.insight!.rationale.substring(0, 160) + (result.insight!.rationale.length > 160 ? '...' : '') : `AI prediction using ${result.insight!.model}`,
                  "author": {
                    "@type": "Organization",
                    "name": "Predikt AI"
                  },
                  "datePublished": result.insight!.ts ? new Date(result.insight!.ts).toISOString() : new Date().toISOString(),
                  "keywords": [
                    result.insight!.topic || "prediction",
                    result.insight!.model || "AI",
                    "blockchain",
                    "Solana"
                  ].join(", "),
                  "additionalProperty": [
                    {
                      "@type": "PropertyValue",
                      "name": "probability",
                      "value": result.insight!.prob
                    },
                    {
                      "@type": "PropertyValue", 
                      "name": "verification_status",
                      "value": "verified"
                    }
                  ],
                  "url": buildShareUrl(`/i/${sig}`)
                })
              }}
            />
            
            <Receipt 
              insight={result.insight!}
              signature={sig}
              slot={result.slot}
              cluster={cluster}
            />
            
            {/* Navigation */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/studio"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                Create Insight
              </Link>
              <Link
                href="/feed"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Community Feed
              </Link>
            </div>
          </div>
        ) : (
          // Error: Show failure state
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-red-600">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h1>
              <p className="text-red-600 mb-6">
                {result.error && result.error in ERROR_MESSAGES 
                  ? ERROR_MESSAGES[result.error as InsightErrorCode] 
                  : 'Unknown error occurred'}
              </p>
              
              <div className="bg-gray-50 rounded-md p-4 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-600">Signature:</span>
                  <code className="bg-white px-2 py-1 rounded font-mono text-xs border">
                    {sig.substring(0, 8)}...{sig.substring(-8)}
                  </code>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={`/me?sig=${sig}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  🔄 Retry Verification
                </Link>
                <Link
                  href="/studio"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                >
                  Create New Insight
                </Link>
                <Link
                  href="/feed"
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Community Feed
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
