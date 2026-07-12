/**
 * footerHygiene — published-output hygiene helpers for template footers.
 *
 * Plain module (NO 'use client'): imported by BOTH the client editor `.tsx`
 * blocks and the server/static `.published.tsx` renderers. Do not add hooks
 * or client-only imports here (published/client boundary rule).
 */

/**
 * Normalize a copyright year adjacent to a © marker to the current year.
 *
 * Range-safe: only replaces a 4-digit year token immediately following a
 * ©/(c)/&copy; marker, and only when that year is NOT immediately followed by
 * a dash or another digit (so a range like `© 2020–2024` is left untouched).
 * Never touches other digits (brand names, addresses, phone numbers).
 *
 * Returns the input unchanged when there is no match, and passes `undefined`
 * straight through.
 */
export function normalizeCopyrightYear(text?: string): string | undefined {
  if (text == null) return text;
  const currentYear = new Date().getFullYear();
  return text.replace(
    /((?:©|\(c\)|&copy;)\s*)((?:19|20)\d{2})(?![\d–—-])/i,
    (_match, marker: string, year: string) =>
      Number(year) === currentYear ? `${marker}${year}` : `${marker}${currentYear}`,
  );
}

/**
 * Filter footer link-columns for published output:
 *   1. Within each column, keep only links whose resolved href is truthy and
 *      not the placeholder `'#'`.
 *   2. Drop any column left with zero links (including columns emptied by
 *      step 1).
 *
 * Does NOT mutate the input (columns/links are spread into new objects).
 *
 * Generic over the caller's own column/link shapes: each template footer has its
 * own `FooterColumn`/`FooterLink` types (some with `href: string | Link`), so the
 * predicate takes the caller's `resolveHref` and the parameter types stay loose.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterFooterColumns<T extends { links?: any }>(
  columns: T[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolveHref: (href?: any) => string | undefined | null,
): T[] {
  return columns
    .map((col) => ({
      ...col,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      links: ((col.links ?? []) as any[]).filter((l: any) => {
        const href = resolveHref(l.href);
        return Boolean(href) && href !== '#';
      }),
    }))
    .filter((col) => col.links.length > 0) as T[];
}
