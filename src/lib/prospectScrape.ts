// src/lib/prospectScrape.ts
// Project-scoped prospect-scrape cache for cold outreach. Mirrors the style of
// src/lib/siteContext.ts (urlKey normalization + scrapedAt/TTL freshness + upsert),
// but is a SEPARATE lib over the ProspectScrape table — NOT SiteContext reuse
// (decision #1): SiteContext is the global, cross-user, sender-side onboarding
// cache; this cache is owned by the user's project (onDelete: Cascade) and stores
// a different extraction shape (prospect-side facts).
//
// NO fetching here — callers scrape with `scrapeSite` from @/lib/scrape/fetchSite
// directly (SSRF guards live in that lib) and then upsert the result. This lib
// never imports scrape internals.

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { ScrapedPage } from '@/lib/scrape/fetchSite';
import type { ProspectExtract } from '@/modules/outreach/prospectExtraction';

/** Freshness window — a stored prospect scrape older than this is a miss. */
export const PROSPECT_SCRAPE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface StoredProspectScrape {
  id: string;
  projectId: string;
  urlKey: string;
  urlRaw: string;
  pages: ScrapedPage[];
  extract: ProspectExtract;
  scrapedAt: Date;
}

/**
 * Normalize a prospect URL to its cache key: lowercase host, strip a leading
 * `www.`, drop path/query/hash (origin-level). Mirrors `normalizeUrlKey` in
 * src/lib/siteContext.ts — the "strip trailing slash" note is subsumed by
 * origin-level keying (host only).
 */
export function normalizeProspectUrlKey(rawUrl: string): string {
  const u = new URL(rawUrl.trim());
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  return host;
}

/** Fresh (within TTL) stored prospect scrape for a project+url, or null. */
export async function getFreshProspectScrape(
  projectId: string,
  urlKey: string,
  ttlMs: number = PROSPECT_SCRAPE_TTL_MS,
): Promise<StoredProspectScrape | null> {
  const row = await prisma.prospectScrape.findUnique({
    where: { projectId_urlKey: { projectId, urlKey } },
  });
  if (!row) return null;
  if (Date.now() - row.scrapedAt.getTime() > ttlMs) {
    logger.dev(`[prospectScrape] stale (${projectId}/${urlKey}) — treating as miss`);
    return null;
  }
  return {
    id: row.id,
    projectId: row.projectId,
    urlKey: row.urlKey,
    urlRaw: row.urlRaw,
    pages: (row.pages as unknown as ScrapedPage[]) ?? [],
    extract: row.extract as unknown as ProspectExtract,
    scrapedAt: row.scrapedAt,
  };
}

export interface UpsertProspectScrapeInput {
  userId: string;
  projectId: string;
  tokenId: string;
  urlRaw: string;
  pages: ScrapedPage[];
  extract: ProspectExtract;
  model?: string;
}

/**
 * Upsert (overwrite) the stored prospect scrape for a project+url. Keyed on
 * `[projectId, urlKey]`; overwrites pages/extract/scrapedAt on the update path.
 * Never throws — a persistence failure must not break the generate response.
 */
export async function upsertProspectScrape(input: UpsertProspectScrapeInput): Promise<void> {
  const urlKey = normalizeProspectUrlKey(input.urlRaw);
  try {
    await prisma.prospectScrape.upsert({
      where: { projectId_urlKey: { projectId: input.projectId, urlKey } },
      create: {
        userId: input.userId,
        projectId: input.projectId,
        tokenId: input.tokenId,
        urlKey,
        urlRaw: input.urlRaw,
        pages: input.pages as any,
        extract: input.extract as any,
        model: input.model ?? 'gpt-4o-mini',
        scrapedAt: new Date(),
      },
      update: {
        urlRaw: input.urlRaw,
        pages: input.pages as any,
        extract: input.extract as any,
        model: input.model ?? 'gpt-4o-mini',
        scrapedAt: new Date(),
      },
    });
    logger.dev(`[prospectScrape] upserted ${input.projectId}/${urlKey} (${input.pages.length} pages)`);
  } catch (e) {
    logger.error('[prospectScrape] upsert failed (non-fatal):', e as Error);
  }
}
