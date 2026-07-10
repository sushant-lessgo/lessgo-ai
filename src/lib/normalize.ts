/**
 * The single canonical slugifier (F28). Produces clean URL-safe slugs:
 * NFKD-decomposes accents and strips their combining marks (`Café` → `cafe`),
 * lowercases, replaces every run of non-alphanumerics with ONE hyphen, and
 * trims leading/trailing hyphens. No orphan/repeated hyphens.
 *
 *   "Widget & Co."  → "widget-co"
 *   "Café Crème"    → "cafe-creme"
 *   "A/B Testing"   → "a-b-testing"
 *
 * Also used for cache-key normalization (ensures "Freelancers"/"freelancer"
 * map consistently). Collection/blog/page slugs all derive through this.
 */
export function slugify(str: string): string {
  return str
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalize category and audience for IVOC cache lookup.
 */
export function normalizeIVOCKeys(category: string, audience: string) {
  return {
    categoryKey: slugify(category),
    audienceKey: slugify(audience),
    categoryRaw: category.trim(),
    audienceRaw: audience.trim(),
  };
}
