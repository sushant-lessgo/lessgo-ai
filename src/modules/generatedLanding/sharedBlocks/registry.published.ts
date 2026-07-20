// Shared-block registry — PUBLISHED (server-safe) twins ONLY. Imported ONLY by
// componentRegistry.published.ts. NEVER imports a `'use client'` edit twin
// (firewall: keeps client/hook code out of the static-markup path).
//
// Keys are the LOWERCASED section type (`leadForm-<uuid>` → `leadform`) — a cased
// key = silent non-resolution. componentRegistry.published.ts consults
// resolveSharedBlockPublished() BEFORE template dispatch.

import type React from 'react';
import LeadFormPublished from './LeadForm/LeadForm.published';
import StoreBadgesPublished from './StoreBadges/StoreBadges.published';
import FollowStripPublished from './FollowStrip/FollowStrip.published';
// CMS collections — published twin (server-safe; lives in src/modules/cms/).
import CollectionSectionPublished from '@/modules/cms/render/CollectionSection.published';
// CMS item DETAIL pages (phase 4) — published twin. This is the ONLY renderer of
// a fan-out `cmscollectionitem` section: detail subpages exist solely on the
// published site (plan Deviations #3).
import CollectionDetailPublished from '@/modules/cms/render/CollectionDetail.published';

export const sharedBlockPublishedRegistry: Record<string, React.ComponentType<any>> = {
  leadform: LeadFormPublished,
  storebadges: StoreBadgesPublished,
  followstrip: FollowStripPublished,
  cmscollection: CollectionSectionPublished,
  cmscollectionitem: CollectionDetailPublished,
};

export function resolveSharedBlockPublished(
  sectionType: string
): React.ComponentType<any> | null {
  return sharedBlockPublishedRegistry[sectionType.toLowerCase()] ?? null;
}
