// src/modules/wizard/work/rail.ts
// ============================================================================
// WORK RAIL — the "What we understood" data model (work-onboarding-shell P1).
//
// The rail is a PROJECTION of `brief.facts.work` (WorkFactsSchema) — never a
// parallel store. This module owns four things:
//   1. `railFromFacts` / `railFromBrief` — facts → WorkRail (read side)
//   2. `seedWorkFactsFromEntry`          — entry facts → facts.work (confirm-time seed)
//   3. `applyRailEdit` / `appendUserNote`— rail edit → FULL-facts brief patch (write side)
//   4. `deriveRailPricePosition`         — PRICE POSITION is DERIVED, never stored
//
// ── HARD RULES (each unit-tested in rail.test.ts) ───────────────────────────
//   • FULL-FACTS RE-EMIT (landmine 4): `saveDraft` shallow-merges the brief and
//     REPLACES `facts` wholesale. A partial `{facts:{work}}` patch would DROP
//     `facts.entry` / `facts.collections`. Every patch here re-emits the
//     COMPLETE live facts bag with the work edit overlaid (pattern:
//     `buildBriefPatch`, useWizardStore.ts).
//   • SNAPSHOT SYNC (reviewer #6): the write result carries the merged facts bag
//     so the calling store action can persist AND update `state.briefFacts` in
//     the SAME `set` — otherwise edit #2 re-emits stale facts and reverts #1.
//   • CLIENT-SIDE ZOD PRE-VALIDATION (landmine 5): `saveDraft` returns 200 on an
//     invalid patch while SILENTLY dropping the brief write. Nothing leaves this
//     module without passing `WorkFactsSchema` + `BriefSchema.partial()`;
//     invalid ⇒ `{ok:false, error}` for the UI to surface.
//   • GROUP VALIDITY (landmine 6): every emitted group is
//     `{name, kind:'category', price:{mode:'on-request'}}` unless a caller
//     supplies a valid alternative. `kind` is REQUIRED by `WorkGroupSchema`; a
//     `kind`-less group ⇒ `getWorkFacts` null ⇒ work strategy 400 — and because
//     confirm/saveDraft PERSISTS the bad facts, a retry never recovers.
//   • IDENTITY REQUIRES NAME: `identity.name` is REQUIRED *inside* the optional
//     `identity` object. `{name: undefined}` fails parse ⇒ same null-facts
//     failure class. With no name we OMIT `identity` entirely.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   PURE module: zod + types only. No react, no stores, no hooks, no network,
//   no templateId literals. UI + store wiring land in P3.
// ============================================================================

import type { Brief } from '@/types/brief';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import {
  WorkFactsSchema,
  getWorkFacts,
  type WorkFacts,
  type WorkGroup,
  type WorkPrice,
} from '@/lib/schemas/workFacts.schema';
import type { EntryFacts } from '@/modules/brief/classify';
import {
  derivePricePosition,
  type PricePosition,
} from '@/modules/audience/work/pricePosition';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A "WHAT YOU SELL" chip — the group plus its rail-rendered price label. */
export interface WorkRailGroup {
  name: string;
  kind: WorkGroup['kind'];
  price: WorkPrice;
  /** Human chip label, e.g. "On request", "From 500", "1200". */
  priceLabel: string;
}

/**
 * The rail's view of a work brief. `null` / `[]` = UNKNOWN ⇒ the skeleton
 * (opacity-50 + stripes) state in the UI. Nothing here is a store: it is
 * recomputed from `facts.work` on every read.
 */
export interface WorkRail {
  /** `facts.work.identity.name` (rail edit mirrors into `fields['name']` — P3). */
  name: string | null;
  /** `facts.work.identity.descriptor` — "WHAT YOU DO". */
  descriptor: string | null;
  /** `facts.work.identity.location` — "WHERE". */
  location: string | null;
  /** `facts.work.identity.reach`. */
  reach: string | null;
  /** `facts.work.groups[]` — "WHAT YOU SELL". */
  groups: WorkRailGroup[];
  /** DERIVED from group prices — never stored. `null` = unknown (no prices). */
  pricePosition: PricePosition | null;
  /** `facts.work.languages[]` (NOT `brief.locales` — different i18n field). */
  languages: string[];
  // ── carried: modelled now, not all rendered in E1; generation branches on them.
  establishment: WorkFacts['establishment'] | null;
  dreamClient: string | null;
  praise: string[];
  contactMethod: WorkFacts['contactMethod'] | null;
  /** Append-only "Something wrong?" log. */
  userNotes: string[];
}

/** Loose group input from the seed / STEP 03 questions — normalized before emit. */
export interface WorkGroupInput {
  name: string;
  kind?: WorkGroup['kind'];
  price?: { mode?: WorkPrice['mode']; amount?: number; currency?: string };
}

/** One rail correction. `note` appends to `userNotes` (never overwrites). */
export type RailEdit =
  | { field: 'name'; value: string }
  | { field: 'descriptor'; value: string }
  | { field: 'location'; value: string }
  | { field: 'reach'; value: string }
  | { field: 'languages'; value: string[] }
  | { field: 'groups'; value: WorkGroupInput[] }
  | { field: 'note'; value: string };

/**
 * Result of a rail write. `patch` goes to `saveDraft`; `facts` is the SAME
 * merged bag for the store to sync into `state.briefFacts` in the same `set`.
 */
export type RailWriteResult =
  | { ok: true; patch: Partial<Brief>; facts: Record<string, unknown> }
  | { ok: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// Read side — projection
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_RAIL: WorkRail = {
  name: null,
  descriptor: null,
  location: null,
  reach: null,
  groups: [],
  pricePosition: null,
  languages: [],
  establishment: null,
  dreamClient: null,
  praise: [],
  contactMethod: null,
  userNotes: [],
};

function priceLabel(price: WorkPrice): string {
  if (price.mode === 'on-request') return 'On request';
  const amount = price.amount !== undefined ? String(price.amount) : '';
  const money = [price.currency, amount].filter(Boolean).join(' ');
  return price.mode === 'from' ? `From ${money}`.trim() : money;
}

/**
 * PRICE POSITION is DERIVED, NEVER STORED (scout §3 verdict). Unknown (`null`)
 * when there are no groups at all — the canonical `derivePricePosition` is
 * default-'middle' by design, which would render a confident-looking band over
 * zero evidence. With groups present we defer to the canonical rubric (one
 * source of truth for the band — this module never re-implements it).
 */
export function deriveRailPricePosition(
  work: WorkFacts | null | undefined
): PricePosition | null {
  if (!work) return null;
  const groups = work.groups ?? [];
  if (groups.length === 0) return null;
  return derivePricePosition(work);
}

/** Project parsed work facts onto the rail. `null` facts ⇒ all-unknown rail. */
export function railFromWorkFacts(work: WorkFacts | null | undefined): WorkRail {
  if (!work) return { ...EMPTY_RAIL };
  return {
    name: work.identity?.name ?? null,
    descriptor: work.identity?.descriptor ?? null,
    location: work.identity?.location ?? null,
    reach: work.identity?.reach ?? null,
    groups: (work.groups ?? []).map((g) => ({
      name: g.name,
      kind: g.kind,
      price: g.price,
      priceLabel: priceLabel(g.price),
    })),
    pricePosition: deriveRailPricePosition(work),
    languages: work.languages ?? [],
    establishment: work.establishment ?? null,
    dreamClient: work.dreamClient ?? null,
    praise: work.praise ?? [],
    contactMethod: work.contactMethod ?? null,
    userNotes: work.userNotes ?? [],
  };
}

/** Project a facts BAG (`brief.facts`) onto the rail. Invalid work ⇒ unknown. */
export function railFromFacts(
  facts: Record<string, unknown> | undefined | null
): WorkRail {
  return railFromWorkFacts(getWorkFacts(facts ?? undefined));
}

/** Project a Brief onto the rail. */
export function railFromBrief(brief: Brief | null | undefined): WorkRail {
  return railFromFacts(brief?.facts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Group normalization (landmine 6)
// ─────────────────────────────────────────────────────────────────────────────

function isValidAmount(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

/**
 * Normalize loose group input into a schema-valid `WorkGroup`, or `null` when
 * it cannot be (empty name) — a `kind`-less or invalid-price group is NEVER
 * emitted. Defaults: `kind:'category'` (entry offerings are category names;
 * `'story'` is the case-study shape and has no data here) and
 * `price:{mode:'on-request'}` unless a valid amount was supplied for
 * `exact`/`from`.
 */
export function normalizeWorkGroup(input: WorkGroupInput | null | undefined): WorkGroup | null {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  if (!name) return null;
  const kind: WorkGroup['kind'] = input?.kind === 'story' ? 'story' : 'category';

  const mode = input?.price?.mode;
  let price: WorkPrice = { mode: 'on-request' };
  if ((mode === 'exact' || mode === 'from') && isValidAmount(input?.price?.amount)) {
    price = { mode, amount: input!.price!.amount as number };
    if (typeof input?.price?.currency === 'string' && input.price.currency.trim()) {
      price.currency = input.price.currency.trim();
    }
  }
  return { name, kind, price };
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed — entry facts → facts.work (decision 4; run at confirm time)
// ─────────────────────────────────────────────────────────────────────────────

function trimmedString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t ? t : undefined;
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(trimmedString).filter((s): s is string => !!s);
}

/**
 * Confirm-time seed: `facts.entry` → `facts.work`. Nothing else writes
 * `facts.work` today, so without this the rail projects over nothing.
 *
 * Mapping:
 *   businessName            → identity.name       (OMITS `identity` entirely
 *                                                  when empty — `name` is
 *                                                  REQUIRED inside `identity`)
 *   summary ?? categories   → identity.descriptor
 *   offerings[]             → groups[] as {name, kind:'category',
 *                                          price:{mode:'on-request'}}
 *
 * DEFENSIVE BY CONTRACT: `getEntryFacts` is a raw cast, not a safeParse, so the
 * input here can be sparse or garbage. Returns `null` when there is nothing
 * worth seeding (or when the result would not parse) — the caller then simply
 * omits `facts.work`. The output ALWAYS passes `getWorkFacts`.
 */
export function seedWorkFactsFromEntry(
  entry: Partial<EntryFacts> | null | undefined
): WorkFacts | null {
  if (!entry || typeof entry !== 'object') return null;

  const name = trimmedString((entry as Record<string, unknown>)['businessName']);
  const summary = trimmedString((entry as Record<string, unknown>)['summary']);
  const categories = stringArray((entry as Record<string, unknown>)['categories']);
  const descriptor = summary ?? (categories.length ? categories.join(', ') : undefined);

  const groups = stringArray((entry as Record<string, unknown>)['offerings'])
    .map((offering) => normalizeWorkGroup({ name: offering }))
    .filter((g): g is WorkGroup => g !== null);

  const seeded: WorkFacts = {};
  if (name) {
    // `identity.name` is REQUIRED inside `identity` — never emit {name: undefined}.
    seeded.identity = { name, ...(descriptor ? { descriptor } : {}) };
  }
  if (groups.length) seeded.groups = groups;

  // Nothing worth persisting ⇒ emit nothing (never an empty/garbage work bag).
  if (!seeded.identity && !seeded.groups) return null;

  const parsed = WorkFactsSchema.safeParse(seeded);
  return parsed.success ? parsed.data : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Write side — full-facts re-emit + pre-validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the full-facts patch for `nextWork` over the LIVE facts bag. Exported
 * for callers (e.g. the confirm-time seed) that produce work facts directly.
 */
export function workFactsToBriefPatch(
  nextWork: WorkFacts,
  liveFacts: Record<string, unknown> | undefined | null
): RailWriteResult {
  const parsedWork = WorkFactsSchema.safeParse(nextWork);
  if (!parsedWork.success) {
    return { ok: false, error: parsedWork.error.issues[0]?.message ?? 'Invalid work facts' };
  }
  // FULL-FACTS RE-EMIT — siblings (facts.entry / facts.collections) preserved.
  const facts: Record<string, unknown> = { ...(liveFacts ?? {}), work: parsedWork.data };
  const patch: Partial<Brief> = { facts };
  // saveDraft validates with BriefSchema.partial() and SILENTLY drops invalid
  // brief writes (200 OK) — pre-validate with the same schema shape.
  const parsedPatch = BriefSchema.partial().safeParse(patch);
  if (!parsedPatch.success) {
    return { ok: false, error: parsedPatch.error.issues[0]?.message ?? 'Invalid brief patch' };
  }
  return { ok: true, patch, facts };
}

/**
 * Apply one rail correction to the live facts bag.
 *
 * Returns the `saveDraft` patch AND the merged facts bag (snapshot sync — the
 * store must set `state.briefFacts = result.facts` in the SAME `set` as the
 * save, or the next edit re-emits stale facts and reverts this one).
 *
 * Invalid edits (blank name, a descriptor/location with no name to hang
 * `identity` on, a group list that normalizes to nothing) return
 * `{ok:false, error}` — NOTHING is sent.
 */
export function applyRailEdit(
  edit: RailEdit,
  liveFacts: Record<string, unknown> | undefined | null
): RailWriteResult {
  const current = getWorkFacts(liveFacts ?? undefined) ?? {};
  const next: WorkFacts = {
    ...current,
    identity: current.identity ? { ...current.identity } : undefined,
  };

  switch (edit.field) {
    case 'name': {
      const name = edit.value.trim();
      if (!name) return { ok: false, error: 'Name cannot be empty' };
      next.identity = { ...(next.identity ?? {}), name };
      break;
    }
    case 'descriptor':
    case 'location':
    case 'reach': {
      if (!next.identity?.name) {
        return { ok: false, error: 'Add a name before adding other details' };
      }
      const value = edit.value.trim();
      next.identity = { ...next.identity, [edit.field]: value || undefined };
      break;
    }
    case 'languages': {
      const langs = stringArray(edit.value);
      next.languages = langs.length ? langs : undefined;
      break;
    }
    case 'groups': {
      const groups = edit.value
        .map(normalizeWorkGroup)
        .filter((g): g is WorkGroup => g !== null);
      if (edit.value.length > 0 && groups.length === 0) {
        return { ok: false, error: 'Each thing you sell needs a name' };
      }
      next.groups = groups.length ? groups : undefined;
      break;
    }
    case 'note': {
      const note = edit.value.trim();
      if (!note) return { ok: false, error: 'Note cannot be empty' };
      next.userNotes = [...(current.userNotes ?? []), note];
      break;
    }
  }

  if (!next.identity) delete next.identity;
  return workFactsToBriefPatch(next, liveFacts);
}

/** Append to the rail's "Something wrong?" log (append-only, never overwrites). */
export function appendUserNote(
  note: string,
  liveFacts: Record<string, unknown> | undefined | null
): RailWriteResult {
  return applyRailEdit({ field: 'note', value: note }, liveFacts);
}
