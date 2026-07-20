// src/modules/cms/slug.ts
// CMS slug helpers (docs/task/cms-collections.plan.md phase 1, step 3).
//
// PURE MODULE — zero imports, client + server safe. It is used by the
// /api/collections/* routes (server) AND the authoring UI (client) so a slug
// preview and the stored slug can never disagree. Keep it dependency-free.
//
// Output contract: every non-empty return matches SlugSchema in
// `src/lib/schemas/collection.schema.ts` — `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

/** Fallback when a name slugifies to nothing (e.g. "???" or CJK-only input). */
export const SLUG_FALLBACK = 'untitled';

/** Hard cap so slugs stay URL-friendly and fit SlugSchema's max(80). */
export const SLUG_MAX_LENGTH = 60;

/**
 * SEO-friendly slug from a human name: lowercase, diacritics folded to ASCII,
 * every other run of non-alphanumerics collapsed to a single hyphen, trimmed.
 * Never returns an empty string — falls back to SLUG_FALLBACK.
 */
export function slugifyName(name: string): string {
  const ascii = (name ?? '')
    .normalize('NFKD')
    // strip combining marks left behind by NFKD (e-acute -> e)
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');

  const slug = ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    // slicing can leave a trailing hyphen
    .replace(/-+$/g, '');

  return slug || SLUG_FALLBACK;
}

/**
 * First slug in the `base`, `base-2`, `base-3`… series that is not in `taken`.
 * Comparison is exact-string (slugs are already normalized).
 *
 * The numeric suffix is clamped at SUFFIX_CLAMP; past that (practically
 * unreachable — it needs 1000 colliding slugs) it falls back to a base36 time
 * suffix rather than looping forever.
 */
const SUFFIX_CLAMP = 999;

export function uniqueSlug(base: string, taken: readonly string[] = []): string {
  const root = slugifyName(base);
  const used = new Set(taken);
  if (!used.has(root)) return root;

  // Reserve room for the "-NNN" suffix so the result still fits the cap.
  const trimmed = root.slice(0, SLUG_MAX_LENGTH - 4).replace(/-+$/g, '') || SLUG_FALLBACK;

  for (let n = 2; n <= SUFFIX_CLAMP; n++) {
    const candidate = `${trimmed}-${n}`;
    if (!used.has(candidate)) return candidate;
  }

  return `${trimmed}-${Date.now().toString(36)}`;
}
