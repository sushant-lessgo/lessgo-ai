import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchPageAnalytics, withRetry } from '@/lib/posthog-api';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron request attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('📊 Starting analytics sync cron job...');

    // Get yesterday's date (we sync previous day's data)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Start of day
    const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    logger.info(`Syncing analytics for date: ${dateStr}`);

    // Get all published pages
    const publishedPages = await prisma.publishedPage.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        title: true,
      },
    });

    logger.info(`Found ${publishedPages.length} published pages to sync`);

    const results = {
      total: publishedPages.length,
      synced: 0,
      failed: 0,
      errors: [] as Array<{ slug: string; error: string }>,
    };

    // Sync each page
    for (const page of publishedPages) {
      try {
        logger.info(`Syncing analytics for: ${page.slug}`);

        // Fetch analytics from PostHog with retry
        const analytics = await withRetry(
          () => fetchPageAnalytics(page.slug, dateStr, dateStr),
          3,
          2000
        );

        // Calculate conversion rate
        const conversionRate =
          analytics.views > 0 ? analytics.submissions / analytics.views : 0;

        // Upsert to database
        await prisma.pageAnalytics.upsert({
          where: {
            slug_date: {
              slug: page.slug,
              date: yesterday,
            },
          },
          create: {
            slug: page.slug,
            date: yesterday,
            views: analytics.views,
            uniqueVisitors: analytics.uniqueVisitors,
            formSubmissions: analytics.submissions,
            conversionRate,
            avgTimeOnPage: analytics.avgTimeOnPage,
            ctaClicks: analytics.ctaClicks,
            topReferrers: analytics.topReferrers,
            topUtmSources: analytics.topUtmSources,
            desktopViews: analytics.deviceBreakdown.desktop,
            mobileViews: analytics.deviceBreakdown.mobile,
            tabletViews: analytics.deviceBreakdown.tablet,
            desktopConversions: analytics.deviceConversions.desktop,
            mobileConversions: analytics.deviceConversions.mobile,
            tabletConversions: analytics.deviceConversions.tablet,
          },
          update: {
            views: analytics.views,
            uniqueVisitors: analytics.uniqueVisitors,
            formSubmissions: analytics.submissions,
            conversionRate,
            avgTimeOnPage: analytics.avgTimeOnPage,
            ctaClicks: analytics.ctaClicks,
            topReferrers: analytics.topReferrers,
            topUtmSources: analytics.topUtmSources,
            desktopViews: analytics.deviceBreakdown.desktop,
            mobileViews: analytics.deviceBreakdown.mobile,
            tabletViews: analytics.deviceBreakdown.tablet,
            desktopConversions: analytics.deviceConversions.desktop,
            mobileConversions: analytics.deviceConversions.mobile,
            tabletConversions: analytics.deviceConversions.tablet,
            updatedAt: new Date(),
          },
        });

        logger.info(
          `✓ Synced ${page.slug}: ${analytics.views} views, ${analytics.submissions} conversions`
        );
        results.synced++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`✗ Error syncing ${page.slug}:`, error);
        results.failed++;
        results.errors.push({ slug: page.slug, error: errorMessage });
        // Continue with next page
      }
    }

    const summary = {
      success: true,
      date: dateStr,
      stats: results,
      timestamp: new Date().toISOString(),
    };

    logger.info('📊 Analytics sync complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('❌ Analytics sync failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Sync job failed',
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
