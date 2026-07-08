// Shared StoreBadges — PUBLISHED twin (server-safe, no hooks). Emits the same
// App Store / Google Play badge row as the edit twin, but the anchors carry the
// real `data-lessgo-cta` + `data-lessgo-cta-role="secondary"` beacon attrs
// (scale-04 initCTATracking tags the click) and open in a new tab via
// externalLinkProps. The published renderer flattens the section's elements onto
// props (appstore_url / playstore_url / badge_label). Layout lives in
// badgeArt.StoreBadgesCore so this is byte-parallel with the edit twin.
//
// Firewall: imports ONLY plain modules (badgeArt, resolveCtaHref) — no
// 'use client' code reaches the static-markup path.

import React from 'react';
import {
  StoreBadgesCore,
  resolveBadges,
  badgeArt,
  STORE_BADGES_DEFAULT_LABEL,
} from './badgeArt';
import { externalLinkProps } from '@/utils/resolveCtaHref';

interface Props {
  sectionId: string;
  appstore_url?: string;
  playstore_url?: string;
  badge_label?: string;
  [key: string]: any;
}

export default function StoreBadgesPublished(props: Props) {
  const badges = resolveBadges({
    appstore_url: props.appstore_url,
    playstore_url: props.playstore_url,
  });
  const label = props.badge_label || STORE_BADGES_DEFAULT_LABEL;

  const headingSlot = <h2 className="lg-badges__h">{label}</h2>;

  const badgeNodes = badges.map((b) => (
    <a
      key={b.kind}
      href={b.url}
      className="lg-badge"
      data-lessgo-cta=""
      data-lessgo-cta-role="secondary"
      {...externalLinkProps(b.url)}
    >
      {badgeArt(b.kind)}
    </a>
  ));

  return <StoreBadgesCore headingSlot={headingSlot} badgeNodes={badgeNodes} />;
}
