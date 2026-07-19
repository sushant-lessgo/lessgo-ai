// src/components/onboarding/journey/engines/types.ts
// ============================================================================
// THE JOURNEY SEAM CONTRACT — the durable artifact of work-onboarding-shell.
//
// The 6-step onboarding journey (01 one-line → 02 show-work → 03 questions →
// 04 plan → 05 build → 06 reveal, with a persistent "What we understood" rail)
// is UNIVERSAL. Only the step CONTENT varies per COPY ENGINE. The shell in
// `src/components/onboarding/journey/` is therefore engine-AGNOSTIC; everything
// engine-specific lives behind ONE object: `JourneyEngineSeam`.
//
// Precedent (this is a mirror, not an invention): the legacy wizard is already
// engine-seamed via `slotsForEngine()` + `getContract(engine).slotSkips`
// (`src/hooks/useWizardStore.ts`, `src/modules/engines/inputContracts.ts`) —
// a closed per-engine record of DATA + narrow functions consumed by shared
// machinery. Same shape here.
//
// ── HONESTY RULE (ruling ground truth) ──────────────────────────────────────
// An engine-agnostic rail UI is buildable; an engine-agnostic rail MODEL is
// NOT — only `workFacts.schema.ts` exists (there is no thingFacts/trustFacts).
// So the rail UI renders a generic PROJECTION (`RailVM`) and each engine
// supplies the adapter that produces it and constructs edits back onto its own
// facts. `work` is the only seam built (pilot). thing/trust are DECLARED, not
// filled — do not invent fact schemas or speculative seams for them.
//
// ── WHAT ENGINE #2 MUST IMPLEMENT (the reuse checklist) ─────────────────────
//   1. a facts schema for its engine (THE REAL BLOCKER — none exists today)
//   2. a rail adapter over it (its `rail.ts` equivalent; the phase-1 hard rules
//      apply: FULL-facts re-emit, zod pre-validate, `{patch, facts}` snapshot
//      sync, and the chip-id join rule below)
//   3. `enrichDraftForConfirm`
//   4. step content: `steps.showWork` copy, `steps.questions`, `steps.plan`
//   5. `preflight` + `runGeneration` over ITS generation driver
//   6. `resolveResumeStep`
//   7. an entry in `JOURNEY_SEAM_ENGINES` (`src/lib/journeyEngines.ts`) AND in
//      `registry.ts` — the drift guard forces both
//   8. a template-eligibility predicate (work's `isWorkCopyTemplate` equivalent)
// Everything else — shell, top bar, dot progress, rail UI, step frames, the
// STEP 06 reveal, the store slice, dispatch — is inherited verbatim.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
// TYPES ONLY. Every import here is `import type` (fully erased at compile), so
// this module contributes NO runtime edge. Seams load at STEP 01 — pre-confirm,
// on the entry page — so a single static value-import of the generation graph
// (`@/modules/wizard/generation/**`) from a seam would drag the template +
// generation bundle onto the entry path (landmine 14). Seam generation
// functions lazy-import their driver at CALL time.
// ============================================================================

import type { ComponentType } from 'react';
import type { Brief, CopyEngine } from '@/types/brief';
import type { WizardStore } from '@/hooks/useWizardStore';
// Type-only (erased at compile — contributes NO runtime edge, so the firewall
// header's "TYPES ONLY" rule holds). `JourneyStepProps` is the prop shape every
// agnostic step body receives; a seam's optional lazy step component is typed
// against it so the frame can render it interchangeably with its own stub.
import type { JourneyStepProps } from '../JourneyShell';

// ─────────────────────────────────────────────────────────────────────────────
// Wizard-state handles
//
// State is `useWizardStore` (decision 5) and `briefFacts` is the source of
// truth for generation. `WizardState` itself is not exported from the store;
// `WizardStore` (= state & actions) is the canonical exported shape, so the
// seam reads through it rather than a hand-copied narrowing that could drift.
// ─────────────────────────────────────────────────────────────────────────────

/** A wizard-store SNAPSHOT (what seam functions read). */
export type JourneyWizardState = WizardStore;

/**
 * A live store HANDLE (what `steps.plan.prepare` needs — it awaits store
 * actions such as the chargeless sitemap seed). Structural on purpose: zustand's
 * store api satisfies it without this contract importing zustand.
 */
export interface JourneyWizardApi {
  getState(): JourneyWizardState;
}

/**
 * The `/api/loadDraft` payload the resume rules read. Declared structurally
 * (the route has no exported response type); `finalContent` is deliberately
 * `unknown` — its shape is generation-owned and each engine interprets it.
 */
export interface JourneyLoadedDraft {
  brief?: Brief | null;
  audienceType?: string | null;
  templateId?: string | null;
  finalContent?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rail view-model — what the AGNOSTIC UnderstoodRail renders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One rail block. The rail knows NO field names: order, labels and kinds all
 * come from the adapter.
 *
 * `skeleton: true` = UNKNOWN ⇒ the opacity-50 + stripes state. It is not the
 * same as an empty string: unknown is honest, "" is a claim.
 */
export interface RailFieldVM {
  /** Seam-defined stable field id ('name' | 'descriptor' | 'groups' | …). */
  id: string;
  /** Mono header, e.g. "WHAT YOU SELL". */
  label: string;
  kind: 'text' | 'chips' | 'derived';
  /** For 'text' / 'derived'. `null` ⇒ unknown. */
  value: string | null;
  /**
   * For 'chips'. `id` is SEAM-ISSUED and stable WITHIN THIS PROJECTION ONLY —
   * see the chip stable-id rule on `RailChipEdit` before touching this.
   */
  chips?: { id: string; label: string }[];
  skeleton: boolean;
  editable: boolean;
}

/** ORDER = render order. (E1 work emits EXACTLY FOUR fields.) */
export interface RailVM {
  fields: RailFieldVM[];
}

/**
 * A chip as submitted back by the rail UI.
 *
 * ⚠️ CHIP STABLE-ID RULE — read in full; do NOT improvise.
 *
 *   **Chip ids are valid ONLY against the facts bag they were projected from.
 *   The shell MUST pass the current `briefFacts` as `liveFacts`, and MUST NOT
 *   carry a chip array across a commit.**
 *
 * Why ids exist at all: the rail's chip projection is LOSSY (work's
 * `WorkRailGroup` exposes only name/kind/price — the underlying group also
 * carries `photos`/`items` written by image ingestion), and a groups edit
 * REPLACES the whole array. So the adapter must rebuild every group from
 * `liveFacts`, joined to the edited chips by a handle that survives both a
 * RENAME (label-match breaks) and an ADD/REMOVE (positional index breaks).
 * That handle is the id.
 *
 * The contract only requires "stable within a projection"; each adapter picks
 * its derivation. Work derives `id = 'g' + index` in `liveFacts.work.groups[]`
 * at projection time — safe because a commit applies `RailCommit.facts` to
 * `briefFacts` in ONE `set` and the rail immediately re-projects, so the VM and
 * `liveFacts` can never be one edit apart. The one real hole is a STALE VM: a
 * chip draft held across someone else's group write would mis-join or
 * mis-delete. Hence the rule above — the UI keys/resets chip drafts on VM
 * re-projection, and never mints, reuses or reorders ids on its own.
 *
 * Join semantics (implemented by the adapter, guaranteed by its tests):
 *   • chip WITH an id      → that live entry, carrying its unprojected data
 *                            through; only the label (name) is updated
 *   • chip WITHOUT an id   → a NEW entry (seed defaults)
 *   • live entry unreferenced by any chip → DELETED
 *   • the edited array's ORDER → the new order
 */
export type RailChipEdit = { id?: string; label: string };

/** The value the rail UI submits for a field edit. */
export type RailEditValue =
  | { kind: 'text'; value: string }
  | { kind: 'chips'; value: RailChipEdit[] };

/**
 * The result of any rail write. The agnostic store action (`commitRail`)
 * applies it atomically; the seam declares the mirrors, the store knows no
 * engine.
 *
 *   • `patch`  — the `/api/saveDraft` brief patch. MUST re-emit the FULL facts
 *                bag (saveDraft REPLACES `facts` wholesale — a partial patch
 *                silently drops `facts.entry`; landmine 4).
 *   • `facts`  — the SAME merged bag, so the store can persist AND set
 *                `briefFacts` in one `set`. Without it, edit #2 re-emits stale
 *                facts and reverts edit #1.
 *   • `ok:false` — zod pre-validation failed. `saveDraft` returns 200 while
 *                silently dropping an invalid brief write (landmine 5), so an
 *                invalid edit is NEVER sent; the UI surfaces `error`.
 */
export type RailCommit =
  | {
      ok: true;
      patch: Partial<Brief>;
      facts: NonNullable<Brief['facts']>;
      /** Store-level field mirrors, e.g. work NAME → `fields['name']`. */
      fieldMirrors?: { fieldId: string; value: string }[];
    }
  | { ok: false; error: string };

/**
 * The engine's rail adapter — projection + edit construction over ITS facts.
 */
export interface JourneyRailAdapter {
  /**
   * Project a facts bag onto the rail VM. Any chip ids issued here are valid
   * ONLY against THIS `facts` bag (chip stable-id rule on `RailChipEdit`).
   * `undefined` / unparseable facts ⇒ an all-skeleton VM, never a throw.
   */
  toVM(facts: Brief['facts']): RailVM;
  /**
   * Construct one edit against the LIVE facts — never by rebuilding from the
   * VM (the projection is lossy). Chip edits JOIN ON id per the rule above.
   */
  applyEdit(fieldId: string, value: RailEditValue, liveFacts: Brief['facts']): RailCommit;
  /** Append to the rail's "Something wrong?" log (append-only). */
  appendNote(note: string, liveFacts: Brief['facts']): RailCommit;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 03 questions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A question descriptor. The agnostic StepQuestions renders the kinds; the
 * seam supplies the list and the commits. Every commit routes through the
 * engine's rail adapter, so an answer can never persist a malformed record
 * (work: never a `kind`-less group ⇒ never a null-facts strategy 400).
 *
 * The union was CLOSED at 3 kinds for E1 (ruling). E3 (work-onboarding-questions,
 * decision D-A) DELIBERATELY extends it with ONE new kind, `choice`, to express
 * chips / one-tap confirm / the establishment branch — needs the E1 `text` kind
 * cannot carry (no tap UX, no confirm posture). The union stays CLOSED at these
 * FOUR kinds; a 5th requires the same deliberate sanction. Other engines never
 * emit `choice`; the renderer switch in `StepQuestions.tsx` adds ONE case and
 * the existing text/group/price rendering is unchanged.
 *
 * Three OPTIONAL common fields sit on EVERY member:
 *   • `required?: true`   — drives the STEP-03 proceed gate (D-D).
 *   • `answered?: boolean` — drives answered-compact rendering (D-E).
 *   • `slot?: string`      — the GATING slot key (identity / groups / price / …).
 *     `id` is only a React-key / testid / commit hardcode handle and can DIFFER
 *     from the slot (work's identity question has `id:'name'`). The frame tracks
 *     session-answered + expand state by `slot` (falling back to `id`), so the
 *     gating layer's `session(slot)` re-render decision fires for EVERY slot —
 *     not just those whose id happens to equal the slot (qa-0719 B3).
 */
export type JourneyQuestion =
  | {
      id: string;
      slot?: string;
      kind: 'text';
      label: string;
      prefill?: string;
      required?: true;
      answered?: boolean;
      commit(value: string, liveFacts: Brief['facts']): RailCommit;
    }
  | {
      id: string;
      slot?: string;
      kind: 'group';
      label: string;
      required?: true;
      answered?: boolean;
      commit(name: string, liveFacts: Brief['facts']): RailCommit;
    }
  | {
      id: string;
      slot?: string;
      kind: 'price';
      label: string;
      required?: true;
      answered?: boolean;
      commit(
        price: { mode: 'exact' | 'from' | 'on-request'; amount?: number; currency?: string },
        liveFacts: Brief['facts']
      ): RailCommit;
    }
  | {
      id: string;
      slot?: string;
      kind: 'choice';
      label: string;
      /** The full tappable option set. `multi` renders ALL of these as chips. */
      options: { value: string; label: string }[];
      /** Multi-select (e.g. languages) ⇒ toggle chips + Save. Default single. */
      multi?: boolean;
      /** Free-text escape (e.g. dreamClient) ⇒ a small input + add. */
      allowCustom?: boolean;
      /**
       * Present ⇒ these options render in the ONE-TAP CONFIRM posture (prominent);
       * the rest render as quieter chips. For `multi`, suggested options are the
       * visually prominent ones within the full option list.
       */
      suggested?: string[];
      /**
       * The CURRENTLY COMMITTED value(s), projected from live facts (qa-0719
       * B5/B6). The renderer SEEDS its selection from this (so pre-selected /
       * already-answered chips arrive ACTIVE and Save is enabled without a
       * redundant tap), and the answered-compact summary reflects it — NOT
       * `suggested` (which is only the confirm candidate set).
       */
      selected?: string[];
      required?: true;
      answered?: boolean;
      commit(values: string[], liveFacts: Brief['facts']): RailCommit;
    };

/**
 * Upstream signals the seam's `questions()` needs beyond the rail VM (D-B).
 * The VM says what's UNKNOWN; ctx supplies profession wording key + confirm
 * suggestions + session-answered ids. Commits still route ONLY through the rail
 * adapter — ctx is read-only input, never a write door.
 */
export interface JourneyQuestionsContext {
  /** The brief/store `businessType` (profession wording key). Not in the facts
   *  bag, so `toVM` can't carry it. */
  businessType: string | null;
  /** The current facts bag (confirm-suggestions read `facts.entry`). */
  facts: Record<string, unknown> | undefined;
  /** Question ids answered this session (D-C price answered-detection). */
  sessionAnswered: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Generation surfaces (honestly engine-shaped)
// ─────────────────────────────────────────────────────────────────────────────

/** Progress stages the agnostic StepBuilding renders. Mirrors `GenerationStage`
 *  in `@/modules/wizard/generation` — restated (not imported) so this contract
 *  keeps ZERO edges to the generation graph (landmine 14). */
export type JourneyGenerationStage = 'strategy' | 'copy' | 'saving' | 'done';

/** Callbacks the seam drives while generating. Structurally compatible with
 *  `GenerationCallbacks` — same reason as above. */
export interface JourneyGenerationCallbacks {
  onStage?: (stage: JourneyGenerationStage) => void;
  onPageProgress?: (p: { done: number; total: number }) => void;
}

export type JourneyPreflightResult =
  | { ok: true }
  | { ok: false; reason: 'engine-disabled' | 'missing-facts'; message: string };

export type JourneyGenerationResult =
  | { ok: true }
  | { ok: false; kind: 'credits' | 'error'; message: string };

/** Journey steps the shell can resume into. STEP 01 is never resumed — it is
 *  pre-confirm and owned by the entry page. */
export type JourneyStep = 2 | 3 | 4 | 5 | 6;

// ─────────────────────────────────────────────────────────────────────────────
// Shared step-config shape (the SHARED ALTITUDE for lazy step components — D9)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The display config shared by the agnostic step FRAMES: mono title, body copy,
 * icon — PLUS the optional lazy engine component (`loadStep`).
 *
 * ── WHY `loadStep` LIVES HERE, NOT BOLTED ONTO `showWork` (founder-signed seam) ─
 * STEP 02 (E2, `showWork`) is the first step to need a real, engine-specific
 * body (image ingestion) instead of a shared stub. STEP 03 (E3 questions) and
 * STEP 04 (E4 plan) will need the SAME escape hatch. So the field is defined
 * ONCE, on this shared shape, and every step-config that wants a lazy body
 * points at `JourneyStepConfig` — E3/E4 REUSE this exact field rather than
 * re-widening the seam a second/third time.
 *
 * The agnostic frame renders `React.lazy(loadStep)` when present, else its own
 * default stub. FIREWALL: `loadStep` is a DYNAMIC `import()` invoked at RENDER
 * time (post-confirm, on the step), so the engine body never lands on the
 * pre-confirm entry bundle — the seam declares the loader but does not statically
 * pull it (`journeyAgnostic.test.ts`).
 */
export interface JourneyStepConfig {
  title: string;
  body: string;
  icon: string;
  /**
   * OPTIONAL lazy engine-specific step body. Absent ⇒ the frame renders its
   * default stub (every non-work engine keeps the stub for now). Present ⇒ the
   * frame renders this component, passed the `JourneyStepProps` (`seam` + chrome
   * callbacks). Additive on purpose: other engines' step configs stay untouched.
   */
  loadStep?: () => Promise<{ default: ComponentType<JourneyStepProps> }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// The seam
// ─────────────────────────────────────────────────────────────────────────────

export interface JourneyEngineSeam {
  engine: CopyEngine;

  /** Rail projection + edits over this engine's facts. */
  rail: JourneyRailAdapter;

  /**
   * STEP 01 — enrich the classified draft BEFORE `/api/brief/confirm`.
   * (work: `facts.work = seedWorkFactsFromEntry(facts.entry)` — nothing else
   * writes `facts.work`, so without this the rail projects over nothing.)
   * PURE: returns the draft to POST; never persists.
   */
  enrichDraftForConfirm(draft: Brief): Brief;

  steps: {
    /** 02 — display config + an OPTIONAL lazy engine body (`loadStep`, D9). The
     *  agnostic frame renders the lazy body when present, else the stub. */
    showWork: JourneyStepConfig;
    /** 03 — only the questions still needed, given the current rail + ctx.
     *  `ctx` (D-B) supplies upstream signals (profession wording key, confirm
     *  suggestions, session-answered ids) the VM alone can't carry. */
    questions(vm: RailVM, ctx: JourneyQuestionsContext): JourneyQuestion[];
    /** 04 — `prepare` runs once on entry (work: the CHARGELESS sitemap seed,
     *  behind the existing idempotency guard — never the charged path). `items`
     *  is the read-only stub projection every non-work engine still renders.
     *
     *  STEP-04 REUSE of the founder-signed `loadStep?` (see `JourneyStepConfig`
     *  above — the field is defined ONCE and explicitly reserved for STEP 04).
     *  When present the agnostic frame renders this lazy engine body (E4's rich
     *  plan: photos + plain-word rows + goal badges); when absent it falls back
     *  to the `items()` stub. SAME field, SAME signature — NOT a new seam
     *  mechanism, and it does not re-widen the seam a third time. */
    plan: {
      prepare(wizardApi: JourneyWizardApi): Promise<void>;
      items(state: JourneyWizardState): { title: string }[];
      loadStep?: JourneyStepConfig['loadStep'];
    };
  };

  /**
   * 05 — HONESTLY engine-shaped: there is no generic generation driver, so the
   * seam OWNS the drive and the agnostic step owns only UI + state routing.
   * Do not pretend otherwise; engine #2 supplies its own.
   *
   * `preflight` is SYNC (and must stay so): its kill-switch check reads a
   * LEAF module, never the generation graph. Never re-implement an env check
   * inside a seam — one kill-switch source, ever.
   */
  preflight(state: JourneyWizardState): JourneyPreflightResult;
  /** Lazy-imports its generation driver at CALL time (landmine 14). */
  runGeneration(
    state: JourneyWizardState,
    cb: JourneyGenerationCallbacks
  ): Promise<JourneyGenerationResult>;
  /** Where a returning user re-enters the journey. Lazy-imports anything heavy. */
  resolveResumeStep(loaded: JourneyLoadedDraft): Promise<JourneyStep>;
}
