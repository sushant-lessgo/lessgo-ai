// src/modules/wizard/rollout.ts
// scale-06 phase 3 — the SINGLE source of the wizard fork.
//
// `WIZARD_ENGINES` is the set of copy engines that have been migrated to the
// unified wizard (`/onboarding/[token]`). It is consumed in EXACTLY two places:
//   1. `/api/brief/confirm` — chooses the post-confirm redirect target
//      (migrated ⇒ `/onboarding/${tokenId}`; not-yet-migrated ⇒ the old
//      `/onboarding/${audienceType}/${tokenId}` wizard).
//   2. `src/app/onboarding/[token]/page.tsx` load-detection — a confirmed brief
//      whose engine ∈ this set renders the unified wizard; otherwise it is
//      FORWARDED to its old wizard route (never renders here).
//
// Keying BOTH the route and the page on this ONE const means phases 8/9 flip a
// single line here (add 'trust', then 'work') with no other route edits, and
// phase 10 deletes this file when every engine is unified.
//
// Phase 3 pilot: THING only.
//
// FIREWALL: pure data + the CopyEngine type. No stores/React/template modules.

import type { CopyEngine } from '@/types/brief';

/** Copy engines served by the unified wizard. Grows in phases 8/9, deleted in 10. */
export const WIZARD_ENGINES: ReadonlySet<CopyEngine> = new Set<CopyEngine>(['thing']);
