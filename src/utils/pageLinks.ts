// src/utils/pageLinks.ts
// Build "link to another page" options from the project's pages (Phase 2,
// cross-page linking). Value is the target page's pathSlug ('/contact'), which
// works natively in published HTML — middleware routes it; no rewriting needed.

import type { ProjectPageEntry } from '@/types/store';
import type { Link } from '@/types/destination';

export interface PageLinkOption {
  value: string; // pathSlug, e.g. '/contact'
  label: string; // page title, e.g. 'Contact'
}

export function buildPageLinkOptions(
  pages: Record<string, ProjectPageEntry> | undefined,
): PageLinkOption[] {
  if (!pages) return [];
  return Object.values(pages)
    .filter((p) => p && p.pathSlug)
    .sort((a, b) => {
      if (a.pathSlug === '/') return -1;
      if (b.pathSlug === '/') return 1;
      return a.order - b.order;
    })
    .map((p) => ({
      value: p.pathSlug,
      label: p.pathSlug === '/' ? p.title || 'Home' : p.title || p.pathSlug,
    }));
}

/** A nav item derived from the sitemap. `href` is a derived Link (page dest). */
export interface DerivedNavItem {
  id: string;
  label: string;
  href: Link;
}

/**
 * scale-04 (phase 6): build nav items from the project's sitemap. Each page
 * becomes a derived `Link` (page destination, `source: 'derived'`) so it is
 * explicitly a sitemap-derived link — never goal-referencing, never moved by a
 * goal change. Headers use this ONLY to SEED an empty nav (see the seed effect
 * in each nav header); it is not a live sync — hand-edited navs are untouched.
 */
export function deriveNavLinks(
  pages: Record<string, ProjectPageEntry> | undefined,
): DerivedNavItem[] {
  return buildPageLinkOptions(pages).map((opt) => {
    const slug = opt.value.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    return {
      id: `nav-page-${slug || 'home'}`,
      label: opt.label,
      href: { dest: { kind: 'page', pathSlug: opt.value }, source: 'derived' },
    };
  });
}
