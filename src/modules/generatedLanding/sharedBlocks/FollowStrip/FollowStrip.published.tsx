// Shared FollowStrip — PUBLISHED twin (server-safe, no hooks). Emits the same
// social-icon row as the edit twin, but the anchors carry the real
// `data-lessgo-cta` beacon attrs (scale-04 initCTATracking tags the click) and
// open in a new tab via externalLinkProps. The GOAL platform anchor (the first
// profile — the follow-social target that also drives the hero Destination) is
// tagged `data-lessgo-cta-role="primary"`; the remaining strip anchors are
// `secondary` (StoreBadges convention). The published renderer flattens the
// section's elements onto props (strip_heading / links_json). Layout lives in
// socialIcons.FollowStripCore so this is byte-parallel with the edit twin.
//
// Firewall: imports ONLY plain modules (socialIcons, resolveCtaHref) — no
// 'use client' code reaches the static-markup path.

import React from 'react';
import {
  FollowStripCore,
  resolveProfiles,
  socialIcon,
  FOLLOW_STRIP_DEFAULT_HEADING,
} from './socialIcons';
import { externalLinkProps } from '@/utils/resolveCtaHref';

interface Props {
  sectionId: string;
  strip_heading?: string;
  links_json?: string;
  [key: string]: any;
}

export default function FollowStripPublished(props: Props) {
  const profiles = resolveProfiles(props.links_json);
  const heading = props.strip_heading || FOLLOW_STRIP_DEFAULT_HEADING;

  const headingSlot = <h2 className="lg-follow__h">{heading}</h2>;

  // First profile = the goal platform → role="primary" (the beacon conversion);
  // the rest are secondary.
  const linkNodes = profiles.map((p, i) => (
    <a
      key={`${p.platform}-${i}`}
      href={p.url}
      className="lg-follow__link"
      aria-label={p.platform}
      data-lessgo-cta=""
      data-lessgo-cta-role={i === 0 ? 'primary' : 'secondary'}
      {...externalLinkProps(p.url)}
    >
      {socialIcon(p.platform)}
    </a>
  ));

  return <FollowStripCore headingSlot={headingSlot} linkNodes={linkNodes} />;
}
