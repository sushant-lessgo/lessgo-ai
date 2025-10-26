/**
 * PostHog API Client for server-side analytics queries
 * Used by cron jobs to fetch event data and aggregate metrics
 */

interface PostHogInsightParams {
  event: string;
  date_from: string;
  date_to: string;
  properties?: Record<string, any>;
}

interface PostHogEvent {
  id: string;
  event: string;
  timestamp: string;
  properties: Record<string, any>;
  person?: {
    id: string;
    distinct_id: string;
  };
}

interface PostHogInsightResult {
  result: Array<{
    data: number[];
    days: string[];
    labels: string[];
  }>;
  events?: PostHogEvent[];
  hasMore?: boolean;
}

interface PageAnalyticsData {
  views: number;
  uniqueVisitors: number;
  submissions: number;
  ctaClicks: number;
  avgTimeOnPage: number | null;
  topReferrers: Record<string, number>;
  topUtmSources: Record<string, number>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  deviceConversions: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

/**
 * Fetch insights from PostHog Insights API
 */
export async function fetchPostHogInsight(
  params: PostHogInsightParams
): Promise<PostHogInsightResult> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

  if (!apiKey) {
    throw new Error('POSTHOG_PERSONAL_API_KEY not configured');
  }

  if (!projectId) {
    throw new Error('NEXT_PUBLIC_POSTHOG_PROJECT_ID not configured');
  }

  const url = `${host}/api/projects/${projectId}/insights/trend/`;

  const body = {
    events: [
      {
        id: params.event,
        name: params.event,
        type: 'events',
        properties: params.properties || {},
      },
    ],
    date_from: params.date_from,
    date_to: params.date_to,
    interval: 'day',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `PostHog API error (${response.status}): ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch PostHog insight:', error);
    throw error;
  }
}

/**
 * Fetch raw events from PostHog Events API
 */
export async function fetchPostHogEvents(
  event: string,
  dateFrom: string,
  dateTo: string,
  properties?: Record<string, any>,
  limit: number = 1000
): Promise<PostHogEvent[]> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

  if (!apiKey || !projectId) {
    throw new Error('PostHog credentials not configured');
  }

  // Build query params
  const params = new URLSearchParams({
    event,
    after: dateFrom,
    before: dateTo,
    limit: limit.toString(),
  });

  // Add property filters if provided
  if (properties) {
    Object.entries(properties).forEach(([key, value]) => {
      params.append(`properties[${key}]`, String(value));
    });
  }

  const url = `${host}/api/projects/${projectId}/events/?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`PostHog Events API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Failed to fetch PostHog events:', error);
    throw error;
  }
}

/**
 * Aggregate page analytics from PostHog events for a specific slug and date
 */
export async function fetchPageAnalytics(
  slug: string,
  dateFrom: string,
  dateTo: string
): Promise<PageAnalyticsData> {
  try {
    // Fetch all event types for this page
    const [viewEvents, exitEvents, submissionEvents, ctaEvents] =
      await Promise.all([
        fetchPostHogEvents('landing_page_view', dateFrom, dateTo, {
          page_slug: slug,
        }),
        fetchPostHogEvents('landing_page_exit', dateFrom, dateTo, {
          page_slug: slug,
        }),
        fetchPostHogEvents('landing_page_form_submit', dateFrom, dateTo, {
          page_slug: slug,
        }),
        fetchPostHogEvents('landing_page_cta_click', dateFrom, dateTo, {
          page_slug: slug,
        }),
      ]);

    // Calculate views
    const views = viewEvents.length;

    // Calculate unique visitors (distinct person IDs)
    const uniquePersonIds = new Set(
      viewEvents
        .map((e) => e.person?.distinct_id)
        .filter((id): id is string => !!id)
    );
    const uniqueVisitors = uniquePersonIds.size;

    // Calculate submissions
    const submissions = submissionEvents.length;

    // Calculate CTA clicks
    const ctaClicks = ctaEvents.length;

    // Calculate average time on page
    let avgTimeOnPage: number | null = null;
    const timeOnPageValues = exitEvents
      .map((e) => e.properties?.time_on_page)
      .filter((t): t is number => typeof t === 'number' && t > 0);

    if (timeOnPageValues.length > 0) {
      const totalTime = timeOnPageValues.reduce((sum, t) => sum + t, 0);
      avgTimeOnPage = Math.round(totalTime / timeOnPageValues.length / 1000); // Convert ms to seconds
    }

    // Aggregate referrers
    const referrers: Record<string, number> = {};
    viewEvents.forEach((e) => {
      const ref = e.properties?.referrer;
      if (ref && typeof ref === 'string') {
        // Clean up referrer (remove protocol, www)
        const cleanRef = ref
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0]; // Take domain only
        referrers[cleanRef] = (referrers[cleanRef] || 0) + 1;
      }
    });

    // Get top 5 referrers
    const topReferrers = Object.fromEntries(
      Object.entries(referrers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    );

    // Aggregate UTM sources
    const utmSources: Record<string, number> = {};
    viewEvents.forEach((e) => {
      const source = e.properties?.utm_source;
      if (source && typeof source === 'string') {
        utmSources[source] = (utmSources[source] || 0) + 1;
      }
    });

    // Get top 5 UTM sources
    const topUtmSources = Object.fromEntries(
      Object.entries(utmSources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    );

    // Device breakdown
    const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
    viewEvents.forEach((e) => {
      const deviceType = e.properties?.$device_type?.toLowerCase();
      if (deviceType === 'desktop') deviceBreakdown.desktop++;
      else if (deviceType === 'mobile') deviceBreakdown.mobile++;
      else if (deviceType === 'tablet') deviceBreakdown.tablet++;
    });

    // Device conversions
    const deviceConversions = { desktop: 0, mobile: 0, tablet: 0 };
    submissionEvents.forEach((e) => {
      const deviceType = e.properties?.$device_type?.toLowerCase();
      if (deviceType === 'desktop') deviceConversions.desktop++;
      else if (deviceType === 'mobile') deviceConversions.mobile++;
      else if (deviceType === 'tablet') deviceConversions.tablet++;
    });

    return {
      views,
      uniqueVisitors,
      submissions,
      ctaClicks,
      avgTimeOnPage,
      topReferrers,
      topUtmSources,
      deviceBreakdown,
      deviceConversions,
    };
  } catch (error) {
    console.error(`Failed to fetch analytics for ${slug}:`, error);
    throw error;
  }
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Unknown error during retry');
}
