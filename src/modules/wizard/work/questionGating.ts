// src/modules/wizard/work/questionGating.ts
// ============================================================================
// WORK QUESTION GATING — the deterministic, zero-AI resolver that decides, per
// wizard slot, whether STEP 03 should stay SILENT (we know it), one-tap CONFIRM
// (we're almost sure), or ASK (we don't know). E3 phase 1.
//
// This is the gating half of the E3 question step: `buildQuestionPlan` turns the
// frozen `WorkFacts` bag + upstream `facts.entry` signals into an ordered list of
// renderable question items (posture + required + answered + suggestions). The
// seam (`engines/work.ts`, phase 3) maps these items onto descriptors + rail
// commits; the renderer (`StepQuestions.tsx`, phase 2) draws them.
//
// ── WIRES THE DORMANT SLOT FLAGS ────────────────────────────────────────────
//   The postures below are keyed off `workSlots[].mechanics` / `neverSilent` /
//   `branch` (src/modules/engines/workSlots.ts) — flags frozen in phase A and
//   dormant until now:
//     • price      (ask-unknown, required)         → ask, suggested on-request
//     • languages  (auto-confident, required)      → ask, suggested English
//     • establishment (branch)                     → ask (no upstream signal)
//     • dreamClient                                → confirm (from audiences) | ask
//     • praise                                     → confirm-only, else SILENT
//     • contactMethod (neverSilent)                → confirm (region default)
//
// ── D-C · PRICE "ANSWERED" DERIVATION (no contract reshape) ─────────────────
//   The entry seed defaults every group to `on-request`, indistinguishable from a
//   real "on request" answer. Price counts answered when `sessionAnswered`
//   contains 'price' OR any group price is non-default (exact/from). Consequence
//   (accepted): a genuine "on request" answer degrades to a one-tap confirm
//   (`suggested:['on-request']`) after a mid-step reload — one tap, never an open
//   re-ask. No marker field is added to the frozen contract.
//
// ── D-E · WHAT RENDERS ──────────────────────────────────────────────────────
//   A slot renders when it needs asking (value absent) OR was answered THIS
//   session (`sessionAnswered`, so it can collapse to a "value — Change" compact
//   row). A slot already KNOWN from upstream (value present, not session-answered)
//   never renders — that is "never ask twice".
//
// ── D-F · CEILING ───────────────────────────────────────────────────────────
//   Praise is confirm-ONLY (appears only when `entry.testimonials` exist), never
//   an open ask. Hard cap at 5 renderable questions by priority rank (identity,
//   groups, price, languages, contactMethod, establishment, dreamClient, praise)
//   guards the degenerate no-seed case.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   PURE module (types / zod-derived data only) — a SANCTIONED static-import
//   sibling of `rail.ts` for the seam. NO react, NO stores, NO hooks, NO network,
//   NO templateId / skeletonId literals. Every import here is `import type` or a
//   pure-data value:
//     • `resolveWorkProfession` (audience/work/voice.ts) — voice.ts is import-PURE
//       (type-only imports; the resolver reads a local key→profession map), so the
//       re-export drags nothing impure into the seam graph. (If voice.ts ever gains
//       a value import, inline the 4-key map here instead — plan-sanctioned.)
// ============================================================================

import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { EntryFacts } from '@/modules/brief/classify';
import { workSlotIds, type WorkSlotId } from '@/modules/engines/workSlots';
import { resolveWorkProfession } from '@/modules/audience/work/voice';
import type { WorkProfession } from '@/modules/engines/workVocabulary';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-slot resolution stance. Only `ask` / `confirm` items are EMITTED by
 * `buildQuestionPlan`; `known` / `skip` describe the two non-rendering outcomes
 * (value known upstream / slot dropped by the ceiling or has no signal) and are
 * documented here for the seam even though they are filtered out of the output.
 */
export type SlotPosture = 'known' | 'confirm' | 'ask' | 'skip';

/** One renderable question. `suggested` present ⇒ one-tap confirm affordance. */
export interface QuestionPlanItem {
  slot: WorkSlotId;
  posture: SlotPosture;
  /** Blocks the STEP 03 proceed gate until answered (price + languages). */
  required: boolean;
  /** Value already present ⇒ render compact ("value — Change"), gate satisfied. */
  answered: boolean;
  /** Confirm/prefill candidates; drives the one-tap confirm posture at render. */
  suggested?: string[];
}

export interface QuestionPlanInput {
  work: WorkFacts | null;
  entry: Partial<EntryFacts> | null;
  sessionAnswered: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Ceiling — cap rank (D-F). LOWER rank survives the cap first.
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<WorkSlotId, number> = {
  identity: 0,
  groups: 1,
  price: 2,
  languages: 3,
  contactMethod: 4,
  establishment: 5,
  dreamClient: 6,
  praise: 7,
};

const MAX_QUESTIONS = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function nonEmptyStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the ordered STEP 03 question plan. Deterministic + zero-AI: the same
 * facts always produce the same plan. Items come out in `workSlotIds` order,
 * capped at 5 by priority rank (D-F). `known` / `skip` slots are omitted.
 */
export function buildQuestionPlan(input: QuestionPlanInput): QuestionPlanItem[] {
  const { work, entry, sessionAnswered } = input;
  const answered = new Set(sessionAnswered);
  const session = (slot: WorkSlotId): boolean => answered.has(slot);

  const audiences = nonEmptyStrings(entry?.audiences);
  const testimonials = nonEmptyStrings(entry?.testimonials);
  const deliveryModel = entry?.deliveryModel ?? null;

  const groups = work?.groups ?? [];
  // D-C: a non-default (exact/from) group price is a real price answer; a bare
  // on-request default is not — unless the user tapped price THIS session.
  const priceNonDefault = groups.some((g) => g.price.mode !== 'on-request');
  const priceAnswered = session('price') || priceNonDefault;

  const contactDefault: 'whatsapp' | 'form' =
    deliveryModel === 'in-person' || deliveryModel === 'hybrid' ? 'whatsapp' : 'form';

  const candidates: QuestionPlanItem[] = [];
  const push = (item: QuestionPlanItem | null): void => {
    if (item) candidates.push(item);
  };

  // Slots in workSlotIds order so the emitted list is already display-ordered.

  // 1 — identity(name): E1 parity — ask only when absent.
  {
    const present = !!work?.identity?.name;
    if (!present || session('identity')) {
      push({ slot: 'identity', posture: 'ask', required: false, answered: present });
    }
  }

  // 2 — groups: E1 parity — ask only when absent.
  {
    const present = groups.length > 0;
    if (!present || session('groups')) {
      push({ slot: 'groups', posture: 'ask', required: false, answered: present });
    }
  }

  // 3 — price (required, D-C). Suggested on-request once groups exist.
  {
    if (!priceAnswered || session('price')) {
      const item: QuestionPlanItem = {
        slot: 'price',
        posture: 'ask',
        required: true,
        answered: priceAnswered,
      };
      if (groups.length > 0) item.suggested = ['on-request'];
      push(item);
    }
  }

  // 4 — establishment (branch): no upstream signal — ask when absent.
  {
    const present = !!work?.establishment;
    if (!present || session('establishment')) {
      push({ slot: 'establishment', posture: 'ask', required: false, answered: present });
    }
  }

  // 5 — dreamClient: confirm from entry.audiences, else open ask.
  {
    const present = !!work?.dreamClient;
    if (!present || session('dreamClient')) {
      const item: QuestionPlanItem = {
        slot: 'dreamClient',
        posture: audiences.length ? 'confirm' : 'ask',
        required: false,
        answered: present,
      };
      if (audiences.length) item.suggested = audiences;
      push(item);
    }
  }

  // 6 — praise: confirm-ONLY when entry.testimonials exist, else SILENT (D-F).
  {
    const present = (work?.praise?.length ?? 0) > 0;
    if (session('praise') || (!present && testimonials.length > 0)) {
      const item: QuestionPlanItem = {
        slot: 'praise',
        posture: 'confirm',
        required: false,
        answered: present,
      };
      if (testimonials.length) item.suggested = testimonials;
      push(item);
    }
  }

  // 7 — contactMethod (neverSilent): confirm with region default.
  {
    const present = !!work?.contactMethod;
    if (!present || session('contactMethod')) {
      push({
        slot: 'contactMethod',
        posture: 'confirm',
        required: false,
        answered: present,
        suggested: [contactDefault],
      });
    }
  }

  // 8 — languages (required): ask when absent, suggested English.
  {
    const present = (work?.languages?.length ?? 0) > 0;
    if (!present || session('languages')) {
      push({
        slot: 'languages',
        posture: 'ask',
        required: true,
        answered: present,
        suggested: ['English'],
      });
    }
  }

  if (candidates.length <= MAX_QUESTIONS) return candidates;

  // D-F ceiling (engagement-aware): an item the visitor has already engaged with
  // — answered upstream OR tapped THIS session — must NEVER be evicted (else it
  // appears-then-vanishes, e.g. rank-6 dreamClient; B1). Pin every engaged slot,
  // then cap only the UNENGAGED new asks by priority rank. With nothing engaged
  // this collapses to the original rank-5 result. Display order is restored last.
  const engaged = (c: QuestionPlanItem): boolean => c.answered || session(c.slot);
  const pinned = candidates.filter(engaged);
  const remaining = Math.max(0, MAX_QUESTIONS - pinned.length);
  const keptCompeting = new Set(
    candidates
      .filter((c) => !engaged(c))
      .sort((a, b) => PRIORITY_RANK[a.slot] - PRIORITY_RANK[b.slot])
      .slice(0, remaining)
      .map((c) => c.slot)
  );
  const kept = new Set<WorkSlotId>([...pinned.map((c) => c.slot), ...keptCompeting]);
  return candidates.filter((c) => kept.has(c.slot));
}

// ─────────────────────────────────────────────────────────────────────────────
// Profession re-export — the seam's ONLY profession/vocabulary reach is THROUGH
// this pure sibling, never a direct audience import (keeps the seam's new
// static-import family exactly `wizard/work/*`).
// ─────────────────────────────────────────────────────────────────────────────

/** Map a businessType key onto a work profession (thin wrap of the voice resolver). */
export function resolveQuestionProfession(
  businessType: string | null | undefined
): WorkProfession {
  return resolveWorkProfession(businessType);
}
