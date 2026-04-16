import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getRouteEdge, getRedirectEdge, getSlugForHostEdge } from '@/lib/routing/kvRoutes'
import { isLessgoAppHost } from '@/lib/domains/hosts'

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
  '/api/v2/research',
  '/api/v2/strategy',
  '/api/v2/uiblock-select',
  '/api/v2/generate-copy',
  '/api/v3/strategy',
  '/api/v3/generate-copy',
  '/p/:slug',
  '/thanks',
  '/privacy',
  '/terms',
  '/api/blob-proxy',
])

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get('host')
  const url = req.nextUrl.clone()

  // Block /dev/* routes in production
  if (url.pathname.startsWith('/dev/') && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev routes disabled in production' }, { status: 404 })
  }
  
  // API + _next always fall through to Clerk (for ALL hosts, including custom domains)
  const isApiOrNext = url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')

  if (!isApiOrNext) {
    // Branch A: Lessgo subdomain (e.g. mypage.lessgo.ai)
    if (host && host.includes('.lessgo.ai')) {
      const subdomain = host.split('.')[0]
      if (subdomain && subdomain !== 'www' && subdomain !== 'lessgo') {
        // Check for redirect to custom domain first (301)
        try {
          const redirect = await getRedirectEdge(host, url.pathname || '/')
          if (redirect) {
            return NextResponse.redirect(redirect.to, redirect.status === 302 ? 302 : 301)
          }
        } catch (error) {
          console.error('[Middleware] getRedirectEdge error:', error)
        }

        // KV route lookup → blob proxy
        try {
          const routeKey = await getRouteEdge(host, url.pathname || '/')
          if (routeKey) {
            url.pathname = '/api/blob-proxy'
            url.searchParams.set('rk', routeKey)
            return NextResponse.rewrite(url)
          }
        } catch (error) {
          console.error('[Middleware] KV lookup error:', error)
        }

        // Fallback: legacy SSR
        url.pathname = `/p/${subdomain}`
        return NextResponse.rewrite(url)
      }
    }
    // Branch B: Custom domain (host not owned by Lessgo)
    else if (host && !isLessgoAppHost(host)) {
      // v1: root path only
      if (url.pathname !== '/') {
        return new NextResponse('Not Found', { status: 404 })
      }
      try {
        // 1. Fast path: KV route → blob proxy
        const routeKey = await getRouteEdge(host, '/')
        if (routeKey) {
          url.pathname = '/api/blob-proxy'
          url.searchParams.set('rk', routeKey)
          return NextResponse.rewrite(url)
        }
        // 2. SSR fallback: look up slug → /p/{slug} dynamic render
        const slug = await getSlugForHostEdge(host)
        if (slug) {
          url.pathname = `/p/${slug}`
          return NextResponse.rewrite(url)
        }
      } catch (error) {
        console.error('[Middleware] custom-domain KV error:', error)
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