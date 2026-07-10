# serve-gate-v2 — implementation plan

- **Branch:** `feature/serve-gate-v2`
- **Spec:** `docs/task/serve-gate-v2.spec.md` (the contract; read first — plus the spec-acceptance correction below)
- **Date:** 2026-07-10 (rev 2, post plan-review)

## Overview

Rewrite the serve-gate law so it answers "can we serve this conversion job with templates + capabilities + **shared blocks**?" Three fixes: (1) capability satisfaction in `fit()` gains a declared shared-block capability registry, so `lead-form`/`store-badges` mechanism needs stop rejecting granth/meridian-only briefs (F15/F16); (2) AI-inferred `structure.mode==='multi'` is demoted from hard filter to soft signal — it never rejects, still prefills 7b where a multipage-capable template exists, and acts as a style-subordinate tiebreak in the pick (F13); (3) the `/admin` Business Types serveability table calls the **same** `decideServe` function per businessType × likelyIntent, so gate and admin can never disagree. True rejections (`rungC:gallery`, `rungA:unclassified`, `out-of-icp`, `rungE:*`) and their strict `missing` strings survive untouched — the demand board depends on them.

## Progress log

- phase 1 shared-block capability declaration: done (commit afca06ee, review loops 1)
- phase 2 gate law rewrite (fit satisfaction + soft multipage) + test rewrite: done (commit cb6f9534, review loops 1)
- phase 3 admin serveability matrix unification: done (commit 93ddd62b, review loops 1) — HUMAN GATE pending

## Spec-acceptance correction (orchestrator ruling, binding)

Spec acceptance line 1 says the Wingrrowth-shape Brief (trust engine, M1, inferred `multi`) gets a "7b sitemap prefilled multi-page". **That is unsatisfiable as written:** no trust-engine template (hearth/lex/surge) declares `multipage`, so `isMultipage()` is false regardless of `structure.mode`, and adding a trust multipage template is scope-OUT per the spec. Corrected acceptance: **Wingrrowth SERVES with a single-page 7b** — the inferred `multi` is harmlessly dropped because no trust multipage template exists. Serving is the win; the multipage prefill only applies where a multipage-capable template exists for the engine (today: thing/vestria). Multi-page prefill is therefore verified separately with a thing-engine brief (design decision 5). Testers following the original spec line would log a false-fail — use this correction.

## Key design decisions

1. **Satisfaction lives in `fit()`** (`src/modules/templates/fit.ts:20`): a required capability is satisfied by `meta.capabilities` **∪** shared-block-satisfied capabilities. One function → gate shortlist, rungC gallery probe, fallback tag finder, admin, and editor template-swap all read the same law. Retired/bespoke exclusion and engine match unchanged and checked first.
2. **Requirements stay modeled.** `requiredCapabilitiesFromBrief()` keeps deriving `M1 → lead-form` and `download-app → store-badges` (a future mechanism may lack a shared block; only *satisfaction* changes). It **drops** the `structure.mode==='multi' → multipage` derivation (fit.ts:67) — inference never rejects. `requiredCapabilitiesFromStructure()` (fit.ts:98) **keeps** its `mode==='multi' ⇒ multipage` clause: that runs on the USER-CONFIRMED 7b structure (useWizardStore only retains real 7b writes, not classify's bare hint — useWizardStore.ts:215-217), and the swap gate correctly needs it.
3. **Shared-block capability registry = declared pure data** (D9): new `src/modules/generatedLanding/sharedBlocks/capabilities.ts`, `Record<sharedBlockKey, CapabilityId | null>` — `leadform → 'lead-form'`, `storebadges → 'store-badges'`, `followstrip → null` (no capability id exists for it today). NO React/component imports — `fit.ts` imports it, and fit.ts's bundle firewall (never import a template module/block/resolver/registry loader) must hold. A parity test keeps the declaration honest against BOTH component registries (edit + published) without fit.ts ever touching them.
4. **Style wins; multipage is only a tiebreak** (per D6 — machine decides facts, user decides taste — and the spec, which calls multipage a shortlist SORT preference, not a candidate restriction). `pickTemplate()` (serveGate.ts:99-113) becomes: hint-style match → defaultStyle match → **within a style-matched set of >1**, prefer a multipage-capable template when `brief.structure?.mode === 'multi'` → else `sl[0]`. Multipage NEVER overrides a style match and never restricts the candidate pool. Accepted consequence: with today's one-style-per-template config no two same-engine templates share a style, so the tiebreak is effectively **dormant** — that is fine and intended; do NOT "fix" it by restricting candidates. The returned `shortlist` array keeps `templateIds` order (other consumers assume hard-fit order); only the pick logic gains the tiebreak.
5. **7b prefill needs NO new code, and is scoped by capability.** classify's `buildBriefDraft` already writes `structure.mode` from `structureHint` (classify.ts:220); `isMultipage()` (pageArchetypes.ts:172) already honors `mode==='multi'` first — but only lands multipage when the picked template declares the `multipage` capability. Today that means thing/vestria only; trust-engine briefs (Wingrrowth) serve with a single-page 7b (see spec-acceptance correction). Verify, don't build.
6. **Admin = same function.** New pure module `src/modules/brief/serveMatrix.ts`: for each `businessTypeKey × entry.likelyIntents`, build a synthetic Brief via the REAL classifier path (`buildBriefDraft(EntrySignals)` — same technique as `makeSignals` in serveGate.test.ts:16) and call `decideServe`. The synthetic `EntrySignals` MUST fill **all** fields with neutral defaults, mirroring `makeSignals`, not just the obvious five. (Simpler alternative — inline the loop in `admin/page.tsx` — considered; separate pure module kept because it's unit-testable and keeps `page.tsx` render-only.) Admin renders the matrix; disagreement is structurally impossible.

**Guardrails (scope OUT, per spec):** no edits to `bridge.ts` (subscribe-newsletter M1 forcing), `seedGoalForm.ts`, `injectGoalSections.ts`, `StructureSlot.tsx`, `/api/brief/confirm` route (ServeDecision shape unchanged), `templateMeta.ts` declarations, businessTypes config values, schema/DB. No new capabilities/blocks/engines/templates (incl. no trust multipage template).

---

## Phase 1 — shared-block capability declaration (pure data + parity test)

**Goal:** the declared list exists, is provably in sync with the two shared-block component registries, and is importable by pure modules. No behavior change yet.

**Steps:**
1. Create `capabilities.ts` in `sharedBlocks/`: header comment stating PURE DATA / no component imports / imported by `fit.ts` (firewall); export `sharedBlockCapability: Record<string, CapabilityId | null>` keyed by the lowercased registry keys (`leadform`, `storebadges`, `followstrip`) + derived `sharedBlockCapabilities: readonly CapabilityId[]` (non-null values, deduped, canonical `capabilityIds` order).
2. Create `capabilities.test.ts`: (a) keys of `sharedBlockCapability` === keys of `registry.ts` map === keys of `registry.published.ts` map (adding a shared block without declaring its capability fails CI); (b) every non-null value ∈ `capabilityIds`; (c) exact expected contents (`lead-form`, `store-badges` in; `followstrip` null).
3. Update `src/modules/generatedLanding/README.md` shared-blocks section: new block ⇒ declare in `capabilities.ts` (or explicit `null`).

**Files touched:**
- `src/modules/generatedLanding/sharedBlocks/capabilities.ts` (create)
- `src/modules/generatedLanding/sharedBlocks/capabilities.test.ts` (create)
- `src/modules/generatedLanding/README.md` (edit)

**Verification:** `npx tsc --noEmit` green; `npm run test:run` green (new test passes, nothing else moves — no consumer yet).

---

## Phase 2 — gate law rewrite + test rewrite (kills F13/F15/F16)

**Goal:** `fit()` satisfies requirements via shared blocks; inferred `multi` never rejects and acts only as a style-subordinate pick tiebreak; `fit.test.ts`/`serveGate.test.ts` assert the NEW law with the three repro-Brief fixtures; all true-rejection paths and strict `missing` strings unchanged.

**Steps:**
1. `fit.ts`:
   - `fit()`: `required.every(cap => meta.capabilities.includes(cap) || sharedBlockCapabilities.includes(cap))`; import from `sharedBlocks/capabilities`; extend the firewall header comment (data-only import, still no components).
   - `requiredCapabilitiesFromBrief()`: delete the `structure.mode === 'multi' → multipage` line (:67); update the derivation-table doc (inference is soft; `requiredCapabilitiesFromStructure` is where user-confirmed `multipage` hardens). Keep M1/download-app derivations verbatim.
   - `requiredCapabilitiesFromStructure()`: unchanged (confirm only).
   - Sanity note for implementer: `selectProductSections` (sectionSelection.ts:48) consumes `requiredCapabilitiesFromBrief` — `multipage` has no `capabilitySections` entry (structural, conformance-exempt), so dropping it changes no section list; verify via existing tests.
2. `serveGate.ts` — rewrite `pickTemplate()` (:99-113) per design decision 4, exactly:
   hint-style match → defaultStyle match → within a style-matched set of >1, prefer multipage-capable when `brief.structure?.mode === 'multi'` → else `sl[0]`. Style always wins; multipage never restricts candidates; tiebreak is dormant under today's one-style-per-template config (comment this in code). Update the module-header gate-rule comment + the rungC/fallback comments to the new law (shared-block satisfaction; gallery still unsatisfiable ⇒ still rejects).
3. Rewrite `fit.test.ts` with the new law (keep every suite's coverage, flip expectations):
   - `:82-89` — download-app now: `store-badges` still ∈ `requiredCapabilitiesFromBrief`, but `shortlist` NON-empty (shared block satisfies).
   - `:78-79` — inferred `multi` no longer derives `multipage` ⇒ shortlist not narrowed to vestria pre-7b; assert `requiredCapabilitiesFromStructure({mode:'multi',...})` still yields `multipage` (7b law intact).
   - `:70` — M1 → `lead-form` requirement stays asserted.
   - New: shared-block satisfaction unit tests (granth + `lead-form` fits for work engine; gallery NOT satisfied by any shared block; retired/bespoke still never fit even with shared-block-satisfiable requirements).
4. Rewrite `serveGate.test.ts` (keep helper + strict-`missing`-equality style):
   - Encode repro fixtures via `makeSignals`: **F13** consultant/trust/request-quote(M1)/`structureHint:'multi'` → SERVE (was `rungC:multipage`) — expected pick unchanged from today's trust pick, single-page path; **F15** writer/work/lead-magnet(M1) → SERVE on granth (was `rungC:lead-form`); **F16** app/download-app(M3) → SERVE (was `rungC:store-badges`, rewrite `:210-224` into the serve assertion).
   - Because `:210-224` was the fallback-guard's `missing !== ''` home, keep that contract explicitly: add a `missing` non-empty assertion (e.g. `expect(decision.missing).not.toBe('')` alongside the strict-equality check) to the photographer manual test so the never-empty invariant isn't silently dropped.
   - `:116-132` (app/signup-free): update the stale comment at `:118-122` — it claims download-app "would push even this serveable type to manual", now false under the new law. Assertion itself still passes; comment only.
   - Inferred-signal-never-rejects property: same signals with `structureHint` `'single'` vs `'multi'` → identical serve/manual outcome for every serveable fixture.
   - Pick tiebreak assertions (style-first law): (a) bare thing-engine brief with `mode:'multi'`, no style hint, no businessType style → falls through to `sl[0]` = **meridian** (multipage does NOT hijack the pick); (b) a style match is never overridden by multipage preference; (c) trust-engine `multi` → pick identical to today's; (d) returned `shortlist` order = `templateIds` order. Note in the test file: the tiebreak branch is dormant under current config (no two same-engine templates share a style) — assert the fall-through behavior, don't force an artificial config.
   - Unchanged manual paths re-asserted verbatim: photographer tiebreaker → `rungC:gallery` (:152-169), unknown type → `rungA:unclassified`, out-of-icp exclusive, `rungE:place|quick-yes`, canonical tag join order.
5. `structureConvergence.test.ts:108-116` — preserve the test's INTENT (multipage is structural, contributes no section), don't just flip `:113`: rework the case to assert via `selectProductSections({ requiredCapabilities: ['multipage'] })` yielding no multipage-driven section, and separately assert `requiredCapabilitiesFromBrief` no longer emits `multipage` for inferred `mode:'multi'`. Fix the stale loop-header comment at `:119-120` that lists "structure.mode multi" as a `requiredCapabilitiesFromBrief` source. Keep EXPLICIT_TRIGGER absence assertions.
6. `swap.test.ts` — expected NO change, and here is WHY widening `fit()` is semantically safe for swap (make this reasoning a comment in the test or plan-audit, not an assumption): (a) swap has an independent section-coverage check (`TemplateSwapList.tsx:96-103`) that blocks swaps to templates missing needed sections regardless of `fit()`; (b) shared blocks render on EVERY template (they resolve before template dispatch), so a shared-block-satisfied capability is genuinely available on any swap target; (c) user-confirmed `multipage` still hardens via `requiredCapabilitiesFromStructure`, untouched. Re-baseline ONLY if red after the law change; otherwise untouched.
7. Update `src/modules/brief/README.md` gate-rule + tag table (shared-block satisfaction; multipage soft pre-7b, style-first pick).

**Files touched:**
- `src/modules/templates/fit.ts` (edit)
- `src/modules/brief/serveGate.ts` (edit)
- `src/modules/templates/fit.test.ts` (rewrite)
- `src/modules/brief/serveGate.test.ts` (rewrite)
- `src/modules/engines/structureConvergence.test.ts` (edit — :108-132 area)
- `src/modules/templates/swap.test.ts` (comment for the safety reasoning; assertions re-baselined only if red)
- `src/modules/brief/README.md` (edit)

**Verification:** `npx tsc --noEmit`; `npm run test:run` full-suite green — specifically fit/serveGate/structureConvergence/swap/templateMeta/config/conformance/sectionSelection/pageArchetypes/strategy-route suites all pass. Acceptance mapping: F13/F15/F16 serve; photographer/restaurant manual with exact tags; `missing` never-empty asserted; inferred-never-rejects covered; style-first pick covered.

---

## Phase 3 — admin serveability matrix unification

**Goal:** `/admin` Business Types serveability = `decideServe` output per businessType × likelyIntent; writer/app rows stop claiming blanket "serveable"; photographer honestly `rungC:gallery` per intent.

**Steps:**
1. Create `src/modules/brief/serveMatrix.ts` (pure, firewall-safe): `serveabilityMatrix(): Array<{ businessType: BusinessTypeKey; intent: GoalIntent; decision: ServeDecision }>` — for each key × `entry.likelyIntents`, build `EntrySignals` filling **ALL fields with neutral defaults, mirroring `makeSignals` in serveGate.test.ts exactly** (implementer: copy the full field list from that helper — businessTypeGuess=key, high confidence, goalIntentGuess=intent, `structureHint: entry.structureDefault`, platformNeeds none, tiebreaker none, plus every remaining `EntrySignals` field at its neutral value; missing fields = silent wrong decisions) → `buildBriefDraft` → `decideServe`. (Inline-in-`admin/page.tsx` was the simpler alternative; module kept for unit-testability.)
2. Create `serveMatrix.test.ts`: writer×lead-magnet SERVE, app×download-app SERVE, photographer intents MANUAL `rungC:gallery`; matrix invariant to `structureHint` flip (inference never changes a row); every row's decision shape valid.
3. `src/app/admin/page.tsx`: replace `businessTypeRows` (:161-170) with `serveabilityMatrix()`; rework the Serveability column (:507-551 render region) to per-intent cells — intent label + serve badge, or the `missing` string on manual. Keep the rest of the table (engine, caps, style, fields) as-is. Server component; pure import is fine.

**Files touched:**
- `src/modules/brief/serveMatrix.ts` (create)
- `src/modules/brief/serveMatrix.test.ts` (create)
- `src/app/admin/page.tsx` (edit)

**Verification:** `npx tsc --noEmit`; `npm run test:run` green; manual: load `/admin`, Business Types table shows the per-intent matrix.

**HUMAN GATE (pre-merge, per spec):** on `npm run dev`, run the repro Briefs through the real gate and confirm:
- **Wingrrowth-shape** (URL entry, trust/M1/multi-inferred) → **SERVE with a SINGLE-PAGE 7b** (per the spec-acceptance correction — multi-page here would be a bug, single-page is correct);
- writer one-liner → SERVE on granth; app/download-app → SERVE with store badges;
- photographer → MANUAL `rungC:gallery`; restaurant/"Something else" → `rungA:unclassified`; demand-board row shapes unchanged;
- **multi-page 7b prefill verified separately** with a thing-engine multi-inferred brief landing on vestria → sitemap proposal arrives multipage;
- eyeball the `/admin` matrix against the gate results.
User signs off before merge to main.

---

## Unresolved questions

1. ~~Soft sort precedence~~ — ANSWERED by review: style first, multipage only a same-style tiebreak (dormant today).
2. `followstrip → null` (no capability id today) — fine, or mint a capability id? Plan says null.
3. Admin matrix render: per-intent cells inside existing row OK, or want separate sub-table?
4. Serve outcome's `shortlist` stays `templateIds`-ordered (only pick tiebreak added) — OK?
5. Spec-acceptance correction (Wingrrowth = single-page 7b) — sign off at human gate, or want a trust multipage template queued as follow-up?
