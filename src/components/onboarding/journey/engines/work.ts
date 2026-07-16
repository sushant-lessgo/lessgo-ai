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
//     • `@/lib/schemas/workFacts.schema`  (pure: zod)
//     • `@/lib/workCopyEngine`            (zero-dep leaf — hosts BOTH
//        `isWorkCopyTemplate` and, since P5, the `workCopyEngineEnabled`
//        kill-switch, precisely so `preflight` can stay SYNC without importing
//        `work.llm.ts`)
//     • `@/types/brief` + `./types`       (types only)
//     • local copy strings
// and NOTHING else. In particular NEVER `@/modules/wizard/generation/**` or
// `@/modules/generation/**`: `work.llm.ts`'s module top statically pulls
// `preloadTemplate` + `multiPageAssembly`, so one static import here puts the
// whole template + generation graph on the entry path. `runGeneration` /
// `resolveResumeStep` lazy-import their drivers at CALL time (the
// `useWizardStore` lazy-adapter pattern).
//
// STATUS (P5): COMPLETE for E1 — rail adapter, entry enrichment, step content,
// preflight, generation drive and resume rules are all real.
// ============================================================================

import type { Brief } from '@/types/brief';
import { getWorkFacts } from '@/lib/schemas/workFacts.schema';
import { workCopyEngineEnabled } from '@/lib/workCopyEngine';
import {
  railFromFacts,
  applyRailEdit,
  appendUserNote,
  seedWorkFactsFromEntry,
  type WorkGroupInput,
} from '@/modules/wizard/work/rail';
// Pure resume rules (P2b). Allowed at module top BECAUSE it is pure — it
// lazy-imports `isResumableGeneration` at call time (P5). A static generation
// import THERE would re-drag the template+generation graph onto this seam, and
// therefore onto the pre-confirm entry path; `journeyAgnostic.test.ts` asserts
// it does not.
import { resolveWorkResumeStep } from '@/modules/wizard/work/resumeStep';
import type {
  JourneyEngineSeam,
  JourneyGenerationCallbacks,
  JourneyGenerationResult,
  JourneyLoadedDraft,
  JourneyPreflightResult,
  JourneyQuestion,
  JourneyRailAdapter,
  JourneyStep,
  JourneyWizardApi,
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

/** The live groups as chips, ids issued against THIS bag (chip stable-id rule). */
function liveChips(liveFacts: Brief['facts']): RailChipEdit[] {
  return liveGroups(liveFacts).map((g, i) => ({ id: chipId(i), label: g.name }));
}

/**
 * STEP 03's PRICE answer (P4). There is no `price` rail field — price lives on
 * each group — so this rebuilds the groups from `liveFacts` with the answered
 * price overlaid, and routes through `applyRailEdit({field:'groups'})` like
 * every other write. `photos`/`items` therefore ride along untouched (the same
 * reason the chip join exists); only `price` changes.
 *
 * E1 asks ONE price for the whole practice (thin by design — per-group pricing
 * is E3). `on-request` is the default and always valid; `exact`/`from` REFUSE
 * without a finite amount rather than silently degrading to `on-request`
 * (`normalizeWorkGroup` would degrade — a rail headed WHAT WE UNDERSTOOD must
 * not quietly record something the user did not say).
 */
function commitGroupPrice(
  price: { mode: 'exact' | 'from' | 'on-request'; amount?: number },
  liveFacts: Brief['facts']
): RailCommit {
  const live = liveGroups(liveFacts);
  if (live.length === 0) return { ok: false, error: 'Add what you sell before pricing it' };
  if (price.mode !== 'on-request') {
    const amount = price.amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
      return { ok: false, error: 'Enter an amount, or choose “On request”' };
    }
  }
  const next: WorkGroupInput[] = live.map((g) => ({
    ...g,
    price:
      price.mode === 'on-request'
        ? { mode: 'on-request' as const }
        : { mode: price.mode, amount: price.amount, currency: g.price?.currency },
  }));
  return applyRailEdit({ field: 'groups', value: next }, liveFacts);
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
    // STEP 02 content. E1 renders it as a non-functional dropzone stub + "Skip
    // for now" — the upload pipeline (and the scrape) are E2.
    showWork: {
      title: 'Show your work',
      body: 'Your images are what sells the work. Add a few and we’ll build the site around them — or skip and add them later in the editor.',
      icon: 'add_photo_alternate',
    },

    /**
     * STEP 03 — ONLY the questions still needed, read off the rail projection
     * (never off the facts bag: the VM is the seam's own contract with the
     * frame, and it already says what is unknown).
     *
     *   • NAME  — only when the rail has none (the entry seed usually supplies it)
     *   • WHAT YOU SELL — only when the seed produced NO groups. This ask-if is
     *     load-bearing beyond tidiness: the rail's chips editor is the only
     *     OTHER group writer, so keeping this question off while chips exist is
     *     what makes the chip stable-id rule's stale-VM hole unreachable in E1.
     *   • PRICE — optional, offered once there is something to price. Default
     *     `on-request`.
     *
     * Every commit routes through the rail adapter ⇒ groups are always
     * `kind`-valid (landmine 6: a `kind`-less group nulls `getWorkFacts`, 400s
     * the work strategy, and PERSISTS — a retry never recovers).
     */
    questions(vm: RailVM): JourneyQuestion[] {
      const field = (id: string) => vm.fields.find((f) => f.id === id);
      const name = field(FIELD_NAME);
      const groups = field(FIELD_GROUPS);
      const questions: JourneyQuestion[] = [];

      if (!name || name.skeleton) {
        questions.push({
          id: FIELD_NAME,
          kind: 'text',
          label: 'What should we call you?',
          prefill: name?.value ?? '',
          commit: (value, liveFacts) =>
            workRailAdapter.applyEdit(FIELD_NAME, { kind: 'text', value }, liveFacts),
        });
      }

      if (!groups || groups.skeleton) {
        questions.push({
          id: FIELD_GROUPS,
          kind: 'group',
          label: 'What do you sell?',
          // APPEND through the chip join (ids re-read from the live bag), so
          // this can never delete a group even if it somehow fires with groups
          // present.
          commit: (groupName, liveFacts) =>
            commitGroupChips([...liveChips(liveFacts), { label: groupName }], liveFacts),
        });
      } else {
        questions.push({
          // A QUESTION id, not a rail field id: price is not an editable rail
          // field (PRICE POSITION is derived) — it is written onto the groups.
          id: 'price',
          kind: 'price',
          label: 'Roughly what do you charge?',
          // ⚠️ E3 NOTE (recorded, deliberately NOT fixed in E1): this answer is
          // BLANKETED onto EVERY group (see `commitGroupPrice`). Correct today —
          // E1 asks ONE price for the practice and the entry seed prices every
          // group uniformly `on-request`, so there is no per-group price to
          // clobber. The DAY E3 introduces per-group pricing, this one question
          // silently overwrites all of it. Split the question per group (or scope
          // the commit) THEN — not before.
          commit: commitGroupPrice,
        });
      }

      return questions;
    },

    plan: {
      /**
       * STEP 04 — the EXISTING chargeless work sitemap seed (landmine 8).
       *
       * `fetchStrategy` is the ONE door: for `work` + a multipage template it
       * seeds `sitemap` from the page-archetype defaults with ZERO LLM fetch and
       * ZERO credit charge, behind its own `strategyStatus` idempotency guard
       * (so back-nav re-entry is a no-op). It returns BEFORE the charged
       * thing/trust path — never call a strategy route from here, and never add
       * a second fetch.
       *
       * By design (do not "fix"): `state.strategy` stays NULL on this path — the
       * real strategy call happens inside `runWorkLLMGeneration` at STEP 05.
       */
      async prepare(wizardApi: JourneyWizardApi): Promise<void> {
        await wizardApi.getState().fetchStrategy();
      },
      /** The seeded sitemap, as page cards. No add/rename/reorder in E1 (E4). */
      items(state: JourneyWizardState): { title: string }[] {
        const sitemap = (state.sitemap ?? []) as {
          title?: unknown;
          archetypeKey?: unknown;
        }[];
        return sitemap
          .map((page) => {
            const title =
              typeof page?.title === 'string' && page.title.trim()
                ? page.title.trim()
                : typeof page?.archetypeKey === 'string'
                  ? page.archetypeKey
                  : '';
            return { title };
          })
          .filter((p) => p.title !== '');
      },
    },
  },

  /**
   * STEP 05's two hard preconditions, checked BEFORE anything is charged or
   * written. SYNC by contract: the kill-switch comes from the zero-dep LEAF
   * `@/lib/workCopyEngine`, so this needs no `await` and drags no generation
   * code onto the pre-confirm entry path (landmine 14). NEVER re-implement the
   * env read here — one kill-switch source, ever.
   *
   * (a) FLAG (landmine 2). `NEXT_PUBLIC_WORK_COPY_ENGINE` off (or a template
   *     off the allow-list) ⇒ an EXPLICIT error. The failure mode this exists to
   *     kill is the SILENT one: the legacy wizard's fork falls through to
   *     `runWorkSkeleton` when the flag is off, and a skeleton in the JOURNEY
   *     means STEP 06 reveals an EMPTY site as though it were the finished
   *     thing. The journey has no skeleton path — it says so instead.
   *     Near-unreachable via dispatch (`isJourneyEligible` already gates on
   *     `isWorkCopyTemplate`), but the flag is orthogonal to eligibility and is
   *     build-time inlined: a prod deploy with the flag off would land here.
   *
   * (b) FACTS (landmine 6). `getWorkFacts` null ⇒ the work strategy route 400s
   *     UNRECOVERABLY (a `kind`-less group persists, so a retry never fixes
   *     it). The rail/questions are what collect this, so the honest recovery is
   *     STEP 03 — not a retry button.
   */
  preflight(state: JourneyWizardState): JourneyPreflightResult {
    if (!workCopyEngineEnabled(state.templateId)) {
      return {
        ok: false,
        reason: 'engine-disabled',
        message:
          'Site building is switched off for this account right now. Nothing has been charged — please contact support.',
      };
    }
    // The LIVE bag — `briefFacts` is what generation itself reads
    // (`resolveWorkBrief` → `buildWorkInput`), so preflighting anything else
    // would check a different thing than the one that runs.
    if (!getWorkFacts((state.briefFacts ?? undefined) as Record<string, unknown> | undefined)) {
      return {
        ok: false,
        reason: 'missing-facts',
        message: 'We still need a couple of details before we can write your site.',
      };
    }
    return { ok: true };
  },

  /**
   * The drive. `runWorkLLMGeneration` is used VERBATIM (landmine 7): the
   * saveDraft-before-copy skeleton, per-page persistence, mid-fan-out resume and
   * — critically — the MANDATORY `finalizeMultiPageGeneration` all live inside
   * it. Re-implementing any of that here would, at minimum, leave the
   * in-progress marker in place, and the editor would treat a finished site as
   * mid-generation forever.
   *
   * BOTH imports are LAZY (landmine 14): `work.llm.ts`'s module top statically
   * pulls the template registry + multi-page assembly, and this seam is loaded
   * PRE-CONFIRM at STEP 01. `journeyAgnostic.test.ts` enforces the static half;
   * this is the sanctioned dynamic escape hatch.
   *
   * The callbacks pass straight through — `JourneyGenerationCallbacks` is a
   * restatement of `GenerationCallbacks` (the contract keeps zero edges to the
   * generation graph), so they are structurally the same object.
   */
  async runGeneration(
    state: JourneyWizardState,
    cb: JourneyGenerationCallbacks
  ): Promise<JourneyGenerationResult> {
    const [{ buildWorkInput }, { runWorkLLMGeneration }] = await Promise.all([
      import('@/hooks/useWizardStore'),
      import('@/modules/wizard/generation/work.llm'),
    ]);

    const result = await runWorkLLMGeneration(buildWorkInput(state), cb);

    // Distinct kinds: credits is a BILLING dead-end (a retry burns nothing but
    // time), an error is retryable. `redirectTo` is deliberately DROPPED — the
    // journey's STEP 06 owns forward motion, not the driver's editor redirect.
    if (result.status === 'done') return { ok: true };
    if (result.status === 'credits') {
      return {
        ok: false,
        kind: 'credits',
        message: 'You’re out of credits — top up and we’ll pick up where we left off.',
      };
    }
    return { ok: false, kind: 'error', message: result.error || 'We couldn’t finish your site.' };
  },

  /**
   * Delegates to the work resume rules (`@/modules/wizard/work/resumeStep` — a
   * pure module, so a static import here is firewall-clean; see that file's
   * header before adding an import to IT). Confirmed ⇒ STEP 02; an in-progress
   * generation ⇒ STEP 05 (via a LAZY `isResumableGeneration`); finished content
   * ⇒ STEP 06.
   *
   * The shell MUST pass `loaded.finalContent` for the latter two to fire — P5
   * widened `page.tsx` load-detection → `JourneyShell` → here to do that. See
   * resumeStep.ts's header before touching any link in that chain.
   */
  resolveResumeStep(loaded: JourneyLoadedDraft): Promise<JourneyStep> {
    return resolveWorkResumeStep(loaded);
  },
};
