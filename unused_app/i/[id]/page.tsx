import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InsightResponse } from '../../api/insight/_schemas';
import ProposalSection from '../../components/ProposalSection';
import MarketIntegration from '../../components/MarketIntegration';
import PredictionDetail from './PredictionDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getInsight(id: string): Promise<InsightResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/insight?id=${id}`, {
      next: { revalidate: 300 },
    });
    if (response.ok) {
      return response.json();
    }
  } catch (e) {
    // ignore
  }

  if (id.startsWith('demo-')) {
    const demoMap: Record<string, { q: string; p: number; category: string }> = {
      'demo-1': { q: 'Will BTC reach $100k this year?', p: 0.75, category: 'crypto' },
      'demo-2': { q: 'Will AI adoption accelerate in 2025?', p: 0.85, category: 'tech' },
      'demo-3': {
        q: 'Will SOL flip ETH in TPS metrics this quarter?',
        p: 0.62,
        category: 'crypto',
      },
      'demo-4': { q: 'Will a major L2 outage occur this month?', p: 0.28, category: 'tech' },
      'demo-5': { q: 'Will a top 10 exchange announce bankruptcy?', p: 0.12, category: 'stocks' },
      'demo-6': {
        q: 'Will a major AI model surpass benchmarks this quarter?',
        p: 0.54,
        category: 'tech',
      },
    };
    const d = demoMap[id] || { q: 'Demo prediction', p: 0.5, category: 'general' };
    return {
      id,
      canonical: d.q,
      p: d.p,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      resolverKind: 'price',
      resolverRef: 'DEMO',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      creator: { handle: 'demo_user', score: 85, accuracy: 70 },
    };
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const insight = await getInsight(id);
  if (!insight) {
    return {
      title: 'Insight Not Found | PrediktFi',
      description: 'The requested insight could not be found.',
    };
  }
  const probability = Math.round(insight.p * 100);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    title: `${probability}% confidence - ${insight.canonical} | PrediktFi`,
    description: `Verified prediction: ${
      insight.canonical
    } (${probability}% confidence) - Status: ${insight.status || 'OPEN'}`,
    keywords: ['prediction', 'blockchain', 'solana', 'verification', 'forecast', 'AI'],
    authors: [{ name: insight.creator?.handle || 'Anonymous' }],
    openGraph: {
      title: `${probability}% - ${insight.canonical}`,
      description: `Verified prediction: ${insight.canonical} (${probability}% confidence)`,
      type: 'article',
      publishedTime: insight.createdAt,
      images: [
        {
          url: `${baseUrl}/api/og/${id}`,
          width: 1200,
          height: 630,
          alt: `Prediction: ${insight.canonical} with ${probability}% confidence`,
        },
      ],
      siteName: 'PrediktFi',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@PrediktFi',
      title: `${probability}% - ${insight.canonical}`,
      description: `Verified prediction: ${insight.canonical} (${probability}% confidence)`,
      images: [
        {
          url: `${baseUrl}/api/og/${id}`,
          alt: `Prediction: ${insight.canonical} with ${probability}% confidence`,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function InsightPage({ params }: PageProps) {
  const { id } = await params;
  const insight = await getInsight(id);
  if (!insight) {
    notFound();
  }
  const probabilityPercent = Math.round(insight.p * 100);

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: insight.canonical,
    description: `Verified prediction: ${insight.canonical} (${probabilityPercent}% confidence)`,
    author: {
      '@type': 'Person',
      name: insight.creator?.handle || 'Anonymous',
    },
    datePublished: insight.createdAt,
    dateModified: insight.createdAt,
    publisher: {
      '@type': 'Organization',
      name: 'PrediktFi',
      url: 'https://predikt.fi',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/i/${id}`,
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* New Stylish Prediction Detail */}
      <PredictionDetail insight={insight} id={id} />

      {/* Proposal System for URL/TEXT Resolvers */}
      {insight.status !== 'RESOLVED' &&
        insight.resolverKind &&
        ['URL', 'TEXT'].includes(insight.resolverKind) && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <ProposalSection
              insightId={insight.id}
              resolverKind={insight.resolverKind as 'URL' | 'TEXT'}
            />
          </div>
        )}

      {/* Market Integration */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Related Prediction Markets</h3>
          <MarketIntegration
            insightId={insight.id}
            question={insight.canonical}
            probability={insight.p}
            className="max-w-4xl"
          />
        </div>
      </div>
    </>
  );
}
