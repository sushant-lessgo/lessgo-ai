import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getRouteEdge } from '@/lib/routing/kvRoutes'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/api/subscribe',
  '/api/generate-landing',
  '/api/test',
  '/api/start',
  '/api/publish',
  '/api/saveDraft',
  '/api/infer-fields',
  '/api/market-insights',
  '/api/validate-fields',
  '/api/upload-image',
  '/api/proxy-image',
  '/api/admin/migrate-project',
  '/api/admin/transfer-ownership',
  '/api/admin/kv',
  '/api/admin/env-check',
  '/api/forms/submit',
  '/api/analytics/event',
  '/api/og(.*)',
  '/p/:slug',
  '/thanks',
  '/privacy',
  '/terms',
  '/api/blob-proxy',
])

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get('host')
  const url = req.nextUrl.clone()
  
  // Handle subdomain routing for published pages
  if (host && host.includes('.lessgo.ai')) {
    const subdomain = host.split('.')[0]

    // Skip www and main domain
    if (subdomain && subdomain !== 'www' && subdomain !== 'lessgo') {
      // Don't rewrite API routes - they need to go through normally
      if (!url.pathname.startsWith('/api/')) {
        // === PHASE 3: KV ROUTING ===
        // Try KV routing first (edge-optimized static serving)
        const originalPath = url.pathname; // Preserve for logging

        try {
          console.error('[Middleware] Checking KV:', { host, path: originalPath });
          const routeKey = await getRouteEdge(host, originalPath || '/');
          console.error('[Middleware] KV result:', { routeKey, found: !!routeKey });

          if (routeKey) {
            // Found in KV - rewrite to blob proxy with ROUTE KEY (not blob key)
            // Proxy will do KV lookup to prevent user-supplied key spoofing
            url.pathname = '/api/blob-proxy';
            url.searchParams.set('rk', routeKey); // rk = route key

            console.error('[Middleware] Rewriting to blob proxy:', routeKey);
            return NextResponse.rewrite(url);
          } else {
            console.error('[Middleware] KV not found, falling back to SSR');
          }
        } catch (error) {
          // KV error - log and fall through to legacy SSR
          console.error('[Middleware] KV lookup error:', error);
        }

        // === FALLBACK: LEGACY SSR ===
        // Not in KV or KV error - use existing SSR route
        url.pathname = `/p/${subdomain}`;
        return NextResponse.rewrite(url);
      }
    }
  }
  
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
},
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|avif|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}