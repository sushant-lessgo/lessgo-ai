import { NextRequest, NextResponse } from 'next/server';
import { getRouteByKey } from '@/lib/routing/kvRoutes';

export const runtime = 'edge';

/**
 * Blob Proxy Route Handler
 * Serves static HTML from Vercel Blob CDN via KV routing
 * Security: Only accepts route keys, not user-supplied blob keys
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const routeKey = searchParams.get('rk'); // rk = route key

  // 1. Validate input
  if (!routeKey) {
    return new NextResponse('Missing route key', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 2. Validate route key format
  if (!routeKey.startsWith('route:')) {
    return new NextResponse('Invalid route key format', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    // 3. Get route config from KV (includes blobUrl)
    const route = await getRouteByKey(routeKey);

    if (!route || !route.blobUrl) {
      return new NextResponse('Page not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // 4. Fetch blob content directly from CDN URL
    // No head() call needed - we have the URL from KV
    const response = await fetch(route.blobUrl, {
      headers: {
        'User-Agent': request.headers.get('User-Agent') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Blob fetch failed: ${response.status}`);
    }

    // 5. Return with conservative cache headers
    // More conservative than immutable until fully verified
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',

        // Conservative cache: 1 hour CDN, stale-while-revalidate for 24h
        // Can upgrade to immutable in Phase 3.5 once verified stable
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',

        // ETag for conditional requests
        'ETag': `"${route.version}"`,

        // Security headers
        'X-Content-Type-Options': 'nosniff',

        // Debugging headers
        'X-Served-From': 'blob-proxy',
        'X-Version': route.version,

        // CORS for future custom domains
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[Blob Proxy] Error:', {
      routeKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return new NextResponse('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
