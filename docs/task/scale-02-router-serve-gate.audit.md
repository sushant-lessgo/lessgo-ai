# scale-02 — implementation audit

## Phase 1 — pure brief modules

**Files changed**
- `src/modules/brief/classify.ts` (created)
- `src/modules/brief/serveGate.ts` (created)
- `src/modules/brief/bridge.ts` (created)
- `src/modules/brief/playback.ts` (created)
- `src/modules/brief/classify.test.ts` (created)
- `src/modules/brief/serveGate.test.ts` (created)
- `src/modules/brief/bridge.test.ts` (created)
- `src/modules/brief/README.md` (created)
- `docs/task/scale-02-router-serve-gate.audit.md` (this file, created)

### Per-file notes

**classify.ts** — `EntrySignals` interface (raw AI shape per plan step 1),
`resolveEngine` (known-type config lookup → source `'lookup'`; unknown → 5-rung
tiebreaker ladder → source `'tiebreaker'`; return type is the full 5-engine
`ResolvedEngine` union, wider than the schema enum), `buildBriefDraft` (D2:
`copyEngine` set only for thing/trust/work; place/quick-yes carried ONLY in
`facts.entry.resolvedEngine`; result `BriefSchema.parse`d), `applyBusinessTypeCorrection`
(D7 single correction path: resets `classificationSource='lookup'`,
`tiebreaker='none'`, `resolvedEngine=<lookup engine>`; immutable — re-parses),
`LOW_CONFIDENCE_THRESHOLD = 0.6`. Added `EntryFacts` interface +
`getEntryFacts(brief)` typed reader for the loose `facts` record (serveGate +
bridge share it — not named in the plan but the natural home is classify.ts,
same file list).

**serveGate.ts** — `decideServe` exactly per D2: out-of-icp exclusive
short-circuit; clause collection in canonical order rungC → rungE → bridge →
rungA; rungC gallery is source-gated (`tiebreaker` source + `portfolio-is-proof`)
and evaluated via per-template `fit(t, facts.entry.resolvedEngine, caps+'gallery')`
(NOT `shortlist()` — it recomputes caps); rungE NOT known-gated; `bridge:work`
known-gated. `BRIDGEABLE_ENGINES` const with the spec-06 unlock comment.
Reviewer note 1 honored: template pick uses `templateMeta[t].designStyles.includes(style)`
(ARRAY — confirmed field name in templateMeta.ts). Reviewer note 3 honored: pick
order = `designStyleHint` first → `businessTypes[bt].defaultStyle` retry →
`shortlist[0]`.

**bridge.ts** — `briefToProductPrefill` / `briefToServicePrefill` (both accept
`Brief | null | undefined`, return `null` when `facts.entry` absent — hydrate
no-op guard), `serviceTypeForBusinessType` (agency→agency,
consultant→consultancy, coach→coaching, fallback `'agency'`), goalIntent→
`ServiceGoal` map (5 direct name matches) and goalIntent→product `LandingGoal`
map (waitlist/signup-free→signup/free-trial/buy-via-link→buy/request-demo→demo/
download-app→download/enquiry); unmapped intents omitted; `deliveryModel`
defaults `'remote'` when null.

**playback.ts** — `playbackSentence` ("A page for your {category|label} that
gets visitors to {goal label, lowercased}.", fallback goal phrase "take
action") + `chooserCards()` (6 businessType labels + "Something else"). All
user copy centralized for founder review.

### Key decisions / deviations

1. **Empty-missing fallback tag (reviewer note 2):** implemented as — after all
   clauses, if outcome is manual and `tags` is empty, emit
   `rungC:<first-unmet-capability>` where first-unmet = first cap from
   `requiredCapabilitiesFromBrief(brief)` that NO template can fit individually
   for the resolved engine; falls back to `caps[0]`, then literal
   `'shortlist-empty'` if the caps list is somehow empty. Covered by a test
   (saas + `download-app` derives `store-badges`, uncovered by any template ⇒
   `missing==='rungC:store-badges'`). The six acceptance fixtures are
   unaffected (they all collect a tag before the fallback).
2. **`getEntryFacts` helper + `EntryFacts` type** added to classify.ts (not
   explicitly in the plan's export list) — `brief.facts` is
   `Record<string, unknown>`, so serveGate/bridge need one sanctioned typed
   reader. Cast-based (no zod re-validation) — the draft is always produced by
   `buildBriefDraft`/`applyBusinessTypeCorrection` in-process this phase;
   server-side re-validation belongs to the confirm route (phase 4).
3. **`booking-payments` platformNeeds is NOT out-of-icp** — plan D2 table names
   checkout/ordering only; conservative literal reading.
4. **`playbackSentence` goal fallback** — brief with no goal renders "…get
   visitors to take action." (plan template assumes a goal exists; conservative
   fallback, copy is founder-reviewable in playback.ts).
5. Signature adaptations vs plan: none needed — all scale-01 imports matched
   the plan (`fit(templateId, engine, required)`, `shortlist(brief)`,
   `requiredCapabilitiesFromBrief(brief)`, `templateMeta[*].designStyles`
   array, `businessTypes[*].{copyEngine,defaultStyle,label}`,
   `goalIntentMeta[*].{label,mechanisms}`).

### Verification

- `npx tsc --noEmit` — clean (no output).
- `npx vitest run src/modules/brief` — `Test Files 3 passed (3) · Tests 40 passed (40)`.
- `npm run test:run` — `Test Files 63 passed | 1 skipped (64) · Tests 874 passed | 2 skipped (876)` (no pre-existing test touched).
- Firewall grep — no file outside `src/modules/brief` references `@/modules/brief` (zero runtime change confirmed).
- Branch: `feature/scale` (guard passed before edits).

### For the impl-reviewer

- Acceptance `missing` strings are asserted with strict equality in
  serveGate.test.ts, incl. photographer's "exactly 2 tags, no bridge:work".
- `shortlist(brief)` reading `brief.copyEngine` internally is intentional and
  safe (only consulted when known + engine ∈ {thing,trust}, where copyEngine
  is set and equals resolvedEngine) — see inline comment.
- The gallery/rungC augmented check deliberately scans ALL templateIds via
  `fit()` (retired/bespoke are rejected inside `fit`), so lumen (bespoke,
  gallery-capable) correctly does NOT satisfy it.
