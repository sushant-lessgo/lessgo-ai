// proof-truth phase 3: confirm-time auto-import of scraped verbatim testimonials.
//
// Plain prisma-backed module — NO template/resolver/client imports (firewall-safe:
// importable from the brief/confirm route whose header declares a pure
// "@/modules/brief + prisma" firewall).
//
// Called ONCE per project, server-side, at Brief confirm (the single pre-generation
// entry point) — see docs/task/proof-truth.plan.md phase 3. The confirm request is
// single-flight (one user click), so app-level read-then-write dedup is sufficient;
// no unique index / migration.
//
// Dark-flag decision (human gate CLEARED 2026-07-10): rows are WRITTEN while
// TESTIMONIALS_ENABLED is off. The repo layer has no flag gate; all HTTP readers 404
// while dark, so rows stay invisible until the flag flips. Gating the write would
// silently discard the user's own scraped quotes. Rows are the user's own site
// content (source:'imported', status:'approved'), so accumulation is safe.
//
// Author-field note: entry facts carry BARE quote strings (no author). Rows are stored
// with blank author fields — the same shape the wizard hydrates importedTestimonials
// with (author_name:'') and injectRealTestimonials tolerates. Deviation from the plan's
// "create via createTestimonial()": that repo helper hard-rejects a blank authorName
// (repo.ts) — writing a placeholder author would fabricate attribution, exactly the
// fake-proof this feature exists to prevent. So we insert via prisma directly to keep
// the author truly blank; source/status are hardcoded to the repo's valid values.

import { prisma } from '@/lib/prisma';
import { listTestimonialsByOwner, type TestimonialStatus, type TestimonialSource } from './repo';
import type { Testimonial } from '@prisma/client';

const IMPORTED_SOURCE: TestimonialSource = 'imported';
const APPROVED_STATUS: TestimonialStatus = 'approved';

// Dedup key normalization: trim + collapse internal whitespace + lowercase.
export function normalizeQuote(quote: string): string {
  return quote.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Import scraped verbatim quotes as durable, project-scoped Testimonial rows.
 *
 * - Reads existing rows for (userId, projectId), skips normalized-quote duplicates
 *   (idempotent: re-confirm / re-generation creates zero new rows).
 * - Skips blank/whitespace-only quotes.
 * - Creates the rest as source:'imported', status:'approved', blank author fields.
 * - Returns the full table-backed APPROVED set for the project (existing approved + new).
 *
 * The ONLY input is scraped verbatim quote strings (brief.facts.entry.testimonials) —
 * never parsed AI output, never wizard free-text. No invented rows are ever written.
 */
export async function importScrapedTestimonials(
  userId: string,
  projectId: string,
  quotes: string[],
): Promise<Testimonial[]> {
  if (!userId) throw new Error('importScrapedTestimonials requires userId');
  if (!projectId) throw new Error('importScrapedTestimonials requires projectId');

  const existing = await listTestimonialsByOwner(userId, { projectId });
  const seen = new Set(existing.map((t) => normalizeQuote(t.quote)));

  const created: Testimonial[] = [];
  for (const raw of quotes ?? []) {
    if (typeof raw !== 'string') continue;
    const quote = raw.trim();
    if (!quote) continue;
    const key = normalizeQuote(quote);
    if (seen.has(key)) continue; // dedup vs existing + earlier-in-batch
    seen.add(key);

    const row = await prisma.testimonial.create({
      data: {
        userId,
        projectId,
        authorName: '',
        authorRole: null,
        authorCompany: null,
        authorPhotoUrl: null,
        quote,
        rating: null,
        videoUrl: null,
        status: APPROVED_STATUS,
        source: IMPORTED_SOURCE,
        collectToken: null,
      },
    });
    created.push(row);
  }

  const approvedExisting = existing.filter((t) => t.status === APPROVED_STATUS);
  return [...approvedExisting, ...created];
}
