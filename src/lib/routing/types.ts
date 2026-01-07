/**
 * Route configuration stored in KV
 * Maps {host}:{path} → blob location
 * CRITICAL: Includes blobUrl to avoid head() API call per request
 */
export interface RouteConfig {
  pageId: string;        // PublishedPage.id (source of truth)
  version: string;       // timestamp-nanoid
  blobUrl: string;       // Direct Vercel Blob CDN URL (immutable)
  publishedAt: number;   // Unix timestamp for debugging
}
