// src/components/onboarding/journey/engines/work.ts
// ============================================================================
// THE WORK JOURNEY SEAM — the E1 pilot, and the thing engine #2 clones.
//
// Everything work-specific about the onboarding journey lives HERE. Nothing in
// `journey/` outside `engines/` may know that `work` (or `atelier`) exists.
//
// ── FIREWALL (landmine 14 — the reason this file is `.ts`, not `.tsx`) ──────
// Seams load at STEP 01, PRE-CONFIRM, on the onboarding entry page. Module-top
// static imports are therefore limited to:
//     • `@/modules/wizard/work/rail.ts`   (pure: zod + types)
//     • `@/modules/wizard/work/resumeStep.ts` (pure — joins the list in P2b)
//     • `@/lib/workCopyEngine`            (zero-dep leaf)
//     • `@/types/brief` + `./types`       (types only)
//     • local copy strings
// and NOTHING else. In particular NEVER `@/modules/wizard/generation/**` or
// `@/modules/generation/**`: `work.llm.ts`'s module top statically pulls
// `preloadTemplate` + `multiPageAssembly`, so one static import here puts the
// whole template + generation graph on the entry path. `runGeneration` /
// `resolveResumeStep` lazy-import their drivers at CALL time (the
// `useWizardStore` lazy-adapter pattern).
//
// STATUS (phase 2a): SKELETON. The rail adapter is real (it proves the contract
// is implementable over phase 1's `rail.ts`); step content, `preflight`,
// `runGeneration` and `resolveResumeStep` are filled in P4/P5/P2b.
// ============================================================================

import type { Brief } from '@/types/brief';
import {
  railFromFacts,
  applyRailEdit,
  appendUserNote,
  seedWorkFactsFromEntry,
  type WorkGroupInput,
} from '@/modules/wizard/work/rail';
import type {
  JourneyEngineSeam,
  JourneyLoadedDraft,
  JourneyQuestion,
  JourneyRailAdapter,
  JourneyStep,
  JourneyWizardState,
  RailChipEdit,
  RailCommit,
  RailEditValue,
  RailVM,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Rail field ids — the seam's private vocabulary. The agnostic rail treats
// these as opaque strings.
// ─────────────────────────────────────────────────────────────────────────────

const FIELD_NAME = 'name';
const FIELD_DESCRIPTOR = 'descriptor';
const FIELD_GROUPS = 'groups';
const FIELD_PRICE_POSITION = 'pricePosition';

/** `g0`, `g1`, … — the chip id derivation (see the rule on `RailChipEdit`). */
function chipId(index: number): string {
  return `g${index}`;
}

/**
 * Inverse of `chipId`; `null` for anything this projection did not issue.
 *
 * The shape must be matched STRICTLY (`g` + digits): `Number('')` is `0`, so a
 * loose `startsWith('g')` + `Number(slice(1))` silently joined the id `'g'` (and
 * `'g 1'`, `' g1'`, …) to `groups[0]`, inheriting its entire payload instead of
 * creating a NEW group — contradicting the documented semantics on
 * `commitGroupChips` below.
 */
function chipIndex(id: string | undefined): number | null {
  if (!id || !/^g\d+$/.test(id)) return null;
  return Number(id.slice(1));
}

/** Labels for the canonical `PricePosition` union ('premium'|'middle'|'friendly'). */
const PRICE_POSITION_LABEL: Record<string, string> = {
  premium: 'Premium',
  middle: 'Mid-range',
  friendly: 'Friendly',
};

const workRailAdapter: JourneyRailAdapter = {
  /**
   * E1 renders EXACTLY FOUR fields. `location` / `reach` / `languages` stay
   * MODELLED but UNRENDERED (founder ruling) — E1 has no source for them; E2/E3
   * widen this projection. Generation meanwhile silently defaults language to
   * `en` (a known, flagged gap — not an oversight here).
   *
   * Chip ids (`g0`, `g1`, …) are the positions of the groups IN `facts` — they
   * are valid ONLY against this bag. See the chip stable-id rule on
   * `RailChipEdit` in `./types`.
   */
  toVM(facts: Brief['facts']): RailVM {
    const rail = railFromFacts(facts);
    return {
      fields: [
        {
          id: FIELD_NAME,
          label: 'NAME',
          kind: 'text',
          value: rail.name,
          skeleton: rail.name === null,
          editable: true,
        },
        {
          id: FIELD_DESCRIPTOR,
          label: 'WHAT YOU DO',
          kind: 'text',
          value: rail.descriptor,
          skeleton: rail.descriptor === null,
          editable: true,
        },
        {
          id: FIELD_GROUPS,
          label: 'WHAT YOU SELL',
          kind: 'chips',
          value: null,
          chips: rail.groups.map((g, i) => ({
            id: chipId(i),
            label: g.name,
          })),
          skeleton: rail.groups.length === 0,
          editable: true,
        },
        {
          id: FIELD_PRICE_POSITION,
          label: 'PRICE POSITION',
          kind: 'derived',
          // DERIVED from group prices, never stored ⇒ read-only.
          value: rail.pricePosition ? (PRICE_POSITION_LABEL[rail.pricePosition] ?? rail.pricePosition) : null,
          skeleton: rail.pricePosition === null,
          editable: false,
        },
      ],
    };
  },

  applyEdit(fieldId: string, value: RailEditValue, liveFacts: Brief['facts']): RailCommit {
    if (fieldId === FIELD_GROUPS) {
      if (value.kind !== 'chips') return { ok: false, error: 'Expected chips for what you sell' };
      return commitGroupChips(value.value, liveFacts);
    }
    if (value.kind !== 'text') return { ok: false, error: 'Expected text' };
    if (fieldId === FIELD_NAME) {
      const result = applyRailEdit({ field: 'name', value: value.value }, liveFacts);
      if (!result.ok) return result;
      // The wizard's `fields['name']` is a SEPARATE store surface from
      // facts.work.identity.name — the seam declares the mirror, the store
      // applies it (it knows no engine).
      return { ...result, fieldMirrors: [{ fieldId: 'name', value: value.value.trim() }] };
    }
    if (fieldId === FIELD_DESCRIPTOR) {
      return applyRailEdit({ field: 'descriptor', value: value.value }, liveFacts);
    }
    if (fieldId === FIELD_PRICE_POSITION) {
      return { ok: false, error: 'Price position is derived from your prices' };
    }
    return { ok: false, error: `Unknown field: ${fieldId}` };
  },

  appendNote(note: string, liveFacts: Brief['facts']): RailCommit {
    return appendUserNote(note, liveFacts);
  },
};

/**
 * The chip-id JOIN (decision 11 / landmine 15). `applyRailEdit({field:'groups'})`
 * REPLACES the whole array, and the chip projection drops `photos`/`items`, so
 * every surviving group is rebuilt from `liveFacts.work.groups[]`:
 *
 *   • chip WITH a known id → that live group, carrying `kind`/`price`/`photos`/
 *     `items` through `WorkGroupInput`; only `name` takes the (possibly
 *     renamed) label
 *   • chip WITHOUT an id (or an id this bag never issued) → a NEW group; the
 *     seed defaults (`kind:'category'`, on-request price) come from
 *     `normalizeWorkGroup` — never a `kind`-less group (landmine 6)
 *   • live group referenced by no chip → deleted
 *   • the edited array's ORDER → the new group order
 *
 * NEVER label-match (breaks on rename — the primary edit) and NEVER position
 * (breaks on add/remove).
 */
function commitGroupChips(chips: RailChipEdit[], liveFacts: Brief['facts']): RailCommit {
  const live = liveGroups(liveFacts);
  const next: WorkGroupInput[] = chips.map((chip) => {
    const idx = chipIndex(chip.id);
    const source = idx === null ? undefined : live[idx];
    // No id (or an id this bag never issued) ⇒ NEW group.
    if (!source) return { name: chip.label };
    return { ...source, name: chip.label };
  });
  return applyRailEdit({ field: 'groups', value: next }, liveFacts);
}

/**
 * The live groups as `WorkGroupInput[]` — read from the FACTS bag, NOT from the
 * rail projection, because the projection drops `photos`/`items` (the exact wipe
 * this join exists to prevent). Unvalidated on purpose: `applyRailEdit` →
 * `normalizeWorkGroup` + `WorkFactsSchema` is the single validation gate, so
 * anything malformed comes back as `{ok:false}` rather than being persisted.
 */
function liveGroups(liveFacts: Brief['facts']): WorkGroupInput[] {
  const work = (liveFacts?.['work'] ?? {}) as { groups?: unknown };
  return Array.isArray(work.groups) ? (work.groups as WorkGroupInput[]) : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// The seam
// ─────────────────────────────────────────────────────────────────────────────

export const workJourneySeam: JourneyEngineSeam = {
  engine: 'work',

  rail: workRailAdapter,

  /**
   * STEP 01 — nothing else in the system writes `facts.work`, so without this
   * the rail projects over nothing. `seedWorkFactsFromEntry` (phase 1) is the
   * ONE seeding implementation — never re-derive it here.
   * Returns `null` seed ⇒ the draft goes out untouched (never an empty work bag).
   */
  enrichDraftForConfirm(draft: Brief): Brief {
    const seeded = seedWorkFactsFromEntry(
      (draft.facts?.['entry'] ?? null) as Parameters<typeof seedWorkFactsFromEntry>[0]
    );
    if (!seeded) return draft;
    // FULL-facts re-emit: `facts` is replaced wholesale downstream, so siblings
    // (facts.entry / facts.collections) must ride along (landmine 4).
    return { ...draft, facts: { ...(draft.facts ?? {}), work: seeded } };
  },

  steps: {
    // P4 fills the real copy (portfolio images + `add_photo_alternate`).
    showWork: {
      title: 'Show your work',
      body: 'Add a few images of your work.',
      icon: 'add_photo_alternate',
    },
    // P4 fills the real question list (name / what you sell / optional price).
    questions(_vm: RailVM): JourneyQuestion[] {
      return [];
    },
    plan: {
      // P4 wires the EXISTING chargeless work sitemap seed (behind the
      // `strategyStatus` idempotency guard — never the charged path).
      async prepare(): Promise<void> {},
      items(_state: JourneyWizardState): { title: string }[] {
        return [];
      },
    },
  },

  /**
   * P5 fills this: `workCopyEngineEnabled(templateId)` false ⇒
   * `{ok:false, reason:'engine-disabled'}` (explicit error at STEP 05, never a
   * silent skeleton), `getWorkFacts` null ⇒ `{ok:false, reason:'missing-facts'}`.
   * It stays SYNC and reads the kill-switch from the LEAF `@/lib/workCopyEngine`
   * (P5 relocates `workCopyEngineEnabled` there) — never a second env check here.
   *
   * Until then it is deliberately fail-CLOSED: landmine 2's failure mode is
   * "flag off ⇒ silent skeleton ⇒ empty reveal", so an unconditional `{ok:true}`
   * placeholder would reproduce it silently if P5 wired `runGeneration` and
   * forgot this. A loud dev-time failure beats a silent ship.
   */
  preflight(_state: JourneyWizardState) {
    return {
      ok: false as const,
      reason: 'engine-disabled' as const,
      message: 'preflight not wired',
    };
  },

  /** P5: lazy-imports `buildWorkInput` + `runWorkLLMGeneration` at CALL time. */
  async runGeneration(_state: JourneyWizardState) {
    return { ok: false as const, kind: 'error' as const, message: 'Generation is not wired yet.' };
  },

  /** P2b wires `@/modules/wizard/work/resumeStep`; P5 adds the mid-fan-out
   *  resume (lazy `isResumableGeneration`). Confirmed ⇒ STEP 02. */
  async resolveResumeStep(_loaded: JourneyLoadedDraft): Promise<JourneyStep> {
    return 2;
  },
};
