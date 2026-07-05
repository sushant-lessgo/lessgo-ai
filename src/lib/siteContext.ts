// src/lib/siteContext.ts
// Persisted website-scrape context (docs/tracks/newGeneration.md Part 2 — "stop discarding
// what the crawl already paid for"). Global URL-keyed cache (SiteContext table,
// IVOCCache pattern): per-page raw prose + structured extract + confidence-tagged
// facts + VERBATIM excerpts, upserted at scrape time, TTL-gated on read.
//
// Consumers: /api/v2/scrape-website (cache-check + persist) now; the per-page
// copy prompt (buildSiteContextPromptBlock) in Phase 3; future context-file uses
// (SEO landing pages, marketing material, social posts).

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { ScrapedPage } from '@/lib/scrape/fetchSite';

/** Freshness window — a stored scrape older than this is treated as a miss. */
export const SITE_CONTEXT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Hard cap on stored/prompted excerpt length (verbatim, never paraphrased). */
export const EXCERPT_MAX_CHARS = 300;

export interface SiteFact {
  /** One atomic claim, own words. */
  fact: string;
  topic: 'company' | 'product' | 'service' | 'proof' | 'logistics' | 'people' | 'other';
  /** high = literally stated; medium = strongly implied; low = inferred. */
  confidence: 'high' | 'medium' | 'low';
  sourceUrl?: string;
}

export interface SiteExcerpt {
  /** VERBATIM text from the site — never paraphrased. ≤ EXCERPT_MAX_CHARS. */
  text: string;
  kind: 'voice' | 'proof' | 'value-prop' | 'testimonial';
  sourceUrl?: string;
}

export interface StoredSiteContext {
  id: string;
  urlKey: string;
  urlRaw: string;
  audienceType: string;
  pages: ScrapedPage[];
  extract: unknown; // the audience-specific ScrapeWebsiteData payload
  facts: SiteFact[];
  excerpts: SiteExcerpt[];
  scrapedAt: Date;
}

/**
 * Normalize a URL to its cache key: lowercase host, strip www., origin-level
 * (path/query/hash dropped — the crawler always starts from the origin's
 * homepage + sitemap, so two paths on one site share a scrape).
 */
export function normalizeUrlKey(rawUrl: string): string {
  const u = new URL(rawUrl.trim());
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  return host;
}

/** Fresh (within TTL) stored context for a url+audience, or null. */
export async function getFreshSiteContext(
  urlKey: string,
  audienceType: string,
  ttlMs: number = SITE_CONTEXT_TTL_MS
): Promise<StoredSiteContext | null> {
  const row = await prisma.siteContext.findUnique({
    where: { urlKey_audienceType: { urlKey, audienceType } },
  });
  if (!row) return null;
  if (Date.now() - row.scrapedAt.getTime() > ttlMs) {
    logger.dev(`[siteContext] stale (${urlKey}/${audienceType}) — treating as miss`);
    return null;
  }
  return {
    id: row.id,
    urlKey: row.urlKey,
    urlRaw: row.urlRaw,
    audienceType: row.audienceType,
    pages: (row.pages as unknown as ScrapedPage[]) ?? [],
    extract: row.extract,
    facts: (row.facts as unknown as SiteFact[]) ?? [],
    excerpts: (row.excerpts as unknown as SiteExcerpt[]) ?? [],
    scrapedAt: row.scrapedAt,
  };
}

export interface UpsertSiteContextInput {
  urlRaw: string;
  audienceType: string;
  pages: ScrapedPage[];
  extract: unknown;
  facts?: SiteFact[];
  excerpts?: SiteExcerpt[];
  model?: string;
}

/** Upsert (overwrite) the stored context for a url+audience. Never throws — a
 *  persistence failure must not break the scrape response. */
export async function upsertSiteContext(input: UpsertSiteContextInput): Promise<void> {
  const urlKey = normalizeUrlKey(input.urlRaw);
  const facts = input.facts ?? [];
  // Enforce verbatim-excerpt length cap at the storage boundary.
  const excerpts = (input.excerpts ?? []).map((e) => ({
    ...e,
    text: (e.text || '').slice(0, EXCERPT_MAX_CHARS),
  }));
  try {
    await prisma.siteContext.upsert({
      where: { urlKey_audienceType: { urlKey, audienceType: input.audienceType } },
      create: {
        urlKey,
        urlRaw: input.urlRaw,
        audienceType: input.audienceType,
        pages: input.pages as any,
        extract: input.extract as any,
        facts: facts as any,
        excerpts: excerpts as any,
        model: input.model ?? 'gpt-4o-mini',
        scrapedAt: new Date(),
      },
      update: {
        urlRaw: input.urlRaw,
        pages: input.pages as any,
        extract: input.extract as any,
        facts: facts as any,
        excerpts: excerpts as any,
        model: input.model ?? 'gpt-4o-mini',
        scrapedAt: new Date(),
        version: { increment: 1 },
      },
    });
    logger.dev(`[siteContext] upserted ${urlKey}/${input.audienceType} (${input.pages.length} pages, ${facts.length} facts, ${excerpts.length} excerpts)`);
  } catch (e) {
    logger.error('[siteContext] upsert failed (non-fatal):', e as Error);
  }
}

/**
 * Render facts + excerpts as a copy-prompt block (Phase 3). Framing per
 * docs/tracks/newGeneration.md: facts = claim backbone ("draw from, improve on — don't
 * imitate"); excerpts = TONE REFERENCE ONLY, never assertable claims.
 * Returns '' when there is nothing to feed (brand-new business path).
 */
export function buildSiteContextPromptBlock(
  facts: SiteFact[],
  excerpts: SiteExcerpt[]
): string {
  if (!facts.length && !excerpts.length) return '';

  const lines: string[] = ['## EXISTING-SITE CONTEXT (source material — draw from it, improve on it, do NOT imitate it)'];

  if (facts.length) {
    lines.push(
      '',
      'Verified source material from the business\'s existing website. Draw on these for claims:',
      '- Use [high] confidence facts freely.',
      '- Hedge or generalize [medium]/[low] facts — do not sharpen them into precise claims.',
      '',
      ...facts.map((f) => `- [${f.confidence}] (${f.topic}) ${f.fact}`)
    );
  }

  if (excerpts.length) {
    lines.push(
      '',
      'VERBATIM excerpts from their current site — TONE REFERENCE ONLY:',
      '- These show how the founder talks and which real lines land. Improve on them; do NOT paraphrase them into the page.',
      '- NEVER treat an excerpt as an assertable claim unless the same claim appears in the facts list above.',
      '',
      ...excerpts.map((e) => `- (${e.kind}) "${e.text}"`)
    );
  }

  lines.push(
    '',
    'The existing copy may be weak — you are writing BETTER copy for the same real business, not rewriting theirs. The never-fabricate rules still apply.'
  );

  return lines.join('\n');
}
