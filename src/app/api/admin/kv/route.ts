import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Admin KV Debug Endpoint
 * GET: Check KV entry
 * POST: Fix KV entry
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const action = searchParams.get('action') || 'check';

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    const host = `${slug}.lessgo.ai`;
    const routeKey = `route:${host}:/`;

    // Get KV entry
    const kvEntry = await kv.get(routeKey);
    const kvExists = await kv.exists(routeKey);

    // Get database entry
    const dbPage = await prisma.publishedPage.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        publishState: true,
        currentVersionId: true,
        lastPublishAt: true,
        currentVersion: {
          select: {
            version: true,
            blobKey: true,
            blobUrl: true,
            createdAt: true,
          }
        }
      }
    });

    const result = {
      slug,
      routeKey,
      action,
      kv: {
        exists: kvExists > 0,
        entry: kvEntry,
      },
      database: dbPage ? {
        pageId: dbPage.id,
        publishState: dbPage.publishState,
        lastPublishAt: dbPage.lastPublishAt,
        currentVersion: dbPage.currentVersion,
      } : null,
      match: kvEntry && dbPage ? {
        pageIdMatch: (kvEntry as any).pageId === dbPage.id,
        versionMatch: (kvEntry as any).version === dbPage.currentVersion?.version,
        blobUrlMatch: (kvEntry as any).blobUrl === dbPage.currentVersion?.blobUrl,
      } : null,
      diagnosis: getDiagnosis(kvEntry, dbPage, kvExists),
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('[Admin KV] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, action } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    if (action !== 'fix') {
      return NextResponse.json({ error: 'Invalid action. Use "fix"' }, { status: 400 });
    }

    // Get current page from DB
    const page = await prisma.publishedPage.findUnique({
      where: { slug },
      include: {
        currentVersion: true,
      }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found in database' }, { status: 404 });
    }

    if (!page.currentVersion) {
      return NextResponse.json({ error: 'Page has no current version' }, { status: 400 });
    }

    // Update KV with correct info
    const host = `${slug}.lessgo.ai`;
    const routeKey = `route:${host}:/`;

    const newRouteConfig = {
      pageId: page.id,
      version: page.currentVersion.version,
      blobUrl: page.currentVersion.blobUrl,
      publishedAt: Date.now(),
    };

    console.log('[Admin KV] Updating:', { routeKey, newRouteConfig });

    await kv.set(routeKey, newRouteConfig, { ex: 365 * 24 * 60 * 60 });

    // Verify
    const verifiedKV = await kv.get(routeKey);

    return NextResponse.json({
      success: true,
      slug,
      routeKey,
      updated: newRouteConfig,
      verified: verifiedKV,
      message: 'KV entry updated successfully. Try accessing the page now.',
      testUrl: `https://${slug}.lessgo.ai`,
    });

  } catch (error) {
    console.error('[Admin KV] Fix error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

function getDiagnosis(kvEntry: any, dbPage: any, kvExists: number): string {
  if (!dbPage) {
    return 'Page not found in database';
  }

  if (kvExists === 0) {
    return 'KV entry missing - publish likely failed or KV update was skipped';
  }

  if (!kvEntry) {
    return 'KV exists flag is set but entry is null - possible KV corruption';
  }

  if (!dbPage.currentVersion) {
    return 'Database has no current version - publish incomplete';
  }

  const pageIdMatch = kvEntry.pageId === dbPage.id;
  const versionMatch = kvEntry.version === dbPage.currentVersion?.version;
  const blobUrlMatch = kvEntry.blobUrl === dbPage.currentVersion?.blobUrl;

  if (!pageIdMatch) {
    return `KV points to wrong page (KV: ${kvEntry.pageId}, DB: ${dbPage.id})`;
  }

  if (!versionMatch) {
    return `KV has stale version (KV: ${kvEntry.version}, DB: ${dbPage.currentVersion.version})`;
  }

  if (!blobUrlMatch) {
    return 'KV has wrong blob URL - possible blob upload issue';
  }

  return 'KV and DB match - routing should work. Check middleware or CDN cache.';
}
