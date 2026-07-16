# work-onboarding-shell — implementation plan (rev 3, post re-review: e2e seeding strategy + group-shape fix)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-onboarding-shell`
- **BRANCH:** `feature/work-onboarding-shell`
- **Tier:** full
- **Spec:** `docs/task/work-onboarding-shell.spec.md` · **Scout:** `docs/task/work-onboarding-shell.scout.md` (ground truth; spec References partly stale)

## Overview

Build the **work-ENGINE** 6-step onboarding spine (STEP 01 one-line → 02/03/04 thin placeholders → 05 building → 06 reveal) plus the persistent "What we understood" rail, in the new ui-foundation design. **Terminology correction (the spec's "work audience" is imprecise): `work` is a `copyEngine`, NOT an `audienceType`** — `audienceTypes = ['product','service','ecommerce','writer']` (`src/types/service.ts:16`); `decideServe` derives audience from the PICKED TEMPLATE (`serveGate.ts` `TEMPLATE_AUDIENCE`), so a served photographer gets **`audienceType:'service'` + `templateId:'atelier'`**. Work UI lives in a NEW tree (`src/components/onboarding/work/**`) dispatched from the existing `/onboarding/[token]` entry **post-confirm** when `brief.copyEngine==='work' && isWorkCopyTemplate(templateId)`; state reuses `useWizardStore` (work slice); generation reuses `runWorkLLMGeneration`. Granth (work-engine but writer-audience, single-page, NOT on the copy-engine allow-list) and legacy product/service stay on the unchanged `WizardShell` path post-confirm.

## Progress log

- phase 1 rail data model + entry→work seed + brief plumbing: pending
- phase 2 work shell scaffold + post-confirm dispatch + e2e registration: pending
- phase 3 STEP 01 + rail UI + serve-gate confirm + icons: pending
- phase 4 thin steps 02/03/04: pending
- phase 5 STEP 05 building (generation drive): pending
- phase 6 STEP 06 reveal + editor handoff: pending
- phase 7 gates sweep + founder QA: pending

## Design decisions (base = scout's conservative option; reviewer fixes folded in)

1. **work = engine, not audience — everywhere.** All assertions, e2e checks, and copy in this plan use `brief.copyEngine === 'work'` for the engine and expect the serve gate to stamp `audienceType:'service'` + `templateId:'atelier'` for served work briefs (`serveGate.ts` `TEMPLATE_AUDIENCE.atelier='service'`). Nothing ever asserts `audienceType==='work'` (it does not exist).
2. **Dispatch is POST-CONFIRM only, keyed on engine + allow-list template.** `src/app/onboarding/[token]/page.tsx` load-detection: confirmed brief AND `brief.copyEngine==='work' && isWorkCopyTemplate(templateId)` (`src/lib/workCopyEngine.ts` — atelier only today) → full-viewport early return rendering `WorkOnboardingShell` (dynamic import, `ssr:false`) INSTEAD of `WizardShell`. `templateId` is only knowable post-confirm (decided server-side), which is why there is **no pre-confirm "entry mode" shell mount** (deleted from this plan, with its dual-mount prop contract and non-work-flip fallback machinery). Granth (work-engine, NOT on the allow-list) keeps `WizardShell` post-confirm — the writer vertical's DATA path is untouched. **Known cosmetic overlap (accepted E1):** the pre-confirm branch (b) keys on `briefDraft.copyEngine==='work'` only, so a writer/granth-bound work draft ALSO sees the handoff STEP 01 before landing on the legacy WizardShell after confirm. Not a dead end and data-inert: `waterfall.ts` reads only `facts.entry`, and granth generation (`work.ts:79-84`) ignores `brief` — so the confirm-time `facts.work` seed is inert for granth. Do not build a granth-exclusion for STEP 01 in E1.
3. **STEP 01 = the entry page's confirm-step replacement for work.** The one-liner is still typed in shared `EntryInputStep` (engine unknown pre-classify). When the classified draft has `copyEngine==='work'`, the entry page renders `WorkEntryStep` (handoff `1a` visuals, full-viewport early return, line editable) INSTEAD of `ConfirmBriefStep` — the rail replaces confirmation-as-a-step (orchestrator ruling #2). Its CTA calls the same `/api/brief/confirm` serve gate. The response is ONLY `{outcome, redirectTo}` / `{outcome:'manual', missing, outOfIcp}` (`brief/confirm/route.ts:112-123`) — it carries NO audienceType/templateId and on manual writes NOTHING to Project. Therefore:
   - **serve ⇒ `window.location.assign(redirectTo)`** (`/onboarding/{token}`): full reload → load-detection reads `loadDraft` (now carrying brief + audienceType + templateId) → decision-2 dispatch mounts the shell in resume mode at STEP 02. No client-side hydrate from the confirm response — it has nothing to hydrate from.
   - **manual ⇒ hand off to the existing `ManualOnboardStep`** (entry-page `setStep('manual')` with the decision's `missing` tags). The shell never mounts on a manual verdict.
   - Edited line ⇒ re-run the classify call `EntryInputStep` uses; a non-work result ⇒ `setStep('confirm')` with the fresh draft (plain entry-page state — trivial now that STEP 01 is an entry-page step, not a shell mode).
   - **Known E1 trade-off (explicit, per ruling):** replacing `ConfirmBriefStep` for work DROPS `applyBusinessTypeCorrection` — the SINGLE sanctioned business-type correction path (`classify.ts:233-249`) — plus the low-confidence type chooser and the "Something else"→manual escape hatch. The replacement (edit the line → full re-classify) also spends an `UNDERSTAND` credit per edit. Accepted for E1 (the rail is the correction surface going forward); revisit in E2/E3 if founder QA shows misclassified work briefs with no cheap correction.
4. **`facts.work` is seeded at confirm — nothing writes it today.** `classify.ts` writes only `facts:{entry}`; `buildBriefPatch` emits only goal/structure/`facts.collections`. Without a seed the rail projects over nothing (all-unknown) and STEP 05's pre-flight loops to 03. Fix: `WorkEntryStep` enriches the draft BEFORE confirm — `brief = {...draft, facts:{...draft.facts, work: seedWorkFactsFromEntry(entryFacts)}}` — so the serve write persists it atomically. Seed mapping (owner module = `rail.ts`, P1): `facts.entry.businessName → identity.name`; `summary` (+ `categories` when present) → `identity.descriptor`; `offerings[] → groups[]` each **`{name, kind:'category', price:{mode:'on-request'}}`**. **`kind` is REQUIRED by `WorkGroupSchema` (`workFacts.schema.ts:100-108`, `z.enum(['category','story'])`) — a group without it fails `WorkFactsSchema.safeParse` ⇒ `getWorkFacts` returns null (`:158-165`) ⇒ work strategy 400s, and because confirm PERSISTS the bad facts a retry does not recover. Default is `'category'`: entry `offerings` are service/category names; `'story'` is the case-study shape (client/problem/result sub-fields) which the seed has no data for.** Pre-E1 confirmed work projects without `facts.work` resume into STEP 03, whose questions collect the generation minimum via rail actions (which also emit `kind`-valid groups) — no dead end, no retroactive back-seed (ruling: confirmed OK).
5. **State = `useWizardStore` work slice; `briefFacts` is THE source of truth and rail writes keep it live.** `briefFacts` is a hydrate-time snapshot (`useWizardStore.ts` hydrate) that is BOTH the re-emit source for full-facts patches (`buildBriefPatch`) AND what generation reads (`resolveWorkBrief` → `buildWorkInput`). Every rail action therefore updates `state.briefFacts` **in the same `set`** that produces the saveDraft patch — otherwise edit #2 re-emits stale facts and reverts edit #1, and STEP 05 generates from pre-correction facts. Name/oneLiner: `buildWorkInput` reads `fields['name']`/`fields['oneLiner']` for the site title — the rail's NAME edit **mirrors into `fields['name']`** in the same `set` (`facts.work.identity.name` = canonical; the field is a derived mirror). `oneLiner` comes from the existing hydrate field waterfall (entry facts) and is not rail-editable in E1. Existing slot machine, `hydrate`, `buildWorkInput`, `fetchStrategy` untouched; all store edits additive; shared-path changes flagged per phase.
6. **Reveal isolation via iframe + chrome-suppressed preview (orchestrator ruling #3: committed choice).** `/preview/[token]` as-is ships a fixed action bar with **Publish**, Custom Domain, SlugModal — forbidden in the magic moment (handoff: the only forward is the editor). STEP 06 renders `<iframe src="/preview/{token}?chrome=0">`; the preview page gains a narrow, declared edit: when `chrome=0`, it renders ONLY the site (`LandingPageRenderer`) — no action bar, no modals, no publish path. Separate document ⇒ `.app-chrome` can never restyle the site (landmine 1). Phone toggle = constrained iframe width. Param name **`chrome=0`** (ruled). **Build-safety note:** the preview page is a client page with no `useSearchParams` today — adding one WITHOUT a Suspense boundary can fail `next build` (P7 fresh-build gate). Repo precedent: wrap in `<Suspense fallback={null}>` per `src/app/dashboard/billing/page.tsx:155` (detail in P6).
7. **Flag honesty.** In the work shell, `NEXT_PUBLIC_WORK_COPY_ENGINE` OFF or `workCopyEngineEnabled(templateId)` false is an EXPLICIT error state at STEP 05 — never the silent skeleton fallback (landmine 2). (Dispatch already excludes non-allow-list templates, so this state should be unreachable except for the env flag — keep the guard anyway.)
8. **E1 thinness + two by-design nulls.** No feel picker in STEP 05 (ruling #4). STEP 02 = non-functional upload stub + Skip. No responsive pass. No new npm deps. Two things an implementer must NOT "fix": (a) the thin steps never set `goalIntent`, so `finalizeMultiPageGeneration(fc, null)` does no goal-CTA stamping (`work.llm.ts`) — harmless for E1, accepted; (b) the work branch leaves `state.strategy` NULL **by design** (`useWizardStore.ts` `fetchStrategy` work+multipage path seeds only the sitemap, chargeless) — the real strategy call happens inside `runWorkLLMGeneration` (`work.llm.ts:280-285`).
9. **E2E strategy: seeded-resume, NOT mocked-entry (orchestrator ruling — mock mode cannot produce a work brief).** In mock mode `isDemoMode` (`src/lib/mockMode.ts:16`) short-circuits `/api/v2/understand` to `ENTRY_DEMO_SIGNALS` — an AGENCY-shaped fixture (`understand/route.ts:84-107`); the demo branch keeps it as the base even when an explicit `businessType` is passed (`:131-148`), and `/api/v2/scrape-website` has the same fixture. So a mocked entry ALWAYS classifies `copyEngine:'trust'` → hearth/service; `WorkEntryStep` never renders and the shell never mounts. `understand`/`scrape-website` are shared generation routes and are OUT OF SCOPE (ruled — do not edit them). Instead:
   - **Seed helper `e2e/helpers/seedWorkBrief.ts`** (new, P2; pattern = `e2e/helpers/seedDraft.ts` — authed `APIRequestContext`, no `@/` imports): (1) mint a token via `GET /api/start` exactly as `publish.spec.ts:31-34` does (persona-then-start pattern); (2) `POST /api/brief/confirm` with `{tokenId, brief: WORK_BRIEF_FIXTURE}`; (3) assert the response is `{outcome:'serve', redirectTo:'/onboarding/{token}'}`; return `tokenId`. The confirm route is authed + demo-free (`brief/confirm/route.ts:41-44`), so this runs in the `authed` Playwright project under mock mode unchanged.
   - **`WORK_BRIEF_FIXTURE`** (exported from the helper): a photographer/gallery work brief that `decideServe` serves to atelier — `businessType:'photographer'` (a List-1 key), `copyEngine:'work'` (dispatch reads it), `facts.entry` with `resolvedEngine:'work'` (the gate reads THIS, `serveGate.ts:180-181`) and `classificationSource` NOT `'tiebreaker'`/`tiebreaker` NOT `'portfolio-is-proof'` (that shape trips the rungC gallery rejection, `serveGate.ts:201-211`, → manual), plus realistic `businessName`/`summary`/`offerings`; AND **`facts.work` pre-embedded** exactly as `seedWorkFactsFromEntry` would produce it (the client-side confirm-time seed never runs on this path) — `kind`-valid groups per decision 4, so the rail and STEP 05 see real seeded facts.
   - **Fixture drift guard (Vitest, runs where `@/` resolves):** `src/modules/wizard/work/workBriefFixture.test.ts` imports the fixture (relative path into `e2e/helpers/`) and asserts (a) `BriefSchema.parse` passes, (b) `decideServe(fixture)` returns `{outcome:'serve', templateId:'atelier', audienceType:'service'}`, (c) `getWorkFacts(fixture.facts)` is non-null. Gate-config drift breaks unit tests, not just e2e runs.
   - **Every e2e spec starts at the resume-mount:** `seedWorkBrief` → `page.goto('/onboarding/{token}')` → load-detection dispatches the work shell at STEP 02. The automated journey is **02→06**.
   - **STEP 01 (`WorkEntryStep`) is NOT covered by the journey e2e — say so, don't fake it.** Its logic is covered by Vitest: seed mapping in `rail.test.ts` (P1) + `WorkEntryStep.test.tsx` (P2/P3: mocked `/api/brief/confirm` — serve ⇒ `window.location.assign(redirectTo)`, manual ⇒ `onManual(missing)`, edited-line re-classify ⇒ non-work hands back to `setStep('confirm')`, and the pre-confirm `facts.work` enrichment is present in the POSTed brief). Its REAL-entry behavior (real classify → work verdict → STEP 01 renders) is an explicit P7 founder-QA item, real-LLM. No phase gate silently "passes" without exercising work.

## Rail data model (the durable "running understanding" — E2/E3 fill this)

Pure module `src/modules/wizard/work/rail.ts`. The rail is a **projection of `brief.facts.work`** + two additive optional schema fields — never a parallel store. (New optional fields approved by orchestrator ruling #1 — must be strictly additive-optional; prove `getWorkFacts` can't silently null on them.)

| Rail field | Backing | Notes |
|---|---|---|
| NAME | `facts.work.identity.name` | exists; rail edit mirrors into `fields['name']` (decision 5) |
| WHAT YOU DO | `facts.work.identity.descriptor` (**NEW optional string**) | closes the scout §3 gap; seeded from `facts.entry.summary`/`categories` via `seedWorkFactsFromEntry`, user-correctable |
| WHERE | `facts.work.identity.location` (+ `.reach`) | exists |
| WHAT YOU SELL | `facts.work.groups[]` (names, prices as chips) | exists; seeded from `facts.entry.offerings`, each **`{name, kind:'category', price:{mode:'on-request'}}`** — `kind` REQUIRED by `WorkGroupSchema` (decision 4 / landmine 6) |
| PRICE POSITION | **derived, never stored** — `derivePricePosition(facts)` from `groups[].price` modes/amounts; no groups/prices ⇒ unknown (skeleton state) | scout §3 verdict |
| LANGUAGES | `facts.work.languages[]` (NOT `brief.locales`) | exists |
| carried (model, not all rendered E1) | `establishment`, `praise`, `contactMethod` | generation branches on them; E3 asks/fills |
| "Something wrong?" box | `facts.work.userNotes: string[]` (**NEW optional**) | append-only correction log; E3 consumes |

Hard rules baked into the module (unit-tested):
- **Full-facts re-emit** (landmine 4): every rail→brief write produces a patch that re-emits the COMPLETE `facts` bag (live `briefFacts` + edits overlaid), pattern of `buildBriefPatch` (`useWizardStore.ts:1224-1227`). Never a partial `facts` patch.
- **Snapshot sync** (reviewer #6): the store action applying a rail patch updates `state.briefFacts` in the SAME `set` — the module exposes the merged facts bag so the action can both persist and sync atomically.
- **Client-side zod validation before send** (landmine 5): validate against `BriefSchema`/`WorkFactsSchema` BEFORE `saveDraft` (which returns 200 on invalid patches while silently dropping the brief write); invalid ⇒ surface an error, don't send.
- **Group validity** (landmine 6): any group the shell writes gets **`kind:'category'`** (unless a future story flow sets `'story'`) AND `price:{mode:'on-request'}` unless the user supplied a valid amount for `exact`/`from`. A group missing `kind` or a valid price is never emitted (either nulls `getWorkFacts` → 400 at strategy — and the write PERSISTS, so retry doesn't recover).
- **Seed** (reviewer #5): `seedWorkFactsFromEntry(entryFacts)` lives here (mapping in decision 4); no-op-safe on sparse entry facts; **result always passes `getWorkFacts` — the test MUST catch a `kind`-less group (this exact regression)**.

## Landmine coverage map (scout §Landmines → phase)

| # | Landmine | Handled in |
|---|---|---|
| 1 | `.app-chrome` must not wrap revealed site | P6 (iframe + `chrome=0` preview) + P2 (attach `.app-chrome` only on the shell wrapper) |
| 2 | `NEXT_PUBLIC_WORK_COPY_ENGINE` off ⇒ empty reveal | P5 (explicit guard state) + P2 (env registered in playwright webServer) + P7 (founder checklist: confirm prod/Vercel env before gate) |
| 3 | `saveDraft` never writes `audienceType` | P3 (STEP 01 CTA goes through `/api/brief/confirm`; serve ⇒ redirect, manual ⇒ `ManualOnboardStep`) + e2e assert `loadDraft` returns **`audienceType:'service'` + `templateId:'atelier'`** after the seeded confirm (work is the ENGINE — `brief.copyEngine==='work'` asserted separately) |
| 4 | shallow `facts` patch wipes siblings | P1 model rule + P3 rail writes; unit + e2e persistence assert (`facts.entry` survives a rail edit) |
| 5 | invalid patch → silent 200 | P1 (client-side zod pre-validate) |
| 6 | price/shape parse → silent null facts | P1 (**`kind:'category'` + on-request defaults** in seed + patch rules) + P4 (questions UI writes `kind`-valid groups) |
| 7 | `finalizeMultiPageGeneration` omission | P5 (reuse `runWorkLLMGeneration` verbatim — finalize is inside the driver) |
| 8 | STEP 04 vs `fetchStrategy` idempotency | P4 (reuse the chargeless work sitemap seeding path behind the existing `strategyStatus` guard; never the charged path) |
| 9 | credits/ownership on work routes | No route changes in this feature; ownership stays asserted at `saveDraft`/`brief:confirm` (noted, not fixed here) |
| 10 | isolation guards | P7 (fresh `npm run build` → published.css sha, `tailwindConfigFreeze`, `e2e/ui-isolation.spec.ts`; fixture NEVER regenerated) |
| 11 | icon subset | P3 (append to `icons.txt`, regen per NOTICE, once — in the phase that consumes the glyphs) |
| 12 | toast/badge gotchas | P3 (use `@/components/ui/toast`; chips = pill/status badge variants, not default 6px) |
| 13 | mock mode cannot classify work | Decision 9 (seeded-resume e2e via `/api/brief/confirm`; STEP 01 = Vitest + P7 founder QA; `understand`/`scrape-website` NOT edited — ruled out of scope) |

Also: entry-page + `WizardShell` firewall (scout §1) preserved — `WorkOnboardingShell` and `WorkEntryStep` are dynamically imported (`ssr:false`) by the entry page, import no template resolver/registry/renderer; generation adapters stay lazy-imported.

---

## Phase 1 — Rail data model + entry→work seed + brief plumbing (pure, no UI)

**Goal:** the durable rail model E2/E3 build on: types, `facts.work` mapping, the entry seed, derivation, safe-patch builder — signed off before anything renders.

**Steps:**
1. Add additive OPTIONAL fields to `src/lib/schemas/workFacts.schema.ts`: `identity.descriptor?: string`, `userNotes?: string[]`. Zod-optional ⇒ existing briefs/parsers unaffected; prove `getWorkFacts` returns non-null for facts that omit OR include them (explicit test).
2. Create `src/modules/wizard/work/rail.ts`: `WorkRail` type (fields table above incl. carried fields); `railFromBrief(brief|facts)` projection; `derivePricePosition(facts)` (pure); `seedWorkFactsFromEntry(entryFacts)` (decision-4 mapping — every emitted group is `{name, kind:'category', price:{mode:'on-request'}}`; sparse-input safe; output always passes `getWorkFacts`); `railPatchToBrief(rail, liveFacts)` → full-facts re-emit patch + the merged facts bag for snapshot sync (landmine 4 + reviewer #6); zod pre-validation (landmine 5); group shape/price default rule — `kind` + valid price on every emitted group (landmine 6); `appendUserNote()`.
3. Unit tests in `src/modules/wizard/work/rail.test.ts`: mapping round-trip; seed mapping (businessName/summary/offerings → name/descriptor/groups each with `kind:'category'` + on-request price; empty entry ⇒ minimal-but-valid or null-with-no-emit); **regression guard: a hypothetical `kind`-less group in the seed/patch path is either completed to `kind:'category'` or rejected — assert `getWorkFacts` is NON-NULL on every emitted facts bag (this is the exact blocker-2 failure mode)**; price-position derivation cases; sibling-preservation (`facts.entry`/`facts.collections` survive a rail patch); invalid-patch rejection; no-invalid-price emission; `getWorkFacts` non-null on seeded + descriptor/userNotes-bearing facts.
4. Run existing work generation/schema tests to prove the schema addition is inert.

**Files touched:**
- `src/lib/schemas/workFacts.schema.ts` (edit — additive optional; **shared file, regression risk: work generation reads this schema**)
- `src/modules/wizard/work/rail.ts` (new)
- `src/modules/wizard/work/rail.test.ts` (new)

**Verification:** `npx tsc --noEmit` · `npm run test:run` (new rail tests + existing `work.llm.test.ts`/workFacts tests green).

**HUMAN GATE — rail data-model sign-off.** User approves the rail shape (the two new optional fields `identity.descriptor` + `userNotes` — approved in principle by ruling #1, confirm the concrete shape — plus the seed mapping incl. the `kind:'category'` default and price-position-as-derived) before E2/E3-facing UI is built on it.

---

## Phase 2 — Work shell scaffold + post-confirm dispatch + e2e registration

**Goal:** the work journey exists as a navigable shell (placeholder bodies) reachable via the REAL confirm gate (API-seeded per decision 9); the e2e spec + seed helper are registered so every later gate actually runs against a real served work project; legacy paths provably unchanged.

**Steps:**
1. New tree `src/components/onboarding/work/`:
   - `WorkOnboardingShell.tsx` — top-level client component; attaches `.app-chrome` on ITS OWN full-viewport wrapper only; **single mount contract (resume mode only)**: props `{ tokenId, brief, audienceType, templateId }` from load-detection → hydrates `useWizardStore` like `WizardShell` does. Renders `WorkTopBar` + current step (02–06; STEP 01 lives in `WorkEntryStep`, pre-confirm).
   - `WorkEntryStep.tsx` — the STEP 01 screen, mounted by the ENTRY PAGE pre-confirm (decision 3). In P2: functional skeleton — one-liner shown, CTA wired to `/api/brief/confirm` with serve⇒`window.location.assign(redirectTo)` and manual⇒`onManual(missing)` callback (entry page routes to `ManualOnboardStep`). Handoff visuals land in P3.
   - `WorkTopBar.tsx` — handoff chrome: STEP 01 variant (logo · divider · "New site with AI" · "Exit to dashboard"); steps 02–06 variant (58px bar, logo, "New site", centered dot progress for steps 2–6 — done=blue check circle, current=numbered ring, future=dot — right slot "Save & exit" or live status). `app-*` utilities + `AppIcon`; restrict to glyphs already in the subset until P3 regenerates it.
   - `steps/StepWork.tsx`, `steps/StepQuestions.tsx`, `steps/StepPlan.tsx`, `steps/StepBuilding.tsx`, `steps/StepReveal.tsx` — placeholder bodies + working next/back so the 02–06 machine is walkable.
2. Work slice in `src/hooks/useWizardStore.ts` (ADDITIVE only): `workStep: 2|3|4|5|6`, `setWorkStep`, selectors. Do not touch the slot machine.
3. `src/modules/wizard/work/resumeStep.ts` (+ test): `resolveResumeStep(loaded)` — confirmed brief ⇒ 2; refined for generation states in P5/P6. Refresh restores the right macro-position (URL-driven steps out of scope). STEP 01 is never resumed (pre-confirm, entry-page-owned).
4. Entry dispatch in `src/app/onboarding/[token]/page.tsx` (NARROW, two branches, both full-viewport early returns OUTSIDE the legacy max-w-xl card): (a) load-detection confirmed AND `brief.copyEngine==='work' && isWorkCopyTemplate(templateId)` → `WorkOnboardingShell` (dynamic import, `ssr:false`); (b) `step==='confirm' && briefDraft.copyEngine==='work'` → `WorkEntryStep` (dynamic import) instead of `ConfirmBriefStep`; its `onManual` reuses the existing manual state path (decision 2 notes the accepted granth-draft cosmetic overlap on branch (b)). Granth/product/service/non-allow-list: unchanged post-confirm.
5. **Register the e2e spec NOW** (reviewer #7 — an unregistered spec silently matches no project, `playwright.config.ts:52-56`): add `/work-onboarding\.spec\.ts/` to the **`authed`** project's `testMatch` (flow needs Clerk — `brief/confirm` is authed with no demo bypass), and add `NEXT_PUBLIC_WORK_COPY_ENGINE: 'true'` to the `webServer.env` (P5 depends on it; registering early is harmless). **Note `reuseExistingServer: !CI`** — a stale dev server silently ignores new env; kill any running dev server before e2e runs (repeat in P5).
6. **Seed helper `e2e/helpers/seedWorkBrief.ts`** (decision 9): export `WORK_BRIEF_FIXTURE` (photographer work brief: `businessType:'photographer'`, `copyEngine:'work'`, `facts.entry.resolvedEngine:'work'` with a non-tiebreaker `classificationSource` — the `'tiebreaker'`+`'portfolio-is-proof'` shape trips rungC gallery rejection, `serveGate.ts:201-211` — plus `businessName`/`summary`/`offerings`, and pre-embedded `facts.work` matching the decision-4 seed shape with `kind`-valid groups) and `seedWorkBrief(request)` (mint token via `GET /api/start` per `publish.spec.ts:31-34`, `POST /api/brief/confirm`, assert `outcome:'serve'`, return `tokenId`). No `@/` imports (Playwright runner constraint per `seedDraft.ts` header).
7. **Fixture drift guard**: `src/modules/wizard/work/workBriefFixture.test.ts` (Vitest) — imports `WORK_BRIEF_FIXTURE` via relative path; asserts `BriefSchema.parse` ok, `decideServe(fixture)` ⇒ `{outcome:'serve', templateId:'atelier', audienceType:'service'}`, `getWorkFacts(fixture.facts)` non-null.
8. **`WorkEntryStep` unit test** `src/components/onboarding/work/WorkEntryStep.test.tsx` (jsdom, mocked fetch): serve response ⇒ `window.location.assign(redirectTo)`; manual response ⇒ `onManual(missing)` called, no navigation. (Extended in P3 with the seed-enrichment + re-classify branches.) This is the STEP 01 coverage the journey e2e cannot provide (decision 9).
9. e2e `e2e/work-onboarding.spec.ts` (authed project, seeded-resume per decision 9): (a) `seedWorkBrief` → `goto('/onboarding/{token}')` → work shell mounts at STEP 02 (dot progress visible), NOT `WizardShell`; `loadDraft` for that token returns `audienceType:'service'` + `templateId:'atelier'` + `brief.copyEngine:'work'`; (b) legacy-unchanged: a product/service token (existing seed patterns) still reaches `ConfirmBriefStep`/`WizardShell`. **No assertion pretends to exercise the mocked classify→STEP 01 path (impossible in mock mode — landmine 13).**

**Files touched:**
- `src/components/onboarding/work/WorkOnboardingShell.tsx` (new)
- `src/components/onboarding/work/WorkEntryStep.tsx` (new)
- `src/components/onboarding/work/WorkEntryStep.test.tsx` (new)
- `src/components/onboarding/work/WorkTopBar.tsx` (new)
- `src/components/onboarding/work/steps/StepWork.tsx` (new)
- `src/components/onboarding/work/steps/StepQuestions.tsx` (new)
- `src/components/onboarding/work/steps/StepPlan.tsx` (new)
- `src/components/onboarding/work/steps/StepBuilding.tsx` (new)
- `src/components/onboarding/work/steps/StepReveal.tsx` (new)
- `src/modules/wizard/work/resumeStep.ts` (new)
- `src/modules/wizard/work/resumeStep.test.ts` (new)
- `src/modules/wizard/work/workBriefFixture.test.ts` (new)
- `src/hooks/useWizardStore.ts` (edit — additive work slice; **shared file, regression risk**)
- `src/app/onboarding/[token]/page.tsx` (edit — dispatch branches; **shared file, regression risk**)
- `playwright.config.ts` (edit — register spec in `authed` + webServer env flag; **shared file, regression risk**)
- `e2e/helpers/seedWorkBrief.ts` (new)
- `e2e/work-onboarding.spec.ts` (new)

**Verification:** `npx tsc --noEmit` · `npm run test:run` (incl. fixture drift guard + `WorkEntryStep` branch test) · `npx playwright test e2e/work-onboarding.spec.ts` (against a FRESH dev server — env is build-time inlined) · `npm run lint`.

---

## Phase 3 — STEP 01 (real) + "What we understood" rail + icons

**Goal:** one line seeds flow + `facts.work` + rail; serve gate stamps audience/template; rail persists, fills, is correctable, has the free-text box.

**Steps:**
1. `WorkEntryStep.tsx` real per handoff 1a: radial-gradient body, `rocket_launch` chip, display headline, 720px card with the one-liner prefilled from entry (segmented "Describe your site"/"Use my current site" — second tab stub/disabled in E1), coral CTA "Build my site". CTA: enrich the draft with `seedWorkFactsFromEntry` (decision 4 — `kind`-valid groups) → `/api/brief/confirm` (mirror `ConfirmBriefStep`'s request/error handling) → **serve ⇒ `window.location.assign(redirectTo)`; manual ⇒ `onManual(missing)` → `ManualOnboardStep`** (decision 3). Edited line ⇒ re-classify; non-work ⇒ entry page `setStep('confirm')` with the fresh draft (known trade-offs per decision 3: no `applyBusinessTypeCorrection`, 1 UNDERSTAND credit per re-classify — accepted).
2. `UnderstoodRail.tsx` per handoff: 312px fixed aside (steps 02–06), mono header "WHAT WE UNDERSTOOD" + "Tap anything to correct it", field blocks (NAME / WHAT YOU DO / WHERE / WHAT YOU SELL chips / PRICE POSITION / LANGUAGES), unknown = `opacity-50` + `bg-app-stripes` skeleton bar, trailing `edit` affordance → inline input (thin, no dialog), footer "Something wrong?" free-text box → `appendUserNote`. Chips = badge pill/status variants; toasts from `@/components/ui/toast` (landmine 12).
3. Store wiring in `useWizardStore.ts` (additive actions): rail selectors (`railFromBrief` over live `briefFacts`), `updateRailField`/`submitRailNote` → `railPatchToBrief` → in ONE `set`: update `state.briefFacts` to the merged facts bag AND (for NAME) mirror into `fields['name']` (decision 5 / reviewer #6) → then `saveDraft` with the pre-validated full-facts patch.
4. Shell layout: rail + step body two-column from STEP 02 on.
5. Icons (landmine 11, once — moved here, the consuming phase): append needed ligatures (`rocket_launch`, `edit_note`, `link`, `chat_bubble`, `progress_activity`, `check_circle`, `add_photo_alternate`, `tune`, `folder`, `language`, `close`, `arrow_forward`, `edit`, `check` — diff against current `icons.txt`) and regenerate the subset per `public/fonts/material-symbols-rounded/NOTICE` (never from the full font; keep all four axes).
6. **Unit coverage for STEP 01 (decision 9 — the journey e2e cannot reach it):** extend `WorkEntryStep.test.tsx` — the POSTed confirm body contains `facts.work` from `seedWorkFactsFromEntry` (with `kind` on every group); edited-line re-classify: non-work result ⇒ `setStep('confirm')` handoff; serve/manual branches from P2 still green with the real UI.
7. e2e additions (seeded-resume entry, decision 9): `seedWorkBrief` → shell at STEP 02 → rail shows the fixture-seeded name + descriptor + group chips (proves rail projection over persisted `facts.work`); edit a rail field → reload → edit persisted AND `facts.entry` still present (landmine 4); **two consecutive rail edits both survive a reload** (reviewer #6 lost-update guard); free-text note round-trips; `loadDraft` still returns `audienceType:'service'` + `templateId:'atelier'` + `brief.copyEngine:'work'` (landmine 3).

**Files touched:**
- `src/components/onboarding/work/WorkEntryStep.tsx` (edit)
- `src/components/onboarding/work/WorkEntryStep.test.tsx` (edit — enrichment + re-classify branches)
- `src/components/onboarding/work/UnderstoodRail.tsx` (new)
- `src/components/onboarding/work/WorkOnboardingShell.tsx` (edit — rail layout)
- `src/hooks/useWizardStore.ts` (edit — rail actions/selectors + snapshot sync; **shared file, regression risk**)
- `public/fonts/material-symbols-rounded/icons.txt` (edit)
- `public/fonts/material-symbols-rounded/` regenerated subset font artifact(s) per NOTICE (edit)
- `e2e/work-onboarding.spec.ts` (edit)

**Verification:** `npx tsc --noEmit` · `npm run test:run` (incl. `WorkEntryStep.test.tsx` — this is STEP 01's gate) · `npx playwright test e2e/work-onboarding.spec.ts` · `npm run lint`.

---

## Phase 4 — Thin steps 02 / 03 / 04

**Goal:** journey completes through STEP 04 with just enough data for the generation defaults path. NO gold-plating — depth is E2/E3/E4.

**Steps:**
1. `StepWork.tsx` (02): "Show us your work" — dropzone-styled stub (`add_photo_alternate`, `image-placeholder` primitive), copy explaining what's coming, "Skip for now" advances. No upload pipeline, no scrape.
2. `StepQuestions.tsx` (03): minimal question card(s) covering the generation minimum (scout §2: `identity.name` + ≥1 group with valid shape): name (prefilled from rail; asked only if empty), "what do you sell" (one group; asked only if the seed produced no groups — **the write emits `{name, kind:'category', price:…}`, never a `kind`-less group** — blocker-2 fix; a bare name here would fail `WorkGroupSchema`, persist, and 400 strategy unrecoverably), optional price (segmented exact/from/on-request + amount; default `on-request` — landmine 6). Answers write through the rail actions (rail visibly fills — the journey's core promise; snapshot sync from P3 makes them generation-visible; the rail module's group-validity rule is the enforcement point).
3. `StepPlan.tsx` (04): trigger the EXISTING chargeless work sitemap seeding (`fetchStrategy`'s work+multipage branch, `useWizardStore.ts:1094-1113`, guarded by `strategyStatus` — never a second/charged fetch; landmine 8). **Note for the implementer: this branch leaves `state.strategy` NULL by design** — the real strategy call happens inside `runWorkLLMGeneration` (P5); do not "fix" the null. Render page names as simple cards + "Build my site" CTA → STEP 05. No tap powers (add/rename/reorder = E4). Also note: thin steps never set `goalIntent` ⇒ finalize runs with `briefGoal=null`, no goal-CTA stamping — accepted for E1.
4. e2e (seeded-resume entry, decision 9): journey 02→04 — 03 answers appear in the rail; a STEP 03 group answer round-trips through `loadDraft` with `kind:'category'` present (blocker-2 persistence check); 04 lists ≥1 page; back-nav across 02–04 doesn't duplicate sitemap seeding.
5. Unit: extend `rail.test.ts` only if STEP 03 needs a new rail action shape; otherwise no test-file churn.

**Files touched:**
- `src/components/onboarding/work/steps/StepWork.tsx` (edit)
- `src/components/onboarding/work/steps/StepQuestions.tsx` (edit)
- `src/components/onboarding/work/steps/StepPlan.tsx` (edit)
- `src/hooks/useWizardStore.ts` (edit — ONLY if the sitemap seed needs a work-shell-callable wrapper action; otherwise untouched; **shared file, regression risk**)
- `src/modules/wizard/work/rail.test.ts` (edit — only if a new rail action shape is needed)
- `e2e/work-onboarding.spec.ts` (edit)

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npx playwright test e2e/work-onboarding.spec.ts` · `npm run lint`.

---

## Phase 5 — STEP 05: we write and build it

**Goal:** STEP 05 drives `work/generate-copy` end-to-end via the existing driver, with honest progress + explicit failure states.

**Steps:**
1. `StepBuilding.tsx`: on entry, pre-flight — (a) `workCopyEngineEnabled(templateId)` FALSE ⇒ explicit "engine not enabled" error state, never silent skeleton (landmine 2; near-unreachable given the P2 dispatch also gates on the allow-list — the env flag is the remaining path); (b) `getWorkFacts(brief-from-live-briefFacts)` null ⇒ send back to STEP 03 with a message (landmine 6 surfacing; the seed + group-validity rules make this rare). Then `buildWorkInput(useWizardStore.getState())` → `runWorkLLMGeneration(input, { onStage, onPageProgress })` — reused verbatim, so `saveDraft`-before-copy, per-page persistence, resume, and MANDATORY `finalizeMultiPageGeneration` all come free (landmine 7). On success: `workStep = 6` (NO `router.push` — the reveal owns forward motion). Credits (402) and error results get distinct states.
2. UI per handoff STEP 05 LEFT PANEL ONLY (dark `#0b1830` honest-progress: eyebrow, display line, progress bar, per-page checklist from `onStage`/`onPageProgress`) — full-width; NO feel picker (ruling #4). Top bar right slot = "Building…" + spinning `progress_activity`.
3. Resume: extend `resolveResumeStep` — `isResumableGeneration(loaded)` ⇒ 5 (driver resumes mid-fan-out); finished finalContent ⇒ 6. Update test.
4. Env for deterministic runs: `NEXT_PUBLIC_WORK_COPY_ENGINE=true` + mock mode already wired into `playwright.config.ts` webServer env in P2. **Both are build-time inlined AND `reuseExistingServer: !CI` means a stale dev server silently ignores them — kill/restart the dev server before this phase's e2e run.**
5. e2e (seeded-resume entry, decision 9 — the fixture's persisted `facts.work` is what makes mock work generation runnable at all): 02→05 with mock generation completes and lands on STEP 06 state; a `loadDraft` after completion has `finalContent` (finalize marker cleared).
6. `work.llm.ts` is expected UNTOUCHED; listed only for the narrow case a missing export (e.g. a stage-label helper) must be surfaced — any edit must be re-export-only and called out in the audit.

**Files touched:**
- `src/components/onboarding/work/steps/StepBuilding.tsx` (edit)
- `src/components/onboarding/work/WorkTopBar.tsx` (edit — building status slot)
- `src/modules/wizard/work/resumeStep.ts` (edit)
- `src/modules/wizard/work/resumeStep.test.ts` (edit)
- `src/modules/wizard/generation/work.llm.ts` (expected NO-OP; re-export-only if unavoidable; **shared file, regression risk**)
- `e2e/work-onboarding.spec.ts` (edit)

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npx playwright test e2e/work-onboarding.spec.ts` (mock generation path, fresh server) · `npm run lint`.

---

## Phase 6 — STEP 06: the reveal → editor handoff

**Goal:** the magic moment — real generated site revealed, isolated from app chrome, one forward path into the editor, NO publish surface.

**Steps:**
1. Preview chrome-suppress (decision 6): `src/app/preview/[token]/page.tsx` gains a `chrome=0` query param — when set, render ONLY `LandingPageRenderer` (site content); the fixed action bar (Publish/Custom Domain/Back to Edit, `page.tsx:457-534`), SlugModal, and domain modal are not rendered. Default behavior (no param) byte-identical. Narrow, declared edit. **Build safety (non-blocking #1):** the page is a client page with NO `useSearchParams` today — introducing one without a Suspense boundary can fail `next build` (missing-suspense-with-csr-bailout), i.e. the P7 fresh-build gate. Approach: read the param via `useSearchParams` in a child wrapped in `<Suspense fallback={null}>` per the repo precedent at `src/app/dashboard/billing/page.tsx:155`; reading `window.location.search` in an effect is the acceptable fallback if the Suspense split fights the page's existing structure. Either way, run a local `npm run build` in THIS phase, not just P7.
2. `StepReveal.tsx`: `<iframe src="/preview/{token}?chrome=0">` full-size scrollable — separate document ⇒ `.app-chrome` can never leak in (landmine 1; verify no non-iframe rendering of site content anywhere in the shell). Desktop/phone segmented toggle (phone = constrained iframe width). Primary CTA "Open the editor" → `router.push('/edit/{token}')`. NO publish action anywhere on the step (handoff: the only forward is the editor). Loading state until iframe loads.
3. Top bar on 06 per handoff (`#f7f8fa` body, "Save & exit" → `/dashboard`).
4. e2e — the FULL-JOURNEY assertion (the automated E1 gate, seeded-resume per decision 9; the real 01→02 entry is P7 founder QA): `seedWorkBrief` → 02→06 → iframe visible with generated content (mock copy marker text) → assert the iframe document contains NO Publish button and the shell renders site content only inside the iframe → "Open the editor" → `/edit/{token}` loads the editor with the generated site; `loadDraft` asserts **`audienceType:'service'` + `templateId:'atelier'` + `brief.copyEngine:'work'`** throughout (work = engine, not audience).

**Files touched:**
- `src/app/preview/[token]/page.tsx` (edit — `chrome=0` suppress, Suspense-safe param read; **shared file, regression risk: default preview must be unchanged**)
- `src/components/onboarding/work/steps/StepReveal.tsx` (edit)
- `src/components/onboarding/work/WorkTopBar.tsx` (edit — step-06 variant polish)
- `src/modules/wizard/work/resumeStep.ts` (edit — finished ⇒ 6, if not fully landed in P5)
- `e2e/work-onboarding.spec.ts` (edit — full-journey spec)

**Verification:** `npx tsc --noEmit` · `npm run test:run` · `npx playwright test e2e/work-onboarding.spec.ts` · `npm run lint` · **`npm run build` (Suspense/useSearchParams safety — don't defer to P7)** · manual: `/preview/{token}` WITHOUT the param still shows the normal action bar.

---

## Phase 7 — Gates sweep + founder QA

**Goal:** green everything; prove isolation; human sign-off on the handoff.

**Steps:**
1. Full sweep: `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · **fresh** `npm run build` (published.css sha256 vs fixture is only valid against a fresh artifact — landmine 10).
2. Isolation guards: `tailwindConfigFreeze.test.ts` green (we added NO tailwind keys); `npx playwright test e2e/ui-isolation.spec.ts` green; fixture `e2e/fixtures/ui-isolation-computed-styles.json` NOT regenerated.
3. Full e2e suite `npm run test:e2e` (work-onboarding + dispatch + legacy-unchanged + ui-isolation) — fresh server.
4. Founder QA checklist handed to the user: (a) **real STEP 01 entry (real-LLM, flag ON, mock OFF — the path automation CANNOT cover, decision 9/landmine 13):** a work-shaped one-liner (Kundius-style photographer) classifies to work → `WorkEntryStep` renders (not `ConfirmBriefStep`) → confirm serves → shell mounts at STEP 02 with a correctly seeded rail; also spot-check the manual verdict path (`ManualOnboardStep`) and one edited-line re-classify (notes: costs 1 UNDERSTAND credit; no `applyBusinessTypeCorrection` — decision 3 trade-off); (b) full journey 01→06: reveal quality, rail correctness/correctability; (c) reveal→editor: site opens EDITABLE, edits save, correct template (`atelier`) + audience (`service`); (d) **explicit gate item (orchestrator ruling #5): founder decides `NEXT_PUBLIC_WORK_COPY_ENGINE` prod/Vercel state at the merge gate** — build-time inlined, flipping = redeploy (landmine 2); do not block earlier phases on it; (e) legacy product/service onboarding spot-check + granth/writer path lands on `WizardShell` post-confirm (the pre-confirm STEP 01 visual for granth drafts is the accepted decision-2 cosmetic); (f) `/preview/{token}` default (no param) unchanged.
5. Fixes arising are made ONLY in files already listed in P1–P6.

**Files touched:**
- (fix-only; limited to files already in P1–P6 lists)

**Verification:** all green gates above.

**HUMAN GATE — reveal → editor handoff (founder QA).** A generated work site opens editable from STEP 06; the REAL classify→STEP 01 entry is verified here (automation cannot reach it in mock mode); prod flag decision made by the founder at this gate. Merge to main is the usual separate human gate.

---

## Green gates (every phase where code changes)

`npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` (P6 + P7 mandatory — P6 for the Suspense/useSearchParams edit; earlier phases at implementer discretion when styling/assets change). Playwright runs need a FRESH dev server whenever env flags changed (`reuseExistingServer: !CI`).

## Unresolved questions

None — both rev-2 questions ruled: (1) pre-E1 work projects resume into STEP 03, no retro-seed, safe because every STEP 03 group write is `kind`-valid; (2) param stays `chrome=0`.
