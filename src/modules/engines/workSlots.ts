// src/modules/engines/workSlots.ts
// ============================================================================
// WORK 8-SLOT TABLE + RECONCILIATION MAP (work-contract phase A / 3).
//
// PURE DATA. The slot half of the work fact freeze: the 8 wizard slots with
// their default resolution POSTURE (mechanics) and an explicit reconciliation
// map onto today's live `workContract` field ids. The value SHAPES live in
// `src/lib/schemas/workFacts.schema.ts`.
//
// ── D2 — the live `workContract` is intentionally NOT modified here ──────────
//   The work wizard is LIVE (granth / atelier flows). Adding required fields
//   (price!) to `workContract.fields` in inputContracts.ts changes what real
//   users get asked — a behavior change the spec forbids. So this module freezes
//   the 8-slot SHAPE + mechanics as NEW data, typing each slot's `field` as the
//   EXISTING `ContractField` shape (pure data, firewall-safe), plus
//   `workSlotReconciliation` mapping onto the current `workContract` field ids.
//   Track E merges these into the live contract; phase A only freezes.
//
// ── MECHANICS are a DEFAULT POSTURE, not the resolver ───────────────────────
//   `mechanics` (auto-confident | confirm-shaky | ask-unknown) is metadata: the
//   starting stance for a slot. The RUNTIME resolution to scraped|inferred|ask|
//   drop stays `resolveFieldState()` in src/modules/wizard/waterfall.ts —
//   referenced here, never duplicated. `neverSilent` slots always surface a
//   one-tap confirm even when auto-fillable; `branch` slots fork later questions.
//
// ── FIREWALL (D5) ───────────────────────────────────────────────────────────
//   Allowed: zod, `ContractField` (type) from ./inputContracts, workFacts types.
//   NEVER react / stores / hooks / template runtime. No templateId / skeletonId.
// ============================================================================

import type { ContractField } from './inputContracts';
import type { WorkFacts } from '@/lib/schemas/workFacts.schema';

// ─────────────────────────────────────────────────────────────────────────────
// Slot ids (8) — the fixed ASK-step skeleton for the work vertical.
// ─────────────────────────────────────────────────────────────────────────────

export const workSlotIds = [
  'identity', // 1 — name + where + reach
  'groups', // 2 — what you sell
  'price', // 3 — per-group price (value lives on the group)
  'establishment', // 4 — new | established (BRANCH)
  'dreamClient', // 5 — who you want to work with
  'praise', // 6 — verbatim praise / what-to-expect
  'contactMethod', // 7 — whatsapp | booking | form (neverSilent)
  'languages', // 8 — content language(s)
] as const;

export type WorkSlotId = (typeof workSlotIds)[number];

/**
 * `factsPath` = where the slot's value lives in WorkFacts. Every top-level slot
 * is a `keyof WorkFacts`; price is the one exception — its value lives on each
 * group (`WorkGroup.price`), so its path is the sentinel `'groups[].price'`.
 */
export type WorkFactsPath = keyof WorkFacts | 'groups[].price';

export interface WorkSlotDef {
  id: WorkSlotId;
  /**
   * The slot's field SHAPE, typed as the live `ContractField` (imported from
   * inputContracts — pure data). NOT registered on the live `workContract`
   * (D2); track E wires it. `id` mirrors the slot id.
   */
  field: ContractField;
  /** Default resolution posture (see resolveFieldState() — NOT the resolver). */
  mechanics: 'auto-confident' | 'confirm-shaky' | 'ask-unknown';
  /** Always surface a one-tap confirm, even when auto-fillable. */
  neverSilent?: true;
  /** Answer forks later questions (new vs established reframes praise). */
  branch?: true;
  /** Where the value lives in WorkFacts (`brief.facts.work`). */
  factsPath: WorkFactsPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// The 8 slot definitions. `field.group`/`slot`/`tier`/`requirement` reuse the
// existing ContractField vocabulary (5 fact groups: WHO/WHAT/WHY-BELIEVE/
// WHY-YOU/ACT · wizard slots · T1/T2/T3 · required/optional).
// ─────────────────────────────────────────────────────────────────────────────

export const workSlots: readonly WorkSlotDef[] = [
  // 1 — identity: name + where + reach. Scrapes confidently from businessName.
  {
    id: 'identity',
    mechanics: 'auto-confident',
    factsPath: 'identity',
    field: {
      id: 'identity',
      group: 'WHO',
      slot: 'identity',
      tier: 'T1',
      requirement: 'required',
      input: 'free-text',
    },
  },
  // 2 — groups (what you sell). Scrape offerings → confirm (shaky mapping).
  {
    id: 'groups',
    mechanics: 'confirm-shaky',
    factsPath: 'groups',
    field: {
      id: 'groups',
      group: 'WHAT',
      slot: 'understanding',
      tier: 'T1',
      requirement: 'required',
      section: 'work',
      input: 'chips',
    },
  },
  // 3 — price per group. REQUIRED (conviction pillar); "on request" is legal.
  //     Never reliably scrape-inferable → asked. Value lives on each group.
  {
    id: 'price',
    mechanics: 'ask-unknown',
    factsPath: 'groups[].price',
    field: {
      id: 'price',
      group: 'WHAT',
      slot: 'offer',
      tier: 'T1',
      requirement: 'required',
      section: 'packages',
      input: 'free-text',
    },
  },
  // 4 — establishment (new | established). BRANCH: reframes the praise slot.
  {
    id: 'establishment',
    mechanics: 'confirm-shaky',
    branch: true,
    factsPath: 'establishment',
    field: {
      id: 'establishment',
      group: 'WHY-YOU',
      slot: 'understanding',
      tier: 'T1',
      requirement: 'optional',
      input: 'boolean',
    },
  },
  // 5 — dream client. Nearest existing field: whatYouTakeOn (scraped audiences).
  {
    id: 'dreamClient',
    mechanics: 'confirm-shaky',
    factsPath: 'dreamClient',
    field: {
      id: 'dreamClient',
      group: 'WHO',
      slot: 'understanding',
      tier: 'T1',
      requirement: 'optional',
      input: 'chips',
    },
  },
  // 6 — praise (verbatim; "what to expect" for `new` sellers). Existence boolean.
  {
    id: 'praise',
    mechanics: 'confirm-shaky',
    factsPath: 'praise',
    field: {
      id: 'praise',
      group: 'WHY-BELIEVE',
      slot: 'proof',
      tier: 'T2',
      requirement: 'optional',
      section: 'proof',
      input: 'boolean',
    },
  },
  // 7 — contact method. neverSilent: one-tap confirm from region + profession
  //     default, never silently guessed. The conversion action.
  {
    id: 'contactMethod',
    mechanics: 'confirm-shaky',
    neverSilent: true,
    factsPath: 'contactMethod',
    field: {
      id: 'contactMethod',
      group: 'ACT',
      slot: 'goal',
      tier: 'T1',
      requirement: 'required',
      section: 'contact',
    },
  },
  // 8 — languages. Auto from location; confirm when ambiguous.
  {
    id: 'languages',
    mechanics: 'auto-confident',
    factsPath: 'languages',
    field: {
      id: 'languages',
      group: 'WHO',
      slot: 'identity',
      tier: 'T1',
      requirement: 'optional',
      input: 'chips',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Reconciliation onto today's LIVE `workContract` field ids (inputContracts.ts:
// name · oneLiner · whatYouTakeOn · theWork · genresStyle · bioStory ·
// achievements · praise · goal). `undefined` existingFieldId = a NEW slot with
// no live counterpart (track E adds it). The live contract is NOT modified (D2).
// ─────────────────────────────────────────────────────────────────────────────

export const workSlotReconciliation: Record<
  WorkSlotId,
  { existingFieldId?: string }
> = {
  // name + oneLiner both fold into the identity slot; name is the anchor id.
  identity: { existingFieldId: 'name' },
  // theWork (T3 upload) is today's nearest to the groups gallery.
  groups: { existingFieldId: 'theWork' },
  // NEW — no live price field (adding one would change what users get asked, D2).
  price: {},
  // NEW — no live new/established branch today.
  establishment: {},
  // whatYouTakeOn (audiences) is the nearest existing field to dream client.
  dreamClient: { existingFieldId: 'whatYouTakeOn' },
  // praise maps 1:1 to the live praise field.
  praise: { existingFieldId: 'praise' },
  // NEW — today the conversion action is the generic `goal` resolver, not a
  // work-specific contact-method pick.
  contactMethod: {},
  // NEW — no live language slot.
  languages: {},
};
