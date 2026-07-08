// Shared FollowStrip layout + inline-SVG social icons. PLAIN module — NO 'use
// client', no hooks — so it can be imported by BOTH the edit twin
// (FollowStrip.tsx) and the server-safe published twin
// (FollowStrip.published.tsx) without dragging client code into the
// static-markup path (dual-renderer firewall). Mirrors the StoreBadges
// badgeArt split: self-contained styles + a single-source layout core so both
// renderers emit byte-identical structure/classes. TEMPLATE-AGNOSTIC: icons use
// `currentColor` and the row self-sets `data-surface="neutral"`, so it inherits
// template text tokens on every template.
//
// The icon art is inline SVG (no public/ asset, no buildAssets change, no
// cross-origin fetch in exported HTML). Platform keys match `inferPlatform`
// (src/modules/goals/goalToDestination.ts) — the ONE shared platform inferer.

import React from 'react';

export const FOLLOW_STRIP_DEFAULT_HEADING = 'Follow along';

/** A resolved social profile: platform label (from inferPlatform) + URL. */
export interface FollowProfile {
  platform: string;
  url: string;
}

/**
 * Parse the materialized `links_json` element (a JSON-string array of
 * {platform,url}) into a clean profile list. Deterministic + SSR-safe: bad JSON
 * or non-array input → []. Entries without a URL are dropped.
 */
export function resolveProfiles(linksJson: string | undefined | null): FollowProfile[] {
  if (!linksJson || typeof linksJson !== 'string') return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(linksJson);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: FollowProfile[] = [];
  for (const raw of parsed) {
    if (!raw || typeof raw !== 'object') continue;
    const url = String((raw as any).url ?? '').trim();
    if (!url) continue;
    const platform = String((raw as any).platform ?? '').trim().toLowerCase() || 'website';
    out.push({ platform, url });
  }
  return out;
}

/** Self-contained styles injected once per block (mirrors StoreBadges — no
 *  dependency on public/published.css so it works in any template). */
export const FOLLOW_STRIP_STYLES = `
.lg-follow{width:100%;}
.lg-follow-pad{padding:clamp(40px,6vw,72px) 20px;}
.lg-follow__inner{max-width:720px;margin:0 auto;text-align:center;}
.lg-follow__h{font-family:var(--font-display,inherit);font-size:clamp(20px,3.4vw,28px);line-height:1.2;margin:0 0 20px;color:inherit;font-weight:700;}
.lg-follow__row{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:center;}
.lg-follow__link{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;color:inherit;text-decoration:none;border:1px solid color-mix(in srgb, currentColor 22%, transparent);transition:opacity .15s ease,transform .15s ease;}
.lg-follow__link:hover{opacity:.75;transform:translateY(-1px);}
.lg-follow__link svg{display:block;width:22px;height:22px;fill:currentColor;}
`;

type IconFn = () => React.ReactElement;

// ─── Inline SVG icons (fill=currentColor, 24x24 viewBox) ───

const InstagramIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.17-.42-.37-1.06-.42-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.51.01-4.75.07-.9.04-1.38.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.33-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.04.9.19 1.38.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.33.13.81.28 1.71.32 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c.9-.04 1.38-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.33.28-.81.32-1.71.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.04-.9-.19-1.38-.32-1.71-.17-.43-.37-.74-.69-1.06-.32-.32-.63-.52-1.06-.69-.33-.13-.81-.28-1.71-.32C15.51 4.01 15.14 4 12 4Zm0 3.06A4.94 4.94 0 1 1 7.06 12 4.94 4.94 0 0 1 12 7.06Zm0 8.15A3.21 3.21 0 1 0 8.79 12 3.21 3.21 0 0 0 12 15.21Zm6.29-8.35a1.15 1.15 0 1 1-1.15-1.15 1.15 1.15 0 0 1 1.15 1.15Z" />
  </svg>
);

const FacebookIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);

const TwitterIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
  </svg>
);

const LinkedinIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.55V9h3.57v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
  </svg>
);

const YoutubeIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81ZM9.6 15.6V8.4l6.24 3.6L9.6 15.6Z" />
  </svg>
);

const TiktokIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.3v13.03a2.4 2.4 0 0 1-2.4 2.36 2.4 2.4 0 1 1 .7-4.7v-3.36a5.72 5.72 0 0 0-.7-.05 5.73 5.73 0 1 0 5.73 5.73V8.9a7.53 7.53 0 0 0 4.4 1.41V7a4.29 4.29 0 0 1-3.37-1.18Z" />
  </svg>
);

const ThreadsIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.3 11.2c-.1-.05-.2-.1-.3-.14-.18-3.24-1.95-5.1-4.92-5.12h-.04c-1.78 0-3.26.76-4.17 2.14l1.64 1.12c.68-1.03 1.75-1.25 2.53-1.25h.03c.97.01 1.7.29 2.17.84.34.4.57.94.68 1.63-.85-.14-1.77-.19-2.75-.13-2.76.16-4.53 1.77-4.41 4 .06 1.14.63 2.11 1.6 2.74.82.53 1.87.79 2.97.73 1.45-.08 2.59-.63 3.38-1.65.6-.77.98-1.77 1.15-3.03.68.41 1.19.96 1.47 1.61.47 1.12.5 2.95-1 4.45-1.31 1.31-2.89 1.88-5.27 1.9-2.64-.02-4.64-.87-5.94-2.52C4.6 17.5 4 15.6 3.98 12.99c.02-2.6.62-4.5 1.8-5.65 1.3-1.65 3.3-2.5 5.94-2.52 2.66.02 4.68.88 6.02 2.53.66.81 1.16 1.83 1.48 3.02l1.98-.53c-.4-1.47-1.03-2.75-1.9-3.82C17.55 3.5 15.03 2.4 11.73 2.38h-.01c-3.3.02-5.79 1.12-7.42 3.28C2.86 7.6 2.13 10 2.1 12.98v.02c.03 2.98.76 5.38 2.19 7.32 1.63 2.16 4.12 3.26 7.42 3.28h.01c2.93-.02 5-.79 6.7-2.49 2.23-2.22 2.16-5.01 1.43-6.72-.53-1.23-1.54-2.23-2.93-2.9l-.62-.29Zm-4.86 5.4c-1.22.07-2.48-.48-2.55-1.67-.05-.88.63-1.87 2.62-1.98.23-.02.45-.02.67-.02.72 0 1.4.07 2 .2-.23 2.8-1.55 3.4-2.74 3.47Z" />
  </svg>
);

const PinterestIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.62 11.17-.11-.95-.2-2.4.04-3.44.22-.93 1.4-5.94 1.4-5.94s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4-.28 1.2.6 2.17 1.78 2.17 2.14 0 3.78-2.25 3.78-5.5 0-2.88-2.07-4.89-5.02-4.89-3.42 0-5.42 2.56-5.42 5.21 0 1.03.4 2.14.89 2.74.1.12.11.22.08.34l-.33 1.35c-.05.22-.17.27-.4.16-1.49-.69-2.42-2.87-2.42-4.62 0-3.76 2.73-7.22 7.88-7.22 4.14 0 7.35 2.95 7.35 6.89 0 4.11-2.59 7.42-6.19 7.42-1.21 0-2.35-.63-2.74-1.37l-.75 2.84c-.27 1.04-1 2.35-1.49 3.15C9.57 23.81 10.76 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0Z" />
  </svg>
);

const TelegramIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.91 3.79 20.3 20.84c-.25 1.21-.98 1.5-2 .94l-5.5-4.07-2.66 2.57c-.3.3-.55.56-1.1.56l.38-5.56 10.14-9.16c.44-.39-.1-.61-.68-.22L6.24 13.5.94 11.84C-.21 11.48-.23 10.7 1.19 10.14l21.26-8.2c.96-.36 1.8.22 1.46 1.85Z" />
  </svg>
);

const WhatsappIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.04 21.5h-.01a9.5 9.5 0 0 1-4.83-1.32l-.35-.21-3.59.94.96-3.5-.23-.36a9.46 9.46 0 0 1-1.45-5.05c0-5.24 4.27-9.5 9.5-9.5 2.54 0 4.92.99 6.71 2.79a9.44 9.44 0 0 1 2.78 6.72c0 5.24-4.27 9.49-9.5 9.49ZM20.5 3.49A11.42 11.42 0 0 0 12.04.06C5.77.06.66 5.17.66 11.44c0 2.01.53 3.98 1.53 5.71L.56 23.5l6.5-1.71a11.34 11.34 0 0 0 5.47 1.39h.01c6.27 0 11.38-5.11 11.38-11.38 0-3.04-1.18-5.9-3.42-8.31Z" />
  </svg>
);

const WebsiteIcon: IconFn = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8ZM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96ZM4.26 14a7.96 7.96 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26Zm.81 2h2.95c.35 1.28.82 2.48 1.38 3.56A8.03 8.03 0 0 1 5.07 16Zm2.95-8H5.07a8.03 8.03 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.02 8ZM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82A15.6 15.6 0 0 1 12 19.96ZM14.34 14H9.66a14.6 14.6 0 0 1 0-4h4.68a14.6 14.6 0 0 1 0 4Zm.27 5.56c.56-1.08 1.03-2.28 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56ZM16.36 14a16.5 16.5 0 0 0 0-4h3.38a7.96 7.96 0 0 1 0 4h-3.38Z" />
  </svg>
);

/** Platform key → inline SVG icon. Keys align with `inferPlatform`; unknown or
 *  'website' → the globe fallback. `twitter` covers X (inferPlatform maps x.com
 *  → 'twitter'). */
const ICONS: Record<string, IconFn> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  x: TwitterIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
  threads: ThreadsIcon,
  pinterest: PinterestIcon,
  telegram: TelegramIcon,
  whatsapp: WhatsappIcon,
  website: WebsiteIcon,
};

/** The SVG icon for a platform (shared by both twins → byte-identical). Unknown
 *  platform → the website/globe fallback. */
export function socialIcon(platform: string): React.ReactElement {
  const fn = ICONS[(platform || '').toLowerCase()] || WebsiteIcon;
  return fn();
}

/**
 * SINGLE-SOURCE follow-strip layout. The heading and the profile anchors arrive
 * as prebuilt nodes from each wrapper (edit = editable heading + inert anchors,
 * published = static heading + beacon-tagged anchors), so both renderers emit
 * byte-identical section structure/classes. Self-sets `data-surface="neutral"`
 * (shared blocks never call getSurfaceForSection).
 */
export function FollowStripCore({
  headingSlot,
  linkNodes,
}: {
  headingSlot: React.ReactNode;
  linkNodes: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOLLOW_STRIP_STYLES }} />
      <section className="lg-follow lg-follow-pad" data-surface="neutral">
        <div className="lg-follow__inner">
          {headingSlot}
          <div className="lg-follow__row">{linkNodes}</div>
        </div>
      </section>
    </>
  );
}

export default FollowStripCore;
