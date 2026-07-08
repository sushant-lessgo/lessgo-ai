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
import {
  FollowStripCore,
  resolveProfiles,
  socialIcon,
  FOLLOW_STRIP_DEFAULT_HEADING,
} from './socialIcons';

export default function FollowStrip({ sectionId }: { sectionId: string }) {
  const store = useEditStore() as any;
  const section = store.content?.[sectionId];
  const elements = (section?.elements || {}) as Record<string, any>;
  const profiles = resolveProfiles(elements.links_json);
  const heading = elements.strip_heading || FOLLOW_STRIP_DEFAULT_HEADING;

  const onHeadingBlur = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const value = (e.currentTarget.textContent || '').trim();
    if (value !== heading && typeof store.updateElementContent === 'function') {
      store.updateElementContent(sectionId, 'strip_heading', value);
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
