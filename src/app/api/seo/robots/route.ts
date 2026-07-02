/**
 * Per-host robots.txt for published pages (SEO track, Phase 4).
 *
 * ALWAYS permissive + a Sitemap: line on the canonical host — noindex is
 * enforced by the <meta robots> tag in the page HTML, never by Disallow
 * (Disallow blocks the crawl so the noindex directive is never seen).
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolvePublishedPageByHost } from '@/lib/seo/resolvePublishedHost';
import { buildRobotsTxt } from '@/lib/seo/buildSitemapXml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host');
  if (!host) return new NextResponse('Not Found', { status: 404 });

  try {
    const resolved = await resolvePublishedPageByHost(host);
    if (!resolved) return new NextResponse('Not Found', { status: 404 });

    return new NextResponse(buildRobotsTxt(resolved.canonicalHost), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': CACHE,
      },
    });
  } catch (error) {
    console.error('[seo/robots] error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
