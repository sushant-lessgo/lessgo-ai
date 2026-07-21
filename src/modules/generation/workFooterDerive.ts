// src/modules/generation/workFooterDerive.ts
// work-contract-wave2 phase 5 — PURE, server-safe footer derivation (generation
// side, beside the stamp family workCollections.ts / workLibrarySync.ts). NO
// `'use client'`, NO react / store / template runtime, NO skeleton import — this
// file only WRITES stored footer content that the WorkFooter core READS, so the
// skeleton ↔ generation firewall stays clean and the dual-renderer divergence
// risk is eliminated (both renderers read the SAME assembly-stamped data).
//
// ── WHY A STAMP, NOT RENDER-TIME DERIVATION ─────────────────────────────────
// The footer columns/contact are DERIVED from the live page list (`fc.pages`) and
// facts, computed ONCE here and stamped INTO the footer block's content behind an
// opt-in marker (`footer_nav_mode:'derived'`). Fresh generations get the marker +
// stored data; existing drafts (Kundius) lack the marker → the core renders
// EXACTLY today's footer — byte-identical, ZERO migration.
//
// ── TWO ENTRY BEHAVIOURS ────────────────────────────────────────────────────
//   first-gen (work.llm.ts runFanOut, after the full page set is assembled) →
//     stampWorkFooterNav(fc, facts)                → ADDS the marker + data.
//   re-stamp (workLibrarySync.resyncWorkContent, on a page-set change) →
//     stampWorkFooterNav(fc, facts, {onlyIfMarked:true}) → refreshes ONLY an
//     already-marked footer (never retroactively marks Kundius/old drafts).

import type { WorkFacts } from '@/lib/schemas/workFacts.schema';

/** The opt-in marker value that switches the footer core to the derived shape. */
export const FOOTER_NAV_MODE_DERIVED = 'derived';

/** Belt: max detail-page links carried into the work column (avoids a huge footer
 *  when a collection has many item pages). Small enough to stay a footer, large
 *  enough that add/remove of a detail page shows up (spec acceptance). */
export const FOOTER_WORK_LINK_CAP = 12;

export interface FooterNavLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterNavColumn {
  id: string;
  heading: string;
  links: FooterNavLink[];
}

export interface FooterContact {
  location?: string;
  reach?: string;
}

/** Stable, deterministic id fragment from a path (so React keys + re-stamps are
 *  stable). Pure — no external slugify dependency (firewall minimalism). */
function pathId(pathSlug: string): string {
  const s = pathSlug.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return s || 'home';
}

/**
 * Derive the footer nav columns from the live page set (`fc.pages`) — the SAME
 * map `stampWorkGalleryBinding` / `resyncWorkContent` read via `hasItemPage`.
 * Two columns, each emitted only when non-empty:
 *   • "Explore" — the site's navigable pages (home + singletons, incl. a
 *     collection INDEX singleton), ordered by page `order`.
 *   • "<collection>" — one link per collection DETAIL page (`kind:'collectionItem'`),
 *     capped at FOOTER_WORK_LINK_CAP. This is what makes columns TRACK a CMS
 *     collection adding/removing detail pages (spec acceptance).
 * Pages with no pathSlug or no title (home falls back to "Home") are skipped.
 */
export function deriveFooterNav(fc: any): FooterNavColumn[] {
  const pagesObj = fc?.pages && typeof fc.pages === 'object' ? fc.pages : {};
  const entries = (Object.values(pagesObj) as any[]).filter(
    (p) => p && typeof p === 'object'
  );
  entries.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const siteLinks: FooterNavLink[] = [];
  const workLinks: FooterNavLink[] = [];
  let workHeading = 'Work';

  for (const p of entries) {
    const pathSlug = typeof p.pathSlug === 'string' ? p.pathSlug.trim() : '';
    if (!pathSlug) continue;
    const title = typeof p.title === 'string' ? p.title.trim() : '';
    const isHome = pathSlug === '/';
    const label = title || (isHome ? 'Home' : '');
    if (!label) continue;

    if (p.kind === 'collectionItem') {
      if (workLinks.length < FOOTER_WORK_LINK_CAP) {
        workLinks.push({ id: `fnl-${pathId(pathSlug)}`, label, href: pathSlug });
      }
    } else {
      // A collection INDEX singleton (has collectionKey) names the work column.
      if (p.collectionKey && title) workHeading = title;
      siteLinks.push({ id: `fnl-${pathId(pathSlug)}`, label, href: pathSlug });
    }
  }

  const cols: FooterNavColumn[] = [];
  if (siteLinks.length) cols.push({ id: 'fc-explore', heading: 'Explore', links: siteLinks });
  if (workLinks.length) cols.push({ id: 'fc-work', heading: workHeading, links: workLinks });
  return cols;
}

/**
 * Derive the footer contact block from facts-sourced data (`identity`). Thin by
 * design — the work facts carry no email/phone (contactMethod is a mechanism, not
 * an address), so the footer contact surfaces the studio's LOCATION + REACH. When
 * both are empty the core falls back gracefully to today's note/copyright render.
 */
export function deriveFooterContact(facts: WorkFacts | null | undefined): FooterContact {
  const id = facts?.identity;
  const out: FooterContact = {};
  const location = typeof id?.location === 'string' ? id.location.trim() : '';
  const reach = typeof id?.reach === 'string' ? id.reach.trim() : '';
  if (location) out.location = location;
  if (reach) out.reach = reach;
  return out;
}

/**
 * Stamp the derived nav columns + contact + the `footer_nav_mode:'derived'` marker
 * into every footer content tree on `fc` (mutates in place, returns nothing):
 *   • the flat home     `fc.content`      (footer-… section),
 *   • every page body   `fc.pages[*].content`,
 *   • the chrome footer  `fc.chrome.footer.data`.
 * These trees SHARE section refs in memory at first-gen (mergePageIntoFinalContent's
 * shallow `fc.content = {...content}`) and DE-ALIAS post-JSON-persist — so stamping
 * all three is idempotent yet guarantees each carries its own marker (goal-CTA
 * precedent).
 *
 * `opts.onlyIfMarked` (re-stamp path): a footer whose marker is NOT already
 * 'derived' is LEFT UNTOUCHED — so Kundius / any un-opted draft stays byte-identical
 * and the derived footer is never retroactively forced onto it.
 */
export function stampWorkFooterNav(
  fc: any,
  facts: WorkFacts | null | undefined,
  opts: { onlyIfMarked?: boolean } = {}
): void {
  if (!fc || typeof fc !== 'object') return;
  const columns = deriveFooterNav(fc);
  const contact = deriveFooterContact(facts);

  const stampElements = (el: Record<string, any>): void => {
    el.footer_nav_mode = FOOTER_NAV_MODE_DERIVED;
    el.nav_columns = columns.map((c) => ({ ...c, links: c.links.map((l) => ({ ...l })) }));
    if (contact.location) el.contact_location = contact.location;
    else delete el.contact_location;
    if (contact.reach) el.contact_reach = contact.reach;
    else delete el.contact_reach;
  };

  const visitFooter = (sec: any): void => {
    if (!sec || typeof sec !== 'object') return;
    const id = sec.id;
    if (typeof id !== 'string' || !id.startsWith('footer-')) return;
    const el = sec.elements;
    if (!el || typeof el !== 'object') return;
    if (opts.onlyIfMarked && el.footer_nav_mode !== FOOTER_NAV_MODE_DERIVED) return;
    stampElements(el);
  };

  const visitTree = (contentMap: any): void => {
    if (!contentMap || typeof contentMap !== 'object') return;
    for (const sec of Object.values(contentMap)) visitFooter(sec);
  };

  visitTree(fc.content);
  const pages = fc.pages && typeof fc.pages === 'object' ? fc.pages : {};
  for (const page of Object.values(pages)) visitTree((page as any)?.content);
  if (fc.chrome?.footer?.data) visitFooter(fc.chrome.footer.data);
}
