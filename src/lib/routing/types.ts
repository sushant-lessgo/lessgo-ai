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

/**
 * Redirect config stored in KV under `redirect:{host}:{path}` keys
 * Used to 301 from Lessgo subdomains to attached custom domains
 */
export interface RedirectConfig {
  to: string;            // Absolute URL, e.g. https://mysite.com
  status: number;        // 301 | 302
  createdAt: number;     // Unix timestamp for debugging
}
