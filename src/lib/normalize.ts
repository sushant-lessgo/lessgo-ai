/**
 * Normalize strings for cache key lookups.
 * Ensures "Freelancers" and "freelancer" map to same key.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
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
