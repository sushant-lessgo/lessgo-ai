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
  /**
   * Provenance (qa-0718 B5). `'upload'` groups are E2 photo buckets, NOT things
   * the seller sells — the "WHAT YOU SELL" rail DISPLAY filters them out. Absent
   * = offer/legacy. Carried so the seam can filter while chip ids stay indexed
   * against the FULL facts bag (the chip-id join reads raw facts).
   */
  origin?: WorkGroup['origin'];
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
  /**
   * Representative answered CHARGE label (qa-0718 B6) — "WHAT YOU CHARGE".
   * The first amount-bearing group price (`exact`/`from` with an amount), via
   * the `priceLabel()` helper; `null` when only on-request / no groups (the
   * honest skeleton — a seed on-request default is indistinguishable from an
   * answered "on request", a documented D-C limit).
   */
  priceLabel: string | null;
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

/**
 * Loose group input from the seed / STEP 03 questions — normalized before emit.
 *
 * `photos` / `items` are CARRIED, not authored, here: E2 image ingestion writes
 * them onto `facts.work.groups[]`, and because `applyRailEdit({field:'groups'})`
 * REPLACES the whole array, a rail edit that dropped them would silently wipe
 * ingested photos. Shapes are exactly `WorkGroupSchema`'s (never re-declared).
 */
export interface WorkGroupInput {
  name: string;
  kind?: WorkGroup['kind'];
  price?: { mode?: WorkPrice['mode']; amount?: number; currency?: string };
  /** Direct group-level photos (flat group) — carried through untouched. */
  photos?: WorkGroup['photos'];
  /** Second level (shoots / projects) — carried through untouched. */
  items?: WorkGroup['items'];
  /**
   * Board-owned stable slug (work-library-board) — carried verbatim like
   * `photos`/`items`. The dashboard seeds it (`slugify(name)`) and it survives a
   * rename; `normalizeWorkGroup` preserves a non-empty trimmed value. Callers
   * that omit it (onboarding seed / STEP 03) see no behaviour change.
   */
  slug?: string;
  /**
   * Provenance (qa-0718 B5) — carried verbatim like `photos`/`slug`. Set to
   * `'upload'` by `mergeProposalIntoGroups` for buckets it creates; callers that
   * omit it (onboarding seed / STEP 03 offers) leave it absent = offer/legacy.
   */
  origin?: WorkGroup['origin'];
}

/**
 * One rail correction. `note` appends to `userNotes` (never overwrites).
 *
 * The `establishment` / `dreamClient` / `praise` / `contactMethod` fields are the
 * STEP 03 question write paths (E3): they are already keys of `WorkFactsSchema`
 * (zero reshape), and `applyRailEdit` stays the SINGLE validation gate for them
 * (D-H). `languages` predates E3 (rail edit).
 */
export type RailEdit =
  | { field: 'name'; value: string }
  | { field: 'descriptor'; value: string }
  | { field: 'location'; value: string }
  | { field: 'reach'; value: string }
  | { field: 'languages'; value: string[] }
  | { field: 'groups'; value: WorkGroupInput[] }
  | { field: 'establishment'; value: 'new' | 'established' }
  | { field: 'dreamClient'; value: string }
  | { field: 'praise'; value: string[] }
  | { field: 'contactMethod'; value: 'whatsapp' | 'booking' | 'form' }
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
  priceLabel: null,
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
  // Currency is a SYMBOL (qa-0719 B2), so it sits DIRECTLY against the amount —
  // "$2400", not "$ 2400". Absent currency ⇒ just the amount.
  const money = price.currency ? `${price.currency}${amount}` : amount;
  return price.mode === 'from' ? `From ${money}`.trim() : money;
}

/**
 * Representative answered CHARGE label (qa-0718 B6). The first group with an
 * amount-bearing price (`exact`/`from` + a defined amount), rendered via
 * `priceLabel()`. `null` when only on-request / no groups — the rail then shows
 * the honest skeleton. (In E1 one blanket price is written across all groups, so
 * "first amount-bearing" IS the practice price; per-group pricing is deferred.)
 *
 * DOCUMENTED D-C LIMIT: a seeded on-request default is indistinguishable from an
 * answered "on request", so an on-request answer stays skeleton — but an
 * amount-bearing answer becomes visible, which is the bug this fixes.
 */
function representativePriceLabel(groups: WorkGroup[] | undefined): string | null {
  const g = (groups ?? []).find(
    (grp) => grp.price?.mode !== 'on-request' && grp.price?.amount !== undefined
  );
  return g ? priceLabel(g.price) : null;
}

/**
 * Is there a GENUINE pricing/positioning signal (qa-0718 B7)? A confident band
 * must not appear over zero evidence, so the rail projection gates on either:
 *   • an explicit STATED price (a group priced `exact`/`from` with an amount), or
 *   • a premium/friendly KEYWORD — detected by re-running the canonical rubric
 *     with prices NEUTRALIZED (`groups:[]`), so only the dreamClient/praise
 *     keyword families can move the band off `'middle'`. This REUSES the rubric's
 *     word lists (one source of truth) — no keyword list is duplicated here.
 * A seeded on-request-only bag has neither ⇒ no signal ⇒ null (skeleton).
 */
function hasPricePositionSignal(work: WorkFacts): boolean {
  const groups = work.groups ?? [];
  const statedPrice = groups.some(
    (g) => (g.price?.mode === 'exact' || g.price?.mode === 'from') && g.price?.amount !== undefined
  );
  if (statedPrice) return true;
  return derivePricePosition({ ...work, groups: [] }) !== 'middle';
}

/**
 * PRICE POSITION is DERIVED, NEVER STORED (scout §3 verdict). Unknown (`null`)
 * when there are no groups at all, OR when there is no genuine pricing/
 * positioning signal (qa-0718 B7) — the canonical `derivePricePosition` is
 * default-'middle' by design, which would render a confident-looking band over
 * zero evidence (e.g. a seeded on-request-only bag). Only once a real signal
 * exists do we defer to the canonical rubric (one source of truth for the band —
 * this module never re-implements it).
 */
export function deriveRailPricePosition(
  work: WorkFacts | null | undefined
): PricePosition | null {
  if (!work) return null;
  const groups = work.groups ?? [];
  if (groups.length === 0) return null;
  if (!hasPricePositionSignal(work)) return null;
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
      ...(g.origin ? { origin: g.origin } : {}),
    })),
    priceLabel: representativePriceLabel(work.groups),
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
 *
 * PRESERVES `photos` / `items` when supplied (E2 ingestion owns them). They are
 * carried verbatim — this module never authors or repairs them; a malformed
 * value simply fails `WorkFactsSchema` at emit time (`workFactsToBriefPatch` ⇒
 * `{ok:false}`), which is the same never-persist-garbage rule as everything
 * else here. Absent keys stay ABSENT (never `{photos: undefined}`).
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
  const group: WorkGroup = { name, kind, price };
  if (input?.photos !== undefined) group.photos = input.photos;
  if (input?.items !== undefined) group.items = input.items;
  // Board-owned stable slug — preserve a non-empty trimmed value; absent/blank
  // stays ABSENT (never `{slug: ''}`), so pre-board facts fall back to name→slug.
  if (typeof input?.slug === 'string' && input.slug.trim()) group.slug = input.slug.trim();
  // Provenance (qa-0718 B5) — carried verbatim; absent stays ABSENT (= offer).
  if (input?.origin === 'offer' || input?.origin === 'upload') group.origin = input.origin;
  return group;
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
/**
 * Derive "WHAT YOU DO" (identity.descriptor) from entry facts (qa-0719 B7).
 * Precedence: an explicit `summary`, else joined `categories`, else the
 * `oneLiner`, else the `rawInput`. The oneLiner/rawInput fallback ensures a
 * one-liner-only entry (no summary/categories) still answers the rail's
 * "WHAT YOU DO" row instead of leaving it a skeleton all session.
 */
function descriptorFromEntry(
  entry: Record<string, unknown> | null | undefined
): string | undefined {
  if (!entry || typeof entry !== 'object') return undefined;
  const summary = trimmedString(entry['summary']);
  const categories = stringArray(entry['categories']);
  const oneLiner = trimmedString(entry['oneLiner']);
  const rawInput = trimmedString(entry['rawInput']);
  return (
    summary ??
    (categories.length ? categories.join(', ') : undefined) ??
    oneLiner ??
    rawInput
  );
}

export function seedWorkFactsFromEntry(
  entry: Partial<EntryFacts> | null | undefined
): WorkFacts | null {
  if (!entry || typeof entry !== 'object') return null;

  const name = trimmedString((entry as Record<string, unknown>)['businessName']);
  const descriptor = descriptorFromEntry(entry as Record<string, unknown>);

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
      // B7 back-fill: a no-name one-liner entry seeds NO identity (name is
      // required inside identity), so its derived descriptor is dropped. Now
      // that a name exists, back-fill "WHAT YOU DO" from the live entry facts
      // (same precedence as the seed) unless one was already answered.
      if (!next.identity.descriptor) {
        const entry = liveFacts?.['entry'] as Record<string, unknown> | undefined;
        const descriptor = descriptorFromEntry(entry);
        if (descriptor) next.identity.descriptor = descriptor;
      }
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
    case 'establishment': {
      // Enum-constrained by the RailEdit type; WorkFactsSchema is the final gate.
      next.establishment = edit.value;
      break;
    }
    case 'dreamClient': {
      const value = edit.value.trim();
      if (!value) return { ok: false, error: 'Dream client cannot be empty' };
      next.dreamClient = value;
      break;
    }
    case 'praise': {
      // Empty array ⇒ UNSET the slot (never persist `praise: []`).
      const quotes = stringArray(edit.value);
      next.praise = quotes.length ? quotes : undefined;
      break;
    }
    case 'contactMethod': {
      next.contactMethod = edit.value;
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
