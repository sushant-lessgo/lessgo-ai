import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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
  '/p/:slug',
  '/thanks',
  '/privacy',
  '/terms',
])

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get('host')
  const url = req.nextUrl.clone()
  
  // Handle subdomain routing for published pages
  if (host && host.includes('.lessgo.ai')) {
    const subdomain = host.split('.')[0]
    
    // Skip www and main domain
    if (subdomain && subdomain !== 'www' && subdomain !== 'lessgo') {
      // Rewrite subdomain requests to /p/[slug] route
      url.pathname = `/p/${subdomain}`
      return NextResponse.rewrite(url)
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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}