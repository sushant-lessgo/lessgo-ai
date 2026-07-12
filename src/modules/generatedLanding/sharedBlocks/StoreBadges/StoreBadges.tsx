'use client';

// Shared StoreBadges — EDIT twin. Renders the App Store / Google Play badge row
// from the section's own content elements (appstore_url / playstore_url /
// badge_label). Like the LeadForm edit twin, the edit renderer does NOT pass a
// `content` prop (LandingPageRenderer spreads only the section's own `data`), so
// this reads the section from the store via useEditStore. Layout lives in
// badgeArt.StoreBadgesCore so this is byte-parallel with the published twin.
//
// Anchors are inert in the editor (preventDefault) — the published twin carries
// the real `data-lessgo-cta` beacon attrs. Both emit identical badge markup.

import React from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { getEffectiveElementValue } from '@/lib/i18n/localeContent';
import {
  StoreBadgesCore,
  resolveBadges,
  badgeArt,
  STORE_BADGES_DEFAULT_LABEL,
} from './badgeArt';

export default function StoreBadges({ sectionId }: { sectionId: string }) {
  const section = useEditStore((s) => (s as any).content?.[sectionId]);
  const updateElementContent = useEditStore((s) => (s as any).updateElementContent);
  const elements = (section?.elements || {}) as Record<string, any>;
  const badges = resolveBadges({
    appstore_url: elements.appstore_url, // store URLs = media/structure (locale-shared)
    playstore_url: elements.playstore_url,
  });
  // i18n-phase-1 (3b): resolve the editable label via the shared helper, keyed on
  // the active locale. Narrow selectors; legacy ⇒ base value (zero diff).
  const activeLocale = useEditStore((s) => (s as any).activeLocale as string | undefined);
  const sectionOverlay = useEditStore(
    (s) => (s as any).localeContent?.[(s as any).activeLocale]?.[sectionId],
  );
  const label =
    (getEffectiveElementValue(
      { [sectionId]: section } as any,
      activeLocale ? { [activeLocale]: { [sectionId]: sectionOverlay || {} } } : undefined,
      activeLocale,
      sectionId,
      'badge_label',
    ) as string) || STORE_BADGES_DEFAULT_LABEL;

  const onHeadingBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const value = (e.currentTarget.textContent || '').trim();
    if (value !== label && typeof updateElementContent === 'function') {
      updateElementContent(sectionId, 'badge_label', value);
    }
  };

  const headingSlot = (
    <h2
      className="lg-badges__h"
      contentEditable
      suppressContentEditableWarning
      onBlur={onHeadingBlur}
    >
      {label}
    </h2>
  );

  const badgeNodes = badges.map((b) => (
    <a
      key={b.kind}
      href={b.url}
      className="lg-badge"
      onClick={(e) => e.preventDefault()}
    >
      {badgeArt(b.kind)}
    </a>
  ));

  return <StoreBadgesCore headingSlot={headingSlot} badgeNodes={badgeNodes} />;
}
