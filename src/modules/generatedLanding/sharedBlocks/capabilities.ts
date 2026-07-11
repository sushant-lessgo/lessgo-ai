// Shared-block capability declaration — PURE DATA.
//
// FIREWALL: this file MUST NOT import React, any component, or either shared-block
// component registry (`registry.ts` / `registry.published.ts`). It is imported by
// `src/modules/templates/fit.ts` — a pure gate module whose bundle must never pull a
// React tree or a `.published`/edit component twin. Keep this file plain data + the
// closed-vocab type from `@/types/brief`.
//
// Purpose: declares which serve-gate `CapabilityId` each shared block satisfies. A
// shared block renders on EVERY template (it resolves before template dispatch), so a
// capability it backs is available regardless of the picked template — that is what
// lets `fit()` treat these capabilities as satisfied for any template.
//
// Keys are the LOWERCASED registry keys used by `registry.ts` / `registry.published.ts`
// (`leadForm-<uuid>` → `leadform`). `capabilities.test.ts` keeps this map provably in
// sync with BOTH component registries (test-only imports).

import { capabilityIds, type CapabilityId } from '@/types/brief';

/**
 * Every shared block, keyed by its lowercased registry key, mapped to the capability
 * it satisfies — or `null` when no capability id exists for it today.
 */
export const sharedBlockCapability: Record<string, CapabilityId | null> = {
  leadform: 'lead-form',
  storebadges: 'store-badges',
  followstrip: null, // no capability id exists for it today
};

/**
 * The capabilities satisfied by a shared block — non-null values, deduped, in
 * canonical `capabilityIds` order. This is what `fit()` reads.
 */
export const sharedBlockCapabilities: readonly CapabilityId[] = capabilityIds.filter(
  (id): id is CapabilityId =>
    Object.values(sharedBlockCapability).includes(id)
);
