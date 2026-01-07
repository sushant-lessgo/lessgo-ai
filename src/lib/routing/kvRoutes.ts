import { kv } from '@vercel/kv';
import type { RouteConfig } from './types';

/**
 * Get route config by route key (used by blob proxy)
 * @param routeKey - Format: "route:{host}:{path}"
 * @returns RouteConfig with blobUrl or null
 */
export async function getRouteByKey(
  routeKey: string
): Promise<RouteConfig | null> {
  try {
    const route = await kv.get<RouteConfig>(routeKey);
    return route;
  } catch (error) {
    console.error('[KV] getRouteByKey error:', { routeKey, error });
    return null;
  }
}

/**
 * Get route configuration for domain + path
 * Used by middleware to check if route exists
 * @returns route key string if found, null otherwise
 */
export async function getRoute(
  domain: string,
  path: string = '/'
): Promise<string | null> {
  try {
    const routeKey = `route:${domain}:${path}`;
    const exists = await kv.exists(routeKey);
    return exists ? routeKey : null;
  } catch (error) {
    console.error('[KV] getRoute error:', { domain, path, error });
    return null; // Graceful fallback to SSR
  }
}

/**
 * Atomic publish operation
 * Updates KV routing for all domains
 * @param pageId - PublishedPage.id from database
 * @param domains - List of domains (e.g., ['{slug}.lessgo.ai'])
 * @param version - Version ID from blobUploader
 * @param blobUrl - Direct CDN URL from Vercel Blob (CRITICAL: not blobKey)
 */
export async function atomicPublish(
  pageId: string,
  domains: string[],
  version: string,
  blobUrl: string
): Promise<void> {
  const publishedAt = Date.now();

  try {
    const routeConfig: RouteConfig = {
      pageId,
      version,
      blobUrl,       // Store CDN URL, not key
      publishedAt,
    };

    // Use pipeline for atomicity
    const pipeline = kv.pipeline();

    // Update all domain routes (only root path for Phase 3)
    for (const domain of domains) {
      const routeKey = `route:${domain}:/`;
      pipeline.set(routeKey, routeConfig, { ex: 365 * 24 * 60 * 60 });
    }

    // Execute pipeline
    await pipeline.exec();

    // Minimal logging (only in dev or 1% sample in prod)
    if (process.env.NODE_ENV === 'development') {
      console.log('[KV] Atomic publish:', {
        pageId,
        version,
        routesUpdated: domains.length,
      });
    }
  } catch (error) {
    console.error('[KV] Atomic publish failed:', error);
    throw new Error(`KV publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
