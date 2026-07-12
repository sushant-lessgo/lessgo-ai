// Root request middleware: Clerk auth + published-host resolution.
// - Resolves Lessgo publish subdomains and custom domains to published static HTML
//   (KV route → /api/blob-proxy fast path; SSR /p/{slug} fallback) and per-host SEO files.
// - Enforces Clerk auth via auth.protect() on every route NOT in isPublicRoute below.
// Constraints: runs at the edge (KV via REST only, no Prisma); API/_next always fall
// through to auth; keep isPublicRoute and the matcher in sync when adding public routes.
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getRouteByKeyEdge, getRedirectEdge, getSlugForHostEdge } from '@/lib/routing/kvRoutes'
import { isLessgoAppHost, matchPublishSubdomain } from '@/lib/domains/hosts'
import { getApexToAppRedirect, getApexPublishRedirect, isApexPublishCandidate, shouldNoindex } from '@/lib/domains/appSplit'
import * as Sentry from '@sentry/nextjs'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/dev/(.*)',  // Dev routes (blocked in production by middleware)
  '/api/subscribe',
  '/api/test',
  '/api/start',
  '/api/publish',
  '/api/saveDraft',
  '/api/infer-fields',
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
  '/pricing', // marketing page — must be visible logged-out
  '/blog(.*)', // public blog listing + posts (marketing/SEO surface)
  '/sitemap.xml', // crawlers pre-auth, same rationale as robots.txt below
  '/api/blob-proxy',
  '/api/seo/(.*)', // per-host sitemap.xml/robots.txt/rss.xml rewrites (SEO Phase 4 + blog P2)
  '/api/blog/unsubscribe', // tokened one-click unsubscribe from notification emails (blog P2)
  '/robots.txt', // app-host disallow-all served pre-auth; belt-and-braces so protect() can't intercept crawlers
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
    // App-host /robots.txt — the SOLE pass-through early return allowed pre-auth
    // (D6): a fixed public disallow-all body, never an app page. shouldNoindex is
    // true only for the exact app prod host (app.lessgo.ai). Keeps the product app
    // out of search indexes; apex/localhost/vercel are unaffected (helper → false).
    if (shouldNoindex(host) && url.pathname === '/robots.txt') {
      return new NextResponse('User-agent: *\nDisallow: /', {
        headers: { 'content-type': 'text/plain', 'x-robots-tag': 'noindex, nofollow' },
      })
    }

    // Per-host sitemap.xml / robots.txt (SEO Phase 4) — resolved BEFORE the
    // redirect/KV/SSR fallbacks in both published branches below.
    const seoRewrite =
      url.pathname === '/sitemap.xml' ? '/api/seo/sitemap'
      : url.pathname === '/robots.txt' ? '/api/seo/robots'
      : url.pathname === '/rss.xml' ? '/api/seo/rss' // blog P2
      : null

    // Branch A: Lessgo published subdomain (e.g. mypage.lessgo.site, or legacy mypage.lessgo.ai)
    const pubSubdomain = matchPublishSubdomain(host)
    if (pubSubdomain && host) {
      const subdomain = pubSubdomain
      {
        if (seoRewrite) {
          url.pathname = seoRewrite
          url.searchParams.set('host', host)
          return NextResponse.rewrite(url)
        }

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
      if (seoRewrite) {
        url.pathname = seoRewrite
        url.searchParams.set('host', host)
        return NextResponse.rewrite(url)
      }
      const originalPath = url.pathname || '/'
      try {
        // 1. Fast path: KV route → blob proxy. Path-aware: any route:{host}:{path} key
        //    (root, multi-page subpaths, /blog/*) serves its blob; unknown paths fall through.
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

    // Apex /p/{slug} → published-subdomain 301 (permanent — spec). Apex hosts
    // reach this fall-through (isLessgoAppHost → skip Branch A/B). A /p path is
    // not an app-path, so this is independent of the 307 below; kept first per
    // plan ordering. Redirect early-return only — D6-safe (never NextResponse.next
    // here). Inert on localhost/vercel (helper → null), so D4 render path untouched.
    const pubRedirect = getApexPublishRedirect(host, url.pathname)
    if (pubRedirect) return NextResponse.redirect(pubRedirect, 301)

    // Apex → app redirect. Apex hosts (lessgo.ai / www.lessgo.ai) are
    // isLessgoAppHost, so they skip Branch A/B and reach this fall-through.
    // App-path prefixes (/dashboard, /edit, /admin, /sign-in, …) forward to
    // NEXT_PUBLIC_DASHBOARD_URL; query string preserved. Inert until that env
    // var is set (helper returns null), so localhost/e2e/pre-cutover unchanged.
    // /api/* and /_next/* are excluded above via isApiOrNext (apex keeps serving
    // APIs); /assets/* are static files excluded by the matcher — both untouched.
    // 307 TEMPORARY by design (spec — may be removed later; NEVER 301). This is
    // a redirect early-return, the only pass-through kind allowed here pre-auth
    // (D6: never NextResponse.next() in this region — that would skip auth.protect()).
    const appRedirect = getApexToAppRedirect(host, url.pathname + url.search)
    if (appRedirect) return NextResponse.redirect(appRedirect, 307)

    // Apex customer #0 (KV branch). ROOT-ONLY (isApexPublishCandidate: apex prod
    // host AND pathname === '/'), so this fires at most ONE KV GET per apex `/`
    // hit — never on /privacy, /blog, /pricing (those stay Next.js marketing
    // routes and skip KV entirely). If a `route:{host}:/` key exists (i.e. the
    // dogfood homepage was published by assigning lessgo.ai as a domain), rewrite
    // to the blob-proxy fast path — copied EXACTLY from Branch B (rk + v params +
    // stampGeo). This is a REWRITE to PUBLIC published content, so it's D6-safe
    // (no auth bypass: `/` is a public route anyway). On KV MISS or ERROR we do
    // NOT 404 — we fall through so apex `/` keeps rendering the Next.js homepage
    // (the critical safety property: an empty KV must never break the live home).
    //
    // Deliberately NO getSlugForHostEdge SSR fallback here (unlike Branch B): a
    // `slug-for:lessgo.ai` key would shadow EVERY apex path. Route-key check only.
    // Deliberately NO seoRewrite here either — apex sitemap/robots stay Next routes.
    if (isApexPublishCandidate(host, url.pathname)) {
      try {
        const routeKey = `route:${host}:${url.pathname || '/'}`
        const route = await getRouteByKeyEdge(routeKey)
        if (route) {
          url.pathname = '/api/blob-proxy'
          url.searchParams.set('rk', routeKey)
          url.searchParams.set('v', route.version)
          return stampGeo(NextResponse.rewrite(url))
        }
        // KV miss → fall through to marketing homepage (no early return).
      } catch (error) {
        console.error('[Middleware] apex KV lookup error:', error)
        Sentry.captureException(error, { level: 'warning', tags: { area: 'middleware', op: 'apexKvLookup' }, extra: { host } })
        // KV error → fall through to marketing homepage (never 404).
      }
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // App-host noindex header — STRICTLY POST-AUTH (D6). This runs only after
  // auth.protect() above has passed (or the route is public): an unauthenticated
  // non-public request never reaches here (protect throws Clerk's redirect). The
  // header rides a NextResponse.next() so clerkMiddleware merges its session/
  // handshake headers onto it — sessions survive. Apex/localhost return undefined
  // (Clerk default) → no such header. MUST NOT be an early return pre-auth.
  if (shouldNoindex(host)) {
    const res = NextResponse.next()
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return res
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