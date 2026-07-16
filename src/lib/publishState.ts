/**
 * PublishedPage.publishState predicates (DD0 / DD0b).
 *
 * Plain module — NO `'use client'`. Imported by server components (the /p/[slug]
 * SSR fallbacks), route handlers and (later) dashboard client code alike.
 *
 * The `publishState` machine: `draft → publishing → published | failed`, plus the
 * transient `'unpublishing'` marker written by teardown.
 *
 * Background: `PublishedPage.isPublished` (schema `@default(true)`) has no writer
 * anywhere, so it cannot express "taken down". All serving/slot decisions derive
 * from `publishState` instead; `isPublished` is deprecated-in-place.
 */

/** States that must NOT serve. Everything else serves (fail-open). */
const NON_SERVING_STATES = new Set(['draft', 'unpublishing']);

/**
 * Should a PublishedPage row be served (SSR fallback, sitemap/robots/rss)?
 *
 * FALSE for exactly two states:
 * - `'draft'`       — never published, or taken down by unpublish (DD4 finalize).
 * - `'unpublishing'` — teardown in flight (or stuck); routes are gone, so 404 is honest.
 *
 * TRUE for everything else — deliberately fail-open, because a wrong `false` 404s a
 * live customer site:
 * - `'published'`  — the happy path.
 * - `'publishing'` — a RE-publish passes through this state while the prior version is
 *                    still live; 404ing here would regress the publish happy path.
 * - `'failed'`     — a failed re-publish leaves the previous version serving.
 * - null/undefined/unknown — legacy rows may predate the field; serve.
 */
export function isServingPublishState(state: string | null | undefined): boolean {
  if (!state) return true;
  return !NON_SERVING_STATES.has(state);
}

/**
 * Slot predicate (documented for the plan published-page limit count and the
 * dashboard status pill): a page occupies its publish slot while
 * `publishState !== 'draft'`. A stuck `'unpublishing'` page still holds its slot
 * (and shows as Published, with Unpublish acting as retry) even though SSR already
 * 404s it. Expressed inline as a Prisma predicate at the call sites
 * (`where: { publishState: { not: 'draft' } }`) — kept here as the canonical doc.
 */
export const OCCUPIES_PUBLISH_SLOT_DOC = "publishState !== 'draft'";
