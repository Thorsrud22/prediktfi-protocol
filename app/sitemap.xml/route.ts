import { NextResponse } from 'next/server'

export const runtime = 'edge'

interface CreatorListItem {
  id: string;
  handle: string;
  score: number;
  accuracy: number;
  createdAt: string;
}

async function getCreators(): Promise<CreatorListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://predikt.fi'
    const response = await fetch(`${baseUrl}/api/public/creators?limit=200`, {
      next: { revalidate: 3600 } // 1 hour cache
    });
    
    if (!response.ok) {
      return [];
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch creators for sitemap:', error);
    return [];
  }
}

export async function GET() {
  const baseUrl = 'https://predikt.fi'
  const currentDate = new Date().toISOString()
  
  // Fetch creators for sitemap
  const creators = await getCreators()

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/studio</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/feed</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/leaderboard-v2</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/policy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  ${creators.map(creator => `
  <url>
    <loc>${baseUrl}/creator/${creator.handle}</loc>
    <lastmod>${creator.createdAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
