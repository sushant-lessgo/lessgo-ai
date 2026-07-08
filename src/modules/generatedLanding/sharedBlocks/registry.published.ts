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

export const sharedBlockPublishedRegistry: Record<string, React.ComponentType<any>> = {
  leadform: LeadFormPublished,
  storebadges: StoreBadgesPublished,
  followstrip: FollowStripPublished,
};

export function resolveSharedBlockPublished(
  sectionType: string
): React.ComponentType<any> | null {
  return sharedBlockPublishedRegistry[sectionType.toLowerCase()] ?? null;
}
