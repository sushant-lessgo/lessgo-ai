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

/**
 * Sleep helper for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Publish with retry logic and verification
 * Attempts up to 3 times with exponential backoff
 * Verifies KV entry after each attempt
 * @throws Error if all attempts fail
 */
export async function atomicPublishWithRetry(
  pageId: string,
  domains: string[],
  version: string,
  blobUrl: string,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<{ attempts: number; verified: boolean }> {
  const { maxRetries = 3, baseDelay = 1000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Log attempt
      console.log(`[KV] Publish attempt ${attempt}/${maxRetries}:`, {
        pageId,
        domains,
        version,
      });

      // Attempt publish
      await atomicPublish(pageId, domains, version, blobUrl);

      // Verify the write succeeded
      console.log('[KV] Verifying write...');
      let allVerified = true;
      const verificationErrors: string[] = [];

      for (const domain of domains) {
        const routeKey = `route:${domain}:/`;
        const stored = await kv.get<RouteConfig>(routeKey);

        if (!stored) {
          allVerified = false;
          verificationErrors.push(`${routeKey}: entry not found`);
        } else if (stored.pageId !== pageId) {
          allVerified = false;
          verificationErrors.push(
            `${routeKey}: pageId mismatch (expected ${pageId}, got ${stored.pageId})`
          );
        } else if (stored.version !== version) {
          allVerified = false;
          verificationErrors.push(
            `${routeKey}: version mismatch (expected ${version}, got ${stored.version})`
          );
        } else if (stored.blobUrl !== blobUrl) {
          allVerified = false;
          verificationErrors.push(
            `${routeKey}: blobUrl mismatch`
          );
        }
      }

      if (allVerified) {
        console.log(`[KV] ✓ Publish verified successfully on attempt ${attempt}`);
        return { attempts: attempt, verified: true };
      } else {
        throw new Error(
          `KV verification failed: ${verificationErrors.join(', ')}`
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(`[KV] Attempt ${attempt}/${maxRetries} failed:`, {
        error: lastError.message,
        pageId,
        domains,
      });

      // If not the last attempt, wait with exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[KV] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All attempts failed
  const errorMessage = `KV publish failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error('[KV] All retry attempts exhausted:', {
    pageId,
    domains,
    version,
    lastError: lastError?.message,
  });

  throw new Error(errorMessage);
}
