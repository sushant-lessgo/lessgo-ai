// Shared-block registry — EDIT twins ONLY. Imported ONLY by componentRegistry.ts.
// NEVER imports a `.published.tsx` twin (firewall: keeps published-only code out
// of the edit dispatch and vice-versa — mirrors the componentRegistry split).
//
// Keys are the LOWERCASED section type (both `extractSectionType` impls lowercase
// the type: `leadForm-<uuid>` → `leadform`). A cased key = silent non-resolution.
// componentRegistry.ts consults resolveSharedBlock() BEFORE template dispatch, so
// a shared block renders identically on EVERY template.

import type React from 'react';
import LeadForm from './LeadForm/LeadForm';
import StoreBadges from './StoreBadges/StoreBadges';
import FollowStrip from './FollowStrip/FollowStrip';
// CMS collections: a user-authored, engine- and template-agnostic block. It lives
// in src/modules/cms/ (not in this folder) because the whole CMS core ships there.
import CollectionSection from '@/modules/cms/render/CollectionSection';

export const sharedBlockRegistry: Record<string, React.ComponentType<any>> = {
  leadform: LeadForm,
  storebadges: StoreBadges,
  followstrip: FollowStrip,
  cmscollection: CollectionSection,
};

export function resolveSharedBlock(sectionType: string): React.ComponentType<any> | null {
  return sharedBlockRegistry[sectionType.toLowerCase()] ?? null;
}
