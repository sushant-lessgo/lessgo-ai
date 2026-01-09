/**
 * Analytics Event API - Phase 4
 *
 * Handles analytics events from static published pages
 * - Pageviews, CTA clicks, form submissions
 * - Direct DB upserts (no KV queue in MVP)
 * - CORS support for custom domains
 * - Optional rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for DB access
export const runtime = 'nodejs';

// Event validation schema
const AnalyticsEventSchema = z.object({
  event: z.enum(['pageview', 'cta_click', 'form_submit']),
  pageId: z.string().min(1),
  slug: z.string().min(1),
  timestamp: z.string().datetime(),
  url: z.string().url(),
  referrer: z.string().url().optional(),
  sessionId: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),

  // UTM parameters
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),

  // Event-specific data
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  formId: z.string().optional(),
  title: z.string().optional(),
});

// CORS headers for custom domains
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Extract client IP from Vercel headers
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Simple in-memory rate limiting (optional, can be KV-based later)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 1000, windowMs = 3600000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Clean expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now) rateLimitMap.delete(key);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// Detect device from user-agent
function detectDevice(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (optional, can be disabled)
    const clientIP = getClientIP(request);
    if (process.env.ENABLE_ANALYTICS_RATE_LIMIT === 'true') {
      if (!checkRateLimit(clientIP)) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429, headers: corsHeaders }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = AnalyticsEventSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid event data', details: validationResult.error.issues },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = validationResult.data;

    // Override device type from server-side detection if not provided
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = event.deviceType || detectDevice(userAgent);

    // Get current date for aggregation
    const eventDate = new Date(event.timestamp);
    const dateKey = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    // Upsert to PageAnalytics table
    await prisma.pageAnalytics.upsert({
      where: {
        slug_date: {
          slug: event.slug,
          date: dateKey,
        },
      },
      create: {
        slug: event.slug,
        date: dateKey,
        views: event.event === 'pageview' ? 1 : 0,
        uniqueVisitors: event.event === 'pageview' && event.sessionId ? 1 : 0,
        ctaClicks: event.event === 'cta_click' ? 1 : 0,
        formSubmissions: event.event === 'form_submit' ? 1 : 0,
        conversionRate: 0,
        desktopViews: event.event === 'pageview' && deviceType === 'desktop' ? 1 : 0,
        mobileViews: event.event === 'pageview' && deviceType === 'mobile' ? 1 : 0,
        tabletViews: event.event === 'pageview' && deviceType === 'tablet' ? 1 : 0,
        desktopConversions: event.event === 'form_submit' && deviceType === 'desktop' ? 1 : 0,
        mobileConversions: event.event === 'form_submit' && deviceType === 'mobile' ? 1 : 0,
        tabletConversions: event.event === 'form_submit' && deviceType === 'tablet' ? 1 : 0,
        topReferrers: event.referrer ? [{ url: event.referrer, count: 1 }] : [],
        topUtmSources: event.utm_source ? [{ source: event.utm_source, count: 1 }] : [],
      },
      update: {
        views: event.event === 'pageview' ? { increment: 1 } : undefined,
        ctaClicks: event.event === 'cta_click' ? { increment: 1 } : undefined,
        formSubmissions: event.event === 'form_submit' ? { increment: 1 } : undefined,
        desktopViews: event.event === 'pageview' && deviceType === 'desktop' ? { increment: 1 } : undefined,
        mobileViews: event.event === 'pageview' && deviceType === 'mobile' ? { increment: 1 } : undefined,
        tabletViews: event.event === 'pageview' && deviceType === 'tablet' ? { increment: 1 } : undefined,
        desktopConversions: event.event === 'form_submit' && deviceType === 'desktop' ? { increment: 1 } : undefined,
        mobileConversions: event.event === 'form_submit' && deviceType === 'mobile' ? { increment: 1 } : undefined,
        tabletConversions: event.event === 'form_submit' && deviceType === 'tablet' ? { increment: 1 } : undefined,
      },
    });

    // Log success (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Event tracked:', {
        event: event.event,
        slug: event.slug,
        device: deviceType,
      });
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
