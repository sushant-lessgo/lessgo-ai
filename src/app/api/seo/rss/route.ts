/**
 * Per-host RSS feed for a published site's blog (Blog P2).
 *
 * middleware rewrites {host}/rss.xml here with ?host= (same mechanism as
 * sitemap.xml). Items = published posts, noIndexed omitted; 404 when the site
 * has no (indexable) published posts — mirrors the /blog index lifecycle.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolvePublishedPageByHost } from '@/lib/seo/resolvePublishedHost';
import { buildRssXml } from '@/lib/seo/buildRssXml';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host');
  if (!host) return new NextResponse('Not Found', { status: 404 });

  try {
    const resolved = await resolvePublishedPageByHost(host);
    if (!resolved || !resolved.page.projectId) return new NextResponse('Not Found', { status: 404 });

    const posts = await prisma.blogPost.findMany({
      where: { projectId: resolved.page.projectId, status: 'published' },
      orderBy: { publishedAt: 'desc' },
      select: { slug: true, title: true, excerpt: true, publishedAt: true, seo: true },
    });
    const indexable = posts.filter((p) => !(p.seo as any)?.noIndex);
    if (indexable.length === 0) return new NextResponse('Not Found', { status: 404 });

    const xml = buildRssXml({
      canonicalHost: resolved.canonicalHost,
      siteTitle: resolved.page.title || resolved.page.slug,
      posts: indexable,
    });
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': CACHE,
      },
    });
  } catch (error) {
    console.error('[seo/rss] error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
