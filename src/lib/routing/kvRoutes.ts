import { kv } from '@vercel/kv';
import type { RouteConfig, RedirectConfig } from './types';

/**
 * Get route config by route key (Edge-compatible)
 * Uses direct REST API instead of @vercel/kv package
 * @param routeKey - Format: "route:{host}:{path}"
 * @returns RouteConfig with blobUrl or null
 */
export async function getRouteByKeyEdge(
  routeKey: string
): Promise<RouteConfig | null> {
  try {
    const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(routeKey)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error('[KV Edge] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.result) return null;

    // Upstash REST API returns JSON string, need to parse
    const route = typeof data.result === 'string'
      ? JSON.parse(data.result)
      : data.result;
    return route as RouteConfig;
  } catch (error) {
    console.error('[KV Edge] getRouteByKeyEdge error:', error);
    return null;
  }
}

/**
 * Get route config by route key (used by blob proxy)
 * @deprecated Use getRouteByKeyEdge() for Edge runtime
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
 * Get route configuration for domain + path (Edge-compatible)
 * Uses direct REST API instead of @vercel/kv package
 * Used by middleware to check if route exists
 * @returns route key string if found, null otherwise
 */
export async function getRouteEdge(
  domain: string,
  path: string = '/'
): Promise<string | null> {
  const routeKey = `route:${domain}:${path}`;

  try {
    const url = `${process.env.KV_REST_API_URL}/exists/${encodeURIComponent(routeKey)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error('[KV Edge] HTTP error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.result > 0 ? routeKey : null;
  } catch (error) {
    console.error('[KV Edge] getRouteEdge error:', error);
    return null; // Graceful fallback to SSR
  }
}

/**
 * Get route configuration for domain + path
 * @deprecated Use getRouteEdge() for Edge runtime
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
 * @param domains - List of domains (e.g., ['{slug}.lessgo.site', '{slug}.lessgo.ai'])
 * @param version - Version ID from blobUploader
 * @param blobUrl - Direct CDN URL from Vercel Blob (CRITICAL: not blobKey)
 */
export async function atomicPublish(
  pageId: string,
  domains: string[],
  version: string,
  blobUrl: string,
  extraRoutes: Record<string, string> = {}
): Promise<void> {
  const publishedAt = Date.now();

  try {
    // Root ('/') + any subpaths. Each path gets its own blobUrl, same version.
    const pathBlobs: Record<string, string> = { '/': blobUrl, ...extraRoutes };

    // Use pipeline for atomicity
    const pipeline = kv.pipeline();

    // Update all domain routes for every path (root + subpages)
    for (const domain of domains) {
      for (const [path, url] of Object.entries(pathBlobs)) {
        const routeKey = `route:${domain}:${path}`;
        const routeConfig: RouteConfig = { pageId, version, blobUrl: url, publishedAt };
        pipeline.set(routeKey, routeConfig, { ex: 365 * 24 * 60 * 60 });
      }
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
 * Blog (Phase 1): incremental single-path route writes/deletes.
 * Unlike atomicPublish (which always rewrites root '/'), these touch ONLY the
 * given host+path keys — used for per-post publish/unpublish of /blog routes.
 */
export async function setRoutes(
  entries: Array<{ host: string; path: string; config: RouteConfig }>
): Promise<void> {
  if (entries.length === 0) return;
  try {
    const pipeline = kv.pipeline();
    for (const { host, path, config } of entries) {
      pipeline.set(`route:${host}:${path}`, config, { ex: 365 * 24 * 60 * 60 });
    }
    await pipeline.exec();
  } catch (error) {
    console.error('[KV] setRoutes failed:', error);
    throw new Error(`KV setRoutes failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteRoutes(keys: Array<{ host: string; path: string }>): Promise<void> {
  if (keys.length === 0) return;
  try {
    const pipeline = kv.pipeline();
    for (const { host, path } of keys) {
      pipeline.del(`route:${host}:${path}`);
    }
    await pipeline.exec();
  } catch (error) {
    console.error('[KV] deleteRoutes failed:', error);
    throw new Error(`KV deleteRoutes failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  options: { maxRetries?: number; baseDelay?: number; extraRoutes?: Record<string, string> } = {}
): Promise<{ attempts: number; verified: boolean }> {
  const { maxRetries = 3, baseDelay = 1000, extraRoutes = {} } = options;
  // Root + subpaths; verification checks every path's blobUrl.
  const pathBlobs: Record<string, string> = { '/': blobUrl, ...extraRoutes };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Log attempt
      console.log(`[KV] Publish attempt ${attempt}/${maxRetries}:`, {
        pageId,
        domains,
        version,
      });

      // Attempt publish (root + subpaths)
      await atomicPublish(pageId, domains, version, blobUrl, extraRoutes);

      // Verify the write succeeded (every domain × every path)
      console.log('[KV] Verifying write...');
      let allVerified = true;
      const verificationErrors: string[] = [];

      for (const domain of domains) {
        for (const [path, url] of Object.entries(pathBlobs)) {
          const routeKey = `route:${domain}:${path}`;
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
          } else if (stored.blobUrl !== url) {
            allVerified = false;
            verificationErrors.push(`${routeKey}: blobUrl mismatch`);
          }
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

/**
 * Get redirect config for host + path (Edge-compatible)
 * v1: only root path ('/') redirects supported; returns null for non-root
 */
export async function getRedirectEdge(
  host: string,
  path: string = '/'
): Promise<RedirectConfig | null> {
  if (path !== '/') return null;
  const key = `redirect:${host}:${path}`;
  try {
    const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.result) return null;
    const cfg = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    return cfg as RedirectConfig;
  } catch (error) {
    console.error('[KV Edge] getRedirectEdge error:', error);
    return null;
  }
}

/**
 * Write a redirect entry (e.g. subdomain -> custom domain)
 * TTL: 365 days (matches route entries)
 */
export async function writeRedirect(
  fromHost: string,
  toUrl: string,
  status: 301 | 302 = 301
): Promise<void> {
  const key = `redirect:${fromHost}:/`;
  const cfg: RedirectConfig = { to: toUrl, status, createdAt: Date.now() };
  await kv.set(key, cfg, { ex: 365 * 24 * 60 * 60 });
}

/**
 * Remove redirect entry
 */
export async function removeRedirect(fromHost: string): Promise<void> {
  await kv.del(`redirect:${fromHost}:/`);
}

/**
 * Cleanup all KV routing entries for given hosts (root path only in v1)
 * Deletes route, redirect, and slug-for keys for each host
 */
export async function removeRoutes(hosts: string[]): Promise<void> {
  if (!hosts.length) return;
  const pipeline = kv.pipeline();
  for (const host of hosts) {
    pipeline.del(`route:${host}:/`);
    pipeline.del(`redirect:${host}:/`);
    pipeline.del(`slug-for:${host}`);
  }
  await pipeline.exec();
}

/**
 * Map custom host → slug for SSR fallback when static blob is missing.
 * Middleware Branch B reads this to rewrite to /p/{slug}, mirroring Branch A fallback.
 */
export async function writeSlugForHost(host: string, slug: string): Promise<void> {
  await kv.set(`slug-for:${host}`, slug, { ex: 365 * 24 * 60 * 60 });
}

export async function removeSlugForHost(host: string): Promise<void> {
  await kv.del(`slug-for:${host}`);
}

/**
 * Edge-compatible slug lookup for a custom host
 */
export async function getSlugForHostEdge(host: string): Promise<string | null> {
  const key = `slug-for:${host}`;
  try {
    const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.result) return null;
    const slug = typeof data.result === 'string'
      ? (data.result.startsWith('"') ? JSON.parse(data.result) : data.result)
      : data.result;
    return typeof slug === 'string' ? slug : null;
  } catch (error) {
    console.error('[KV Edge] getSlugForHostEdge error:', error);
    return null;
  }
}
