# qa-0718 — work-onboarding rail bugs B5/B6/B7 (audit)

## Files changed
- `src/lib/schemas/workFacts.schema.ts` — added optional `origin` to `WorkGroupSchema`.
- `src/modules/wizard/work/rail.ts` — carried `origin`, added representative `priceLabel`, gated `deriveRailPricePosition`.
- `src/modules/wizard/work/ingest/proposeGroups.ts` — tag NO-MATCH buckets `origin:'upload'`.
- `src/components/onboarding/journey/engines/work.ts` — toVM: filter uploads from WHAT YOU SELL + new WHAT YOU CHARGE row.
- `src/modules/wizard/work/rail.test.ts` — B5/B6/B7 regression tests + flipped the now-wrong B7 assertion.
- `src/components/onboarding/journey/engines/work.test.ts` — updated field-list assertions (8→9) + B5/B6 seam tests.

---

## B5 (P1) — uploads leak into "WHAT YOU SELL"

**Root cause.** `facts.work.groups[]` holds BOTH offer groups and E2 upload photo
buckets. `mergeProposalIntoGroups` NO-MATCH branch created a new group named after
the folder ("asset") or the capture day ("Mar 10, 2025"); the rail projected ALL
groups as WHAT YOU SELL chips, so buckets showed up as things the seller sells.

**Changes (root-cause, additive/back-compat).**
1. `WorkGroupSchema.origin: z.enum(['offer','upload']).optional()` — absent = legacy/offer, so pre-existing facts still parse.
2. Carried `origin` through `WorkGroupInput` + `normalizeWorkGroup` (verbatim, like `photos`/`slug`; absent stays absent).
3. `mergeProposalIntoGroups` NO-MATCH branch tags new buckets `origin:'upload'`; name-matched appends leave the existing group's origin untouched.
4. `railFromWorkFacts` projects `origin` onto `WorkRailGroup`; `work.ts` toVM filters `origin==='upload'` out of the WHAT YOU SELL chips **while preserving each survivor's original index for the chip id** (the chip-id join resolves ids against the FULL facts bag — renumbering would misattach edits). `skeleton` reflects the offer-only count.

Generation is unaffected — it reads `facts.work.groups[]` directly; only the rail DISPLAY filters.

**Tests.**
- `work.test.ts` "B5: WHAT YOU SELL chips EXCLUDE upload-origin groups" — offer+upload bag ⇒ chips `[g0 Weddings]` only (pre-fix: both); all-uploads ⇒ empty + skeleton.
- `work.test.ts` "mergeProposalIntoGroups tags a NEW bucket origin:upload" (single dated photo) + "name-matched append leaves origin UNTOUCHED".
- `rail.test.ts` "normalizeWorkGroup carries origin; absent stays ABSENT" + "railFromWorkFacts carries group origin".
- Pre-fix failure: origin absent everywhere ⇒ both chips shown / `merged[0].origin` undefined.

No deviation.

---

## B6 (P1) — answered charge doesn't show in rail

**Root cause.** The charge answer persists to `groups[].price` (via `commitGroupPrice`)
but no rail row read it — only the derived PRICE POSITION band, which doesn't move.

**Changes.**
- `WorkRail.priceLabel: string | null` + `representativePriceLabel()` in `rail.ts`: the first amount-bearing group price (`exact`/`from` with amount) rendered via the existing `priceLabel()` helper; `null` for on-request/no-groups.
- `work.ts` toVM adds a read-only `FIELD_PRICE` row labeled **WHAT YOU CHARGE**, placed between WHAT YOU SELL and PRICE POSITION; skeleton until an amount-bearing price exists.

**Documented D-C limit (carried, acceptable):** a seed on-request default is
indistinguishable from an answered "on request", so on-request answers stay
skeleton; amount-bearing answers become visible (the bug fixed).

**Tests.**
- `rail.test.ts` "priceLabel is null (skeleton) for seeded on-request-only" + "priceLabel fills after an amount-bearing answer through the edit door" (applyRailEdit — the single write gate `commitGroupPrice` routes through) ⇒ `'From EUR 2400'`.
- `work.test.ts` "WHAT YOU CHARGE row skeletons on-request, fills on an amount-bearing price" (e2Facts Weddings = from/2400/EUR).
- Pre-fix failure: no `priceLabel` field (undefined) / no `price` toVM row (`.find` undefined → throw).

**Minor in-scope deviation (logged):** the mandatory B6 test says "apply … via the
same edit door". The seam's `commitGroupPrice` is not exported and it derives
currency from the EXISTING group price (drops a currency passed in the answer), so
`fixtureFacts` (no currency) could not yield `'From EUR 2400'`. I applied the price
through `applyRailEdit({field:'groups'})` — the single write gate `commitGroupPrice`
itself routes through — which is the faithful "same edit door" and carries the EUR.
The seam-level toVM test uses `e2Facts` (whose group already carries EUR) to prove
the row renders. Conservative, equivalent coverage.

---

## B7 (P2) — premature "Price position: Mid-range"

**Root cause.** `deriveRailPricePosition` returned null ONLY for 0 groups; a seeded
on-request group defaulted to canonical 'middle' ⇒ a confident "Mid-range" band
with no evidence.

**Change.** `deriveRailPricePosition` now also returns null unless there is a
genuine signal — `hasPricePositionSignal`: an explicit stated price
(`exact`/`from` + amount) OR a premium/friendly keyword. Keyword detection
**reuses the canonical rubric** (`derivePricePosition({...work, groups:[]})` — prices
neutralized so only dreamClient/praise keywords can move the band), so no keyword
list is duplicated and `derivePricePosition` (the rubric) is untouched. Only the
rail-projection gate changed.

**Tests.**
- Flipped `rail.test.ts:182` on-request-only ⇒ `null` (was `'middle'`); kept the keyword/amount cases returning premium/friendly.
- Added mandatory "seeded on-request-only ⇒ null even though groups exist" and "a stated amount that nets to middle is still SHOWN".
- Pre-fix failure: on-request-only returned `'middle'`.

No deviation from the proposed fix.

---

## Test results
- `npx vitest run src/modules/wizard/work/rail.test.ts src/components/onboarding/journey/engines/work.test.ts` → **2 files, 99 tests passed**.
- `npx tsc --noEmit` → one error only: `src/app/page.tsx(6,26): TS2307 Cannot find module '@/assets/images/founder.jpg'`. UNRELATED to this phase (no app/asset file touched); pre-existing (missing jpg module declaration / stale `.next/types`). All files in scope type-check clean.

---

## B5 follow-up — BLOCKING regression fix (chip edit deleted upload buckets)

**Reviewer finding.** The B5 display filter created a destructive write path: toVM
emits offer-only chips → `ChipsEditor` seeds its draft from those offer-only chips →
on Save `commitGroupChips` rebuilt the groups array from ONLY the submitted chips →
`applyRailEdit({field:'groups'})` REPLACES the whole array, so every unreferenced
`origin:'upload'` bucket (and its photos) was permanently deleted by any WHAT YOU
SELL rename/add/remove. Worse than the original display bug.

**Fix (single gate, root cause).** In `commitGroupChips` (`work.ts`) — the chip
join is the only write path that rebuilds from the offer-only chip set; every other
`applyRailEdit({field:'groups'})` caller (price answer, correction verbs, the group
QUESTION append via `liveChips` which includes uploads) already passes the FULL
array. After building `next` from the chips, track which live indices the chips
referenced and re-append every live `origin:'upload'` group that was NOT referenced.
Offer chips still add/rename/remove; uploads (never rendered as chips) survive. No
duplication: the group-question path references uploads via `liveChips`, so they
land in `referenced` and are not re-appended. Offer deletion (unreferenced offer ⇒
deleted) is unchanged.

**Test (FAILs pre-fix, PASSes after).** `work.test.ts` "B5: a WHAT YOU SELL chip
edit PRESERVES origin:upload buckets + their photos (round-trip)" — offer
('Weddings') + upload bucket ('asset', with a photo); rename the visible chip + add
one through `rail.applyEdit('groups', {kind:'chips', …})` (the exact UI door);
assert the upload bucket + its photo still exist in `facts.work.groups[]`. Pre-fix
the REPLACE drops the upload group.

**Re-run:** `vitest run` → 2 files, **100 tests passed**. `tsc --noEmit` → only the
known unrelated `src/app/page.tsx` founder.jpg error. No new deviation.

## Open risks
- `derivePricePosition({...work, groups:[]})` keyword probe misses a praise-only *premium* keyword (a weak +1 that cannot move the band alone anyway) — treated as no-signal → skeleton. Conservative and consistent with the rubric.
- Pre-fix failure confirmed by code reasoning + HEAD inspection (fields/functions did not exist pre-change), not by running against HEAD (no checkout — orchestrator owns git state).
