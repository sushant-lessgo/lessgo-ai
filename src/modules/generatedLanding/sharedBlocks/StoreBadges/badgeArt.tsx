// Shared StoreBadges layout + inline-SVG badge art. PLAIN module — NO 'use
// client', no hooks — so it can be imported by BOTH the edit twin
// (StoreBadges.tsx) and the server-safe published twin
// (StoreBadges.published.tsx) without dragging client code into the
// static-markup path (dual-renderer firewall). Mirrors the LeadForm
// leadFormFields split: self-contained styles + a single-source layout core so
// both renderers emit byte-identical structure/classes. TEMPLATE-AGNOSTIC:
// styled via self-contained CSS (the badges are dark by design) so the row
// renders correctly on every template.
//
// The badge art is inline "official-style" SVG (Google Play / App Store) — no
// public/ asset, no buildAssets change, no cross-origin fetch in exported HTML.

import React from 'react';

export const STORE_BADGES_DEFAULT_LABEL = 'Get the app';

/** Which store a resolved link points at (URL host sniff). */
export type BadgeKind = 'appstore' | 'playstore';

/** A resolved badge: which store + the outbound URL. */
export interface ResolvedBadge {
  kind: BadgeKind;
  url: string;
}

/**
 * Host-sniff a store URL → BadgeKind. play.google.com → Play, apps.apple.com →
 * App Store (itunes.apple.com tolerated). Unknown host → null (skipped).
 * Plain string parsing (no `URL` needed) so it is deterministic + SSR-safe.
 */
export function badgeKindForUrl(url: string | undefined): BadgeKind | null {
  if (!url || typeof url !== 'string') return null;
  const u = url.toLowerCase();
  if (u.includes('play.google.com')) return 'playstore';
  if (u.includes('apps.apple.com') || u.includes('itunes.apple.com')) return 'appstore';
  return null;
}

/**
 * Build the ordered badge list from the section's two URL elements. App Store
 * first, then Google Play (deterministic, identical in both twins). Empty URLs
 * are skipped, so one link → one badge, two links → two badges.
 */
export function resolveBadges(elements: {
  appstore_url?: string;
  playstore_url?: string;
}): ResolvedBadge[] {
  const out: ResolvedBadge[] = [];
  const appstore = (elements.appstore_url || '').trim();
  const playstore = (elements.playstore_url || '').trim();
  if (appstore) out.push({ kind: 'appstore', url: appstore });
  if (playstore) out.push({ kind: 'playstore', url: playstore });
  return out;
}

/** Self-contained styles injected once per block (mirrors LeadForm's approach —
 *  no dependency on public/published.css so it works in any template). */
export const STORE_BADGES_STYLES = `
.lg-badges{width:100%;}
.lg-badges-pad{padding:clamp(40px,6vw,72px) 20px;}
.lg-badges__inner{max-width:720px;margin:0 auto;text-align:center;}
.lg-badges__h{font-family:var(--font-display,inherit);font-size:clamp(20px,3.4vw,28px);line-height:1.2;margin:0 0 20px;color:inherit;font-weight:700;}
.lg-badges__row{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;}
.lg-badge{display:inline-flex;text-decoration:none;line-height:0;border-radius:9px;transition:opacity .15s ease;}
.lg-badge:hover{opacity:.85;}
.lg-badge svg{display:block;height:52px;width:auto;}
`;

/** Google Play "GET IT ON" badge — inline SVG, official-style. */
export function PlayBadgeArt() {
  return (
    <svg viewBox="0 0 135 40" role="img" aria-label="Get it on Google Play" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="134" height="39" rx="6" fill="#000000" stroke="#A6A6A6" strokeWidth="0.5" />
      <g transform="translate(10 9.5)">
        <path d="M0 0.4C0 0.16 0.1 0 0.28 0L9.9 10.5 0.28 21C0.1 20.84 0 20.68 0 20.44Z" fill="#00A0FF" />
        <path d="M13.4 14L9.9 10.5 0.28 0C0.4 0 0.55 0.05 0.72 0.15L13.4 7.4Z" fill="#00E676" />
        <path d="M13.4 7.4L0.72 0.15 13.4 14 17.1 11.9C18.2 11.3 18.2 9.9 17.1 9.3Z" fill="#FFCE00" />
        <path d="M13.4 14L0.72 20.85C0.55 20.95 0.4 21 0.28 21L9.9 10.5Z" fill="#FF3A44" />
      </g>
      <text x="41" y="15" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontSize="6.5">GET IT ON</text>
      <text x="41" y="30" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontSize="15" fontWeight="600">Google Play</text>
    </svg>
  );
}

/** App Store "Download on the" badge — inline SVG, official-style. */
export function AppStoreBadgeArt() {
  return (
    <svg viewBox="0 0 135 40" role="img" aria-label="Download on the App Store" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="134" height="39" rx="6" fill="#000000" stroke="#A6A6A6" strokeWidth="0.5" />
      <path
        d="M25.6 20.3c-.02-1.9 1.55-2.82 1.62-2.87-.88-1.3-2.26-1.47-2.75-1.49-1.17-.12-2.28.69-2.87.69-.59 0-1.5-.67-2.47-.65-1.27.02-2.44.74-3.09 1.87-1.32 2.29-.34 5.68.94 7.54.63.91 1.38 1.93 2.36 1.9.95-.04 1.3-.61 2.45-.61 1.14 0 1.47.61 2.47.59 1.02-.02 1.66-.93 2.28-1.85.72-1.06 1.02-2.09 1.03-2.14-.02-.01-1.97-.76-1.99-3.02zm-1.9-5.55c.52-.63.87-1.51.77-2.39-.75.03-1.66.5-2.19 1.12-.48.55-.9 1.44-.79 2.29.84.06 1.69-.42 2.21-1.02z"
        fill="#FFFFFF"
      />
      <text x="35" y="16" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontSize="6.5">Download on the</text>
      <text x="35" y="31" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontSize="15" fontWeight="600">App Store</text>
    </svg>
  );
}

/** The SVG art for a badge kind (shared by both twins → byte-identical). */
export function badgeArt(kind: BadgeKind) {
  return kind === 'playstore' ? <PlayBadgeArt /> : <AppStoreBadgeArt />;
}

/**
 * SINGLE-SOURCE store-badges layout. The heading and the badge anchors arrive
 * as prebuilt nodes from each wrapper (edit = editable heading + inert anchors,
 * published = static heading + beacon-tagged anchors), so both renderers emit
 * byte-identical section structure/classes. Self-sets `data-surface="neutral"`
 * (shared blocks never call getSurfaceForSection).
 */
export function StoreBadgesCore({
  headingSlot,
  badgeNodes,
}: {
  headingSlot: React.ReactNode;
  badgeNodes: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STORE_BADGES_STYLES }} />
      <section className="lg-badges lg-badges-pad" data-surface="neutral">
        <div className="lg-badges__inner">
          {headingSlot}
          <div className="lg-badges__row">{badgeNodes}</div>
        </div>
      </section>
    </>
  );
}

export default StoreBadgesCore;
