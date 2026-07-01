import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getRouteByKeyEdge, getRedirectEdge, getSlugForHostEdge } from '@/lib/routing/kvRoutes'
import { isLessgoAppHost, matchPublishSubdomain } from '@/lib/domains/hosts'
import * as Sentry from '@sentry/nextjs'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/dev/(.*)',  // Dev routes (blocked in production by middleware)
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
  '/api/audience/product/strategy',
  '/api/audience/product/generate-copy',
  '/p/(.*)',
  '/t/(.*)', // public testimonial collection pages (flag-gated in the handler)
  '/api/testimonials/collect', // public testimonial submit (flag-gated in the handler)
  '/thanks',
  '/privacy',
  '/terms',
  '/api/blob-proxy',
])

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get('host')
  const url = req.nextUrl.clone()

  // Lumen (+ any geo-aware template) reads this cookie client-side to pick the
  // default language (NL → Dutch). Additive + template-agnostic; lumen.v1.js
  // falls back to navigator.language when it's absent. Stamped on the published
  // rewrites below via stampGeo().
  const geoCountry = ((req as any).geo?.country || '').toUpperCase()
  const stampGeo = (res: NextResponse) => {
    if (geoCountry) res.cookies.set('geo-country', geoCountry, { path: '/', maxAge: 86400, httpOnly: false, sameSite: 'lax' })
    return res
  }

  // Block /dev/* routes in production
  if (url.pathname.startsWith('/dev/') && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev routes disabled in production' }, { status: 404 })
  }
  
  // API + _next always fall through to Clerk (for ALL hosts, including custom domains)
  const isApiOrNext = url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')

  if (!isApiOrNext) {
    // Branch A: Lessgo published subdomain (e.g. mypage.lessgo.site, or legacy mypage.lessgo.ai)
    const pubSubdomain = matchPublishSubdomain(host)
    if (pubSubdomain && host) {
      const subdomain = pubSubdomain
      {
        // Check for redirect to custom domain first (301)
        try {
          const redirect = await getRedirectEdge(host, url.pathname || '/')
          if (redirect) {
            return NextResponse.redirect(redirect.to, redirect.status === 302 ? 302 : 301)
          }
        } catch (error) {
          console.error('[Middleware] getRedirectEdge error:', error)
          Sentry.captureException(error, { level: 'warning', tags: { area: 'middleware', op: 'getRedirect' }, extra: { host } })
        }

        // KV route lookup → blob proxy. Fetch the full RouteConfig (one GET, same round-trip as the
        // old exists check) so we can append &v={version} — this varies the blob-proxy CDN cache key
        // per publish, so republishes propagate immediately instead of lagging the s-maxage window.
        try {
          const routeKey = `route:${host}:${url.pathname || '/'}`
          const route = await getRouteByKeyEdge(routeKey)
          if (route) {
            url.pathname = '/api/blob-proxy'
            url.searchParams.set('rk', routeKey)
            url.searchParams.set('v', route.version)
            return stampGeo(NextResponse.rewrite(url))
          }
        } catch (error) {
          console.error('[Middleware] KV lookup error:', error)
          Sentry.captureException(error, { level: 'warning', tags: { area: 'middleware', op: 'kvLookup' }, extra: { host } })
        }

        // Fallback: legacy SSR (preserve subpath, e.g. /privacy)
        const originalPath = url.pathname || '/'
        url.pathname = originalPath === '/' ? `/p/${subdomain}` : `/p/${subdomain}${originalPath}`
        return stampGeo(NextResponse.rewrite(url))
      }
    }
    // Branch B: Custom domain (host not owned by Lessgo)
    else if (host && !isLessgoAppHost(host)) {
      const originalPath = url.pathname || '/'
      try {
        // 1. Fast path: KV route → blob proxy (only root has static blob today; subpaths fall through).
        // Fetch the full RouteConfig so we can append &v={version} — versions the CDN cache key per
        // publish so custom-domain updates propagate immediately (see Branch A note).
        const routeKey = `route:${host}:${originalPath}`
        const route = await getRouteByKeyEdge(routeKey)
        if (route) {
          url.pathname = '/api/blob-proxy'
          url.searchParams.set('rk', routeKey)
          url.searchParams.set('v', route.version)
          return stampGeo(NextResponse.rewrite(url))
        }
        // 2. SSR fallback: look up slug → /p/{slug}{path} dynamic render
        const slug = await getSlugForHostEdge(host)
        if (slug) {
          url.pathname = originalPath === '/' ? `/p/${slug}` : `/p/${slug}${originalPath}`
          return stampGeo(NextResponse.rewrite(url))
        }
      } catch (error) {
        console.error('[Middleware] custom-domain KV error:', error)
        Sentry.captureException(error, { level: 'warning', tags: { area: 'middleware', op: 'customDomainKv' }, extra: { host } })
      }
      return new NextResponse('Not Found', { status: 404 })
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