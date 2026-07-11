'use client';

// Shared FollowStrip — EDIT twin. Renders the social-icon row from the section's
// own content elements (strip_heading + links_json — a JSON-string array of
// {platform,url} materialized at injection). Like the StoreBadges edit twin, the
// edit renderer does NOT pass a `content` prop (LandingPageRenderer spreads only
// the section's own `data`), so this reads the section from the store via
// useEditStoreLegacy. Layout lives in socialIcons.FollowStripCore so this is
// byte-parallel with the published twin.
//
// Anchors are inert in the editor (preventDefault) — the published twin carries
// the real `data-lessgo-cta` beacon attrs. Both emit identical strip markup.

import React from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { getEffectiveElementValue } from '@/lib/i18n/localeContent';
import {
  FollowStripCore,
  resolveProfiles,
  socialIcon,
  FOLLOW_STRIP_DEFAULT_HEADING,
} from './socialIcons';

export default function FollowStrip({ sectionId }: { sectionId: string }) {
  const section = useEditStore((s) => (s as any).content?.[sectionId]);
  const updateElementContent = useEditStore((s) => (s as any).updateElementContent);
  const elements = (section?.elements || {}) as Record<string, any>;
  const profiles = resolveProfiles(elements.links_json); // links_json = structure (locale-shared)
  // i18n-phase-1 (3b): resolve the editable heading via the shared helper, keyed
  // on the active locale. Narrow selectors; legacy ⇒ base value (zero diff).
  const activeLocale = useEditStore((s) => (s as any).activeLocale as string | undefined);
  const sectionOverlay = useEditStore(
    (s) => (s as any).localeContent?.[(s as any).activeLocale]?.[sectionId],
  );
  const heading =
    (getEffectiveElementValue(
      { [sectionId]: section } as any,
      activeLocale ? { [activeLocale]: { [sectionId]: sectionOverlay || {} } } : undefined,
      activeLocale,
      sectionId,
      'strip_heading',
    ) as string) || FOLLOW_STRIP_DEFAULT_HEADING;

  const onHeadingBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const value = (e.currentTarget.textContent || '').trim();
    if (value !== heading && typeof updateElementContent === 'function') {
      updateElementContent(sectionId, 'strip_heading', value);
    }
  };

  const headingSlot = (
    <h2
      className="lg-follow__h"
      contentEditable
      suppressContentEditableWarning
      onBlur={onHeadingBlur}
    >
      {heading}
    </h2>
  );

  // First profile = the goal platform (role primary); the rest are secondary.
  const linkNodes = profiles.map((p, i) => (
    <a
      key={`${p.platform}-${i}`}
      href={p.url}
      className="lg-follow__link"
      aria-label={p.platform}
      onClick={(e) => e.preventDefault()}
    >
      {socialIcon(p.platform)}
    </a>
  ));

  return <FollowStripCore headingSlot={headingSlot} linkNodes={linkNodes} />;
}
