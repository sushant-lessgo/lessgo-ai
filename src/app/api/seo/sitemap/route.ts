/**
 * Per-host sitemap.xml for published pages (SEO track, Phase 4).
 *
 * middleware rewrites {host}/sitemap.xml here with ?host=. Lists the root +
 * all published subpages (noindexed pages omitted), <loc> on the canonical
 * host. The marketing sitemap (lessgo.ai) is served by app/sitemap.xml, not
 * this route.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolvePublishedPageByHost } from '@/lib/seo/resolvePublishedHost';
import { buildSitemapXml, collectSitemapPaths } from '@/lib/seo/buildSitemapXml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host');
  if (!host) return new NextResponse('Not Found', { status: 404 });

  try {
    const resolved = await resolvePublishedPageByHost(host);
    if (!resolved) return new NextResponse('Not Found', { status: 404 });

    const paths = collectSitemapPaths(resolved.page.content);
    if (paths.length === 0) return new NextResponse('Not Found', { status: 404 });

    const xml = buildSitemapXml({
      canonicalHost: resolved.canonicalHost,
      lastPublishAt: resolved.page.lastPublishAt,
      paths,
    });
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': CACHE,
      },
    });
  } catch (error) {
    console.error('[seo/sitemap] error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
