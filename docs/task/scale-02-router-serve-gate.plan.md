# scale-02 — router + serve gate: implementation plan

**Branch: `feature/scale`** (shared accumulating scale branch — NO per-spec branch; scale-01 already merged here). Every implementer/impl-reviewer must verify `git branch --show-current` = `feature/scale`.

Spec: `docs/task/scale-02-router-serve-gate.spec.md`. Depends on scale-01 (all landed on this branch): `@/types/brief`, `@/lib/schemas/brief.schema`, `@/modules/goals/vocabulary`, `@/modules/templates/templateMeta`, `@/modules/engines/coreSections`, `@/modules/businessTypes/config`, `@/modules/templates/fit` (`fit`/`shortlist`/`fitsBrief`/`requiredCapabilitiesFromBrief`), `Project.brief Json` column. **Use them; recreate nothing.**

## Overview

Replace the persona gate + pilot allowlist + waitlist with one universal entry `/onboarding/[token]`: user gives a one-liner or URL → the EXISTING understand/scrape AI call (extended, single call, cheap model) emits Brief-draft signals → CODE resolves copyEngine via the `businessTypes` lookup (zero AI) → page-2 confirm card (user language, 1-tap correct) → serve gate on the confirmed Brief → SERVE bridges into today's product/service wizard (Project.brief is the carrier; wizard store hydrated on mount) or MANUAL-ONBOARD captures a `DemandLead` (founder Resend email, fast-track upgrade, admin demand board). Hard invariant: existing product/service e2e stay green; wizard steps/components untouched — spec 02 only bridges INTO them (mount-level hydrate in each wizard `page.tsx` only).

## Progress log

- phase 1 brief modules (classify/serveGate/bridge/playback): pending
- phase 2 DemandLead migration: pending
- phase 3 classification extension of understand/scrape: pending
- phase 4 API routes (brief confirm/hydrate + demand-lead): pending
- phase 5 entry UI /onboarding/[token]: pending
- phase 6 cutover (/api/start, old-route redirects, wizard bridge hydrate): pending
- phase 7 admin demand board + final sweep: pending

## Key decisions (the spine — resolved, not open)

**D1. Brief carrier = `Project.brief` (scale-01 column).** Data flow: entry page holds the classified draft in client state (in-memory, mirrors wizard-store pattern; reload = restart entry, acceptable) → page-2 confirm POSTs to `/api/brief/confirm` → server re-runs the gate on the confirmed Brief (authoritative, never trusts a client verdict) → on SERVE writes `Project.{brief, audienceType, templateId}` in one update and returns the wizard redirect → wizard `page.tsx` mount-effect GETs `/api/brief?tokenId=` and hydrates its store from `brief` + `templateId`. Wizard prefill signals ride inside the Brief itself under `brief.facts.entry` (the schema's `facts: z.record(...)` — no schema change needed). MANUAL path writes nothing to Project; the draft goes into `DemandLead.briefDraft`.

**D2. SERVE is gated by BRIDGE AVAILABILITY, not just `fit()`.** Launch bridges (spec §11.9): `thing → product wizard`, `trust → service wizard`. `work` has a live engine + template (granth) but NO wizard entry until spec 06; `place`/`quick-yes` engines don't exist. Gate rule: **SERVE iff businessType ∈ `businessTypes` (known) AND in-ICP AND copyEngine ∈ {thing, trust} AND `shortlist(brief)` non-empty.** Everything else → MANUAL-ONBOARD with an explicit `missing` tag (table below). Unknown businessType ⇒ MANUAL even when the tiebreaker engine is bridgeable — we can't derive required capabilities/extraction shape for an unknown type; the rung-A ladder ("add config entry") is precisely the founder's unblock. Failed-clause evaluation is exhaustive (collect ALL clauses, not first-fail) so the board sees compound gaps like photographer = C+A.

`missing` (single string, comma-joined ordered tags — spec §6 "rungA-E|out-of-icp + capability/engine key"):
| Clause | Tag | Example |
|---|---|---|
| transactional platform needed (checkout/ordering) | `out-of-icp` | "online store with checkout" |
| businessType not in List 1 | `rungA:<raw guess or 'unclassified'>` | `rungA:photographer` |
| engine not live (place/quick-yes) | `rungE:<engine>` | restaurant |
| engine live, no wizard bridge (work, until spec 06) | `bridge:work` | writer |
| bridgeable engine but shortlist empty — unmet caps | `rungC:<capability>` | `rungC:gallery` |
Photographer acceptance ⇒ `missing = "rungC:gallery,rungA:photographer"` (tiebreaker rung `portfolio-is-proof` derives a `gallery` capability requirement in code — that's how rung C fires with no businessType entry). rungB reserved (mechanism machinery = spec 04, not evaluated v1).

**D3. engine→ServiceType mapping (persona is dead).** SERVE only happens with a KNOWN businessType (D2), so the map is businessType-keyed and tiny, in `bridge.ts`: `agency→'agency'`, `consultant→'consultancy'`, `coach→'coaching'` (fallback `'agency'`, matching OneLinerStep's existing fallback). Thing-side template pick: style-match `shortlist` against `templateMeta.designStyle` using `brief.designStyleHint ?? businessTypes[bt].defaultStyle`, else `shortlist[0]` — gives agency→surge (bold-performance), manufacturer→vestria, saas→meridian, satisfying acceptance without hardcoding.

**D4. `/api/start` stays the creator; entry absorbs the gate, not the bootstrap.** Rewritten `/api/start`: keep user upsert + default-plan + **keep persona→audienceType derivation for the Project row** (back-compat: e2e `publish.spec.ts` seeds drafts straight off `/api/start` and dispatch keys on `Project.audienceType`; the serve gate overwrites it at confirm for real users) — DELETE the persona-prompt redirect + `PILOT_SERVICE_PERSONAS` waitlist branch — return `/onboarding/{token}` (new entry). DashboardHeader keeps working unchanged (`{url}` shape preserved; token still last path segment, so e2e line 35 parses). `/api/user/persona` route and `User.persona` column stay (e2e + wizard-step readers). Old routes become redirects: `/onboarding/persona` and `/onboarding/waitlist` → `/dashboard` (fresh entry needs a token; dashboard button mints one). Claim-on-visit moves into the entry `layout.tsx` (same `updateMany where userId:null` idiom); wizard layouts keep theirs.

**D5. Scope discipline.** Wizard steps/components/stores/copy/sections untouched. Only wizard-file edits allowed: a mount-level hydrate effect in `product/[token]/page.tsx` + `service/[token]/page.tsx` (bridge INTO the store, then `goToStep('understanding')` — mirrors the existing import-hydrate pattern, and skips OneLinerStep so the entry's 1-credit classify call is not re-charged). Hydrate no-ops when `Project.brief` is null ⇒ today's flows byte-identical. Service `layout.tsx` is edited only to remove the persona/waitlist gate (it breaks otherwise — persona may be null now).

**D6. One AI call, engine lookup in code.** Entry classify = the existing `generateWithSchema('understand'|'scrapeWebsite', ...)` call with an `entry: true` request flag selecting an extended schema + appended prompt block. AI emits only raw signals (businessTypeGuess + confidence, category, goalIntent from vocabulary, tiebreaker rung, structureHint, designStyleHint, platformNeeds, neutral understanding superset, facts/proof/socials). `copyEngine` resolution + tiebreaker ladder + gate = pure code (`classify.ts`/`serveGate.ts`). Costs the existing 1 credit (UNDERSTAND / SCRAPE_WEBSITE) — no new credit constant.

**D7. Confirm-card chooser = businessType cards, not engine cards.** User-language cards from `businessTypes[*].label` (6) + "Something else". Tap → set businessType → engine via lookup → gate re-runs on corrected Brief (acceptance: 1-tap fix). "Something else" → MANUAL capture (rungA). Internal terms (engine/archetype/rung) never rendered. Low confidence (`< 0.6`, tunable const) ⇒ chooser upfront.

---

## Phase 1 — pure brief modules: classify, serveGate, bridge, playback

No app wiring; zero runtime change (scale-01 idiom). All pure modules — no 'use client', no template/resolver/registry imports (firewall), importable from server routes AND client components.

**Files touched**
- `src/modules/brief/classify.ts` (create)
- `src/modules/brief/serveGate.ts` (create)
- `src/modules/brief/bridge.ts` (create)
- `src/modules/brief/playback.ts` (create)
- `src/modules/brief/classify.test.ts` (create)
- `src/modules/brief/serveGate.test.ts` (create)
- `src/modules/brief/bridge.test.ts` (create)
- `src/modules/brief/README.md` (create)

**Steps**
1. `classify.ts` — define `EntrySignals` interface (raw AI output shape: `businessTypeGuess`, `businessTypeConfidence`, `category`, `goalIntentGuess: GoalIntent|null`, `tiebreaker: 'expertise'|'portfolio-is-proof'|'browsing-place'|'offer-already-understood'|'none'`, `structureHint: 'single'|'multi'`, `designStyleHint: DesignStyle|null`, `platformNeeds: 'none'|'checkout'|'ordering'|'booking-payments'`, neutral prefill: `summary`, `businessName`, `offerings[]`, `audiences[]`, `categories[]`, `outcomes[]`, `deliveryModel|null`, `offer`, `oneLiner`, `proofAvailable[]`, `socialProfiles[]`, `testimonials[]`).
   - `resolveEngine(signals)`: businessType ∈ `businessTypes` ⇒ `{ engine: entry.copyEngine, source: 'lookup' }` (ZERO AI); unknown ⇒ ladder `expertise→trust · portfolio-is-proof→work · browsing-place→place · offer-already-understood→quick-yes · else thing`, `source: 'tiebreaker'` (= rung-A marker).
   - `buildBriefDraft(signals, rawInput)` → `Brief` (validated `BriefSchema.parse`): businessType (known key or raw guess), copyEngine, category, `goal` from `goalIntentGuess` + `goalIntentMeta[...].mechanisms[0]` (primary), `structure {mode: structureHint, pages: []}`, designStyleHint, confidence, proofAvailable, socialProfiles, and **`facts.entry` = full prefill payload + `{ rawInput, classificationSource, tiebreaker, platformNeeds }`** (D1 carrier).
   - Export `LOW_CONFIDENCE_THRESHOLD = 0.6`.
2. `serveGate.ts` — `decideServe(brief): ServeDecision`. Evaluate ALL clauses per D2 table (portfolio-is-proof tiebreaker adds `gallery` to required caps before `shortlist()`; use scale-01 `shortlist`/`requiredCapabilitiesFromBrief`). Return `{ outcome: 'serve', audienceType: 'product'|'service', templateId, shortlist }` or `{ outcome: 'manual', missing: string, tags: string[], outOfIcp: boolean }`. templateId per D3 style-match. `BRIDGEABLE_ENGINES: Record<'thing'|'trust', AudienceType>` const with a loud comment: work bridge lands spec 06 — delete `bridge:work` clause there.
3. `bridge.ts` — `briefToProductPrefill(brief)` → `{ oneLiner, productName, understanding: {categories, audiences, whatItDoes, features}, offer?, landingGoal? }`; `briefToServicePrefill(brief)` → `{ oneLiner, businessName, understanding: {serviceType, whatYouDo, services, targetClients, outcomes, deliveryModel}, goal?, offer?, importedTestimonials? }`. Maps: businessType→ServiceType (D3); goalIntent→`ServiceGoal` (direct where names match: book-call/request-quote/lead-magnet/apply/subscribe-newsletter; else omit — GoalStep asks anyway); goalIntent→product `LandingGoal` (small table vs `landingGoals` in `@/types/generation`; unmapped → omit). deliveryModel default `'remote'` when null. All fields read from `brief.facts.entry`; return null when absent (hydrate no-op guard).
4. `playback.ts` — `playbackSentence(brief)`: user-language card line ("A page for your {category|label} that gets visitors to {goalIntentMeta label, lowercased}"); `chooserCards()`: businessType label cards + "Something else" (D7). Copy centralized here for the founder's pre-launch review (spec open q1).
5. Tests: engine lookup for all 6 businessTypes; tiebreaker ladder all 5 rungs; the 3 acceptance fixtures end-to-end through `buildBriefDraft`+`decideServe` — "growth agency for SaaS"-shaped signals ⇒ serve/service/surge + shortlist `['hearth','lex','surge']`; photographer signals ⇒ manual `missing==='rungC:gallery,rungA:photographer'`; checkout signals ⇒ manual `out-of-icp`; writer (known type, work) ⇒ manual `bridge:work`; low-confidence const; bridge maps incl. serviceType fallback + null-brief no-op.
6. `README.md`: module purpose, D1 spine diagram, D2 gate table, firewall note, spec-06 unlock pointer.

**Verification**: `npx tsc --noEmit` clean · `npx vitest run src/modules/brief` green · `npm run test:run` green · grep: no app file imports `@/modules/brief` yet (zero runtime change).

---

## Phase 2 — DemandLead model + migration  ⚠️ HUMAN GATE (schema migration; additive — auto-approved per user rule, still announce)

**Files touched**
- `prisma/schema.prisma` (edit)
- `prisma/migrations/<timestamp>_add_demand_lead/migration.sql` (generated)

**Steps**
1. Add model (FormSubmission idiom — string status, NOT enum):
   ```prisma
   model DemandLead {
     id         String   @id @default(cuid())
     input      String            // raw one-liner or URL
     briefDraft Json              // classified Brief draft at submit time
     missing    String            // "rungC:gallery,rungA:photographer" | "out-of-icp" | "bridge:work" | "rungE:place"
     email      String
     phone      String?
     fasttrack  Boolean  @default(false)
     status     String   @default("new")   // new|contacted|converted|declined
     createdAt  DateTime @default(now())
     @@index([status, createdAt])
     @@index([missing])
   }
   ```
2. `npx prisma migrate dev --name add_demand_lead` — NEVER `db push`. Expect pure additive `CREATE TABLE`, no reset/prompt.
3. `npx prisma generate` — note: EPERM engine-DLL rename if dev server running (benign, see scale-01 audit; clean `.tmp` leftovers).

**Verification**: `npx prisma migrate status` up-to-date · migration.sql is CREATE TABLE only · `npx tsc --noEmit` clean · `npm run test:run` green (no readers yet ⇒ zero behavior change by construction).

---

## Phase 3 — classification extension of understand + scrape (entry mode)

Extend, do NOT add a second AI call. Flag-gated: `entry !== true` ⇒ both routes byte-identical to today (generation-contract/golden tests must stay green).

**Files touched**
- `src/lib/schemas/entryClassify.schema.ts` (create)
- `src/lib/schemas/index.ts` (edit — export new schemas; confirm this barrel exists, routes import from `@/lib/schemas`)
- `src/lib/schemas/entryClassify.schema.test.ts` (create)
- `src/app/api/v2/understand/route.ts` (edit)
- `src/app/api/v2/scrape-website/route.ts` (edit)

**Steps**
1. `entryClassify.schema.ts` — `EntrySignalsSchema` (zod mirror of phase-1 `EntrySignals`; enums from `@/modules/goals/vocabulary` + `@/types/brief`; nullable-not-optional fields per the OpenAI strict-structured-outputs idiom noted in scrapeWebsite.schema.ts). Two composites: `EntryUnderstandSchema` (signals + neutral understanding, standalone — one-liner path) and `EntryScrapeSchema = ScrapeWebsiteExtendedSchema.extend(signal fields)` (URL path keeps verbatim testimonials/facts/excerpts).
2. `understand/route.ts` — request schema `.extend({ entry: z.boolean().optional() })`. `entry===true` branch: entry prompt builder (extraction rules + tiebreaker-signal instructions + goal-intent menu from `goalIntentMeta` labels + businessType guess menu from `businessTypeKeys` labels; explicitly "guess only, do not decide engine"), `generateWithSchema('understand', ..., EntryUnderstandSchema, 'entry_understanding')`, then **server-side** `buildBriefDraft()` (phase 1) → respond `{ success, data, briefDraft, creditsUsed }`. Demo mode: add an entry fixture (agency-shaped ⇒ serve path testable free). Credits: existing `UNDERSTAND` cost, metadata `extractionShape: 'entry'`.
3. `scrape-website/route.ts` — same pattern with `EntryScrapeSchema` + appended prompt block; briefDraft built from mapped signals (oneLiner/productName/offer/testimonials already emitted — reuse as prefill); existing SCRAPE_WEBSITE cost. Non-entry paths (SaaS/extended/manufacturer) untouched.
4. Schema test: parse fixtures for both composites; reject bad enum; assert non-entry schemas untouched (import equality / shape spot-check).

**Verification**: `npx tsc --noEmit` clean · `npm run test:run` green (generation contract + golden untouched) · manual: dev server + demo mode, POST `/api/v2/understand` `{oneLiner, entry:true}` returns `briefDraft` with `copyEngine` resolved by lookup; same POST without `entry` returns today's exact shape.

---

## Phase 4 — API routes: brief confirm/hydrate + demand-lead + founder email

**Files touched**
- `src/app/api/brief/route.ts` (create — GET hydrate)
- `src/app/api/brief/confirm/route.ts` (create — POST gate + write)
- `src/app/api/demand-lead/route.ts` (create — POST create, PATCH fasttrack)

**Steps**
1. `GET /api/brief?tokenId=` — Clerk auth + `assertProjectOwner` (authz-fix helper, 2026-07-02 — grep `assertProjectOwner` under `src/lib` for its home; mandatory on new token routes per memory). Returns `{ brief, audienceType, templateId }` from Project. 404 when no project.
2. `POST /api/brief/confirm` — body `{ tokenId, brief }`, `BriefSchema.parse`, `assertProjectOwner`. Server re-runs `decideServe(brief)` (D1 — authoritative). SERVE ⇒ one `prisma.project.update` `{ brief, audienceType, templateId }` (pre-writing templateId is safe: column nullable; wizard store hydrates the same value and generation-time saveDraft re-writes it consistently) ⇒ return `{ outcome:'serve', redirectTo: '/onboarding/{product|service}/{token}' }`. MANUAL ⇒ NO project write ⇒ return `{ outcome:'manual', missing, outOfIcp }`. `createSecureResponse` idiom.
3. `POST /api/demand-lead` — Clerk-gated (beta-private §11.10; `auth()` required). Body zod: `{ input, briefDraft, missing, email (validated), phone?, fasttrack? }`. `withFormRateLimit`. Create row, then founder notify in try/catch AFTER the DB write (forms/submit idiom — lead saved even if email fails): `sendLeadNotification({ formName: 'Demand lead' + (fasttrack ? ' — FAST TRACK' : ''), data: flat {input, businessType, engine, missing, email, phone, fasttrack}, replyTo: email })`. Return `{ id }`.
   `PATCH` — `{ id, fasttrack: true }`: update row + second high-priority notification (spec §11.11 double-intent). v1 accepts own-lead-id from client state (no cross-user harm beyond flagging; note in code).
4. No middleware change: `/api/brief*`/`/api/demand-lead` are protected-by-default (not in the public list) — verify, don't edit.

**Verification**: `npx tsc --noEmit` clean · `npm run test:run` green · manual dev: confirm an agency-shaped brief ⇒ Project row shows brief+audienceType='service'+templateId='surge'; photographer brief ⇒ `manual` + DemandLead row + (env-gated) email log; PATCH flips fasttrack.

---

## Phase 5 — entry UI `/onboarding/[token]`

New route segment only — static siblings (`persona`, `waitlist`, `product`, `service`) outrank `[token]` in App Router matching; verify once in dev. Nothing else routes here yet (cutover = phase 6), so this phase is invisible to existing flows.

**Files touched**
- `src/app/onboarding/[token]/layout.tsx` (create)
- `src/app/onboarding/[token]/page.tsx` (create)
- `src/app/onboarding/[token]/components/EntryInputStep.tsx` (create)
- `src/app/onboarding/[token]/components/ConfirmBriefStep.tsx` (create)
- `src/app/onboarding/[token]/components/ManualOnboardStep.tsx` (create)

**Steps**
1. `layout.tsx` (server) — Clerk guard (`redirect('/sign-in')`), claim-on-visit (`updateMany where {tokenId, userId:null}` — copy product layout idiom), project-existence check (`findUnique` by tokenId; missing ⇒ `redirect('/dashboard')`). No persona reads anywhere.
2. `page.tsx` (client) — 3-step local-state flow (`useState`, no new zustand store): `input → confirm → manual` + serve-redirect. Holds `{ rawInput, briefDraft, leadId }`.
3. `EntryInputStep` — single field, one-liner OR URL (URL-detect regex — reuse OneLinerStep's pattern). URL ⇒ POST `/api/v2/scrape-website` `{..., entry:true}`; text ⇒ `/api/v2/understand` `{oneLiner, entry:true}`. Loading/error states per OneLinerStep conventions. On success → confirm step with `briefDraft`.
4. `ConfirmBriefStep` — `playbackSentence(briefDraft)` card (user language, NO internal terms), 1-tap **Confirm** + "Not quite right?" chooser (`chooserCards()`, D7). `confidence < LOW_CONFIDENCE_THRESHOLD` ⇒ chooser rendered upfront. Chooser tap ⇒ set businessType, re-resolve engine via `resolveEngine` (client-safe pure module), update draft, gate on next confirm (1-tap acceptance). "Something else" ⇒ manual step directly (missing=`rungA:unclassified`). Confirm ⇒ POST `/api/brief/confirm` ⇒ `serve` → `router.push(redirectTo)`; `manual` → manual step with server's `missing`.
5. `ManualOnboardStep` — spec §5 copy verbatim: "Not automated yet — someone from Lessgo AI will connect with you shortly." Email required, phone optional. Submit ⇒ POST `/api/demand-lead` (briefDraft + missing + input), keep `leadId`. Thank-you shows "Need it sooner?" ⇒ PATCH fasttrack ⇒ message upgrades to "Sushant will connect with you shortly to personalize." (§11.11). Identical screen for out-of-icp (internal tag differs only in payload).

**Verification**: `npx tsc --noEmit` · `npm run test:run` · manual dev (real LLM): mint a token via `/api/start`, hand-navigate to `/onboarding/{token}`, run the 3 acceptance inputs — agency ⇒ serve redirect into service wizard URL (store hydrate lands phase 6 — wizard starting empty is EXPECTED here); photographer ⇒ manual + DemandLead row + fasttrack upgrade; checkout ⇒ out-of-icp same screen; wrong-guess input corrected via chooser in 1 tap. Existing wizards untouched (no files under product/service edited).

---

## Phase 6 — cutover: /api/start rewrite, old-route redirects, wizard bridge hydrate  ⚠️ HUMAN GATE (access-control semantics: persona gate + pilot allowlist removed; user sign-off before commit)

Atomic phase — the gate can't be half-replaced. This is the behavior-change core; e2e green is the exit criterion.

**Files touched**
- `src/app/api/start/route.ts` (edit)
- `src/app/onboarding/persona/page.tsx` (edit — replace with redirect)
- `src/components/onboarding/PersonaPrompt.tsx` (delete)
- `src/app/onboarding/waitlist/page.tsx` (edit — replace with redirect)
- `src/app/onboarding/waitlist/WaitlistForm.tsx` (delete)
- `src/app/onboarding/service/[token]/layout.tsx` (edit)
- `src/app/onboarding/product/[token]/page.tsx` (edit — hydrate effect only)
- `src/app/onboarding/service/[token]/page.tsx` (edit — hydrate effect only)
- `src/app/README.md` (edit — entry/persona docs)

**Steps**
1. `/api/start` per D4: delete persona-prompt redirect + `PILOT_SERVICE_PERSONAS` + waitlist branch; KEEP upsert/default-plan/persona→audienceType-on-Project (e2e back-compat — `publish.spec.ts` comment "audienceType is captured on the Project at /api/start" stays true); return `${SITE_URL}/onboarding/${tokenValue}`. Response shape `{url}` unchanged ⇒ DashboardHeader untouched.
2. `/onboarding/persona/page.tsx` → server `redirect('/dashboard')` (comment: replaced by scale-02 router). Delete `PersonaPrompt.tsx`. **Keep `/api/user/persona`** (e2e + UnderstandingStep/OneLinerStep/product-page readers).
3. `/onboarding/waitlist/page.tsx` → server `redirect('/dashboard')`; delete `WaitlistForm.tsx`.
4. `service/[token]/layout.tsx` — remove persona lookup, persona-prompt bounce, `PILOT_SERVICE_PERSONAS`, persona-derived wrong-audience redirect. Keep auth + claim-on-visit. Add soft guard keyed on Project not persona: `project.audienceType === 'product'` ⇒ redirect to product wizard (bookmarked-URL case); anything else passes.
5. Wizard hydrate (D5 — page.tsx ONLY, steps/stores untouched): one mount effect per wizard — GET `/api/brief?tokenId=`; no brief / no `facts.entry` / store already dirty (`currentStep !== 'oneLiner'` or oneLiner set) ⇒ no-op. Else `briefToProductPrefill`/`briefToServicePrefill` (phase 1) → store setters (`setTemplateId` from response templateId — bypasses the `?template=` whitelist path; `setOneLiner`/`setProductName|setBusinessName`/`setUnderstanding`/`setOffer`/`setLandingGoal|setGoal`/`setImportedTestimonials` when present) → `goToStep('understanding')` (skips OneLinerStep ⇒ no double AI charge; mirrors import-hydrate). Product: sequence AFTER the existing resume check (share/extend the `checkedResume` ref flow so resume-to-generating wins) — do not reorder existing effects.
6. `src/app/README.md`: rewrite entry-flow paragraph (persona gate → universal entry + serve gate).
7. Grep sweep: no remaining reader of `PILOT_SERVICE_PERSONAS`, `PersonaPrompt`, `WaitlistForm`, `/onboarding/persona?next=` (README/comments included).

**Verification**: `npx tsc --noEmit` · `npm run test:run` · **`npm run test:e2e` — publish.spec (product + service) AND generation/render specs GREEN (the hard invariant)** · manual dev end-to-end: dashboard "New project" → entry → "growth agency for SaaS" → confirm → service wizard opens ON UnderstandingStep, prefilled, surge selected; a legacy direct wizard URL with a brief-less project behaves exactly as today.

---

## Phase 7 — admin demand board + final sweep

**Files touched**
- `src/app/admin/page.tsx` (edit)

**Steps**
1. Add a "Demand board" `<section>` to the existing single admin page (server, `isAdmin(userId) || notFound()` already present): `prisma.demandLead.findMany` (take 500, `orderBy: [{fasttrack:'desc'},{createdAt:'desc'}]`); group in JS (Json fields can't groupBy): (a) counts ranked by `missing` tag (split comma-joined, count per tag — "3 leads blocked on gallery" per scalePlan §7 rule 6), (b) counts by `briefDraft.businessType`/engine, (c) lead table — fasttrack rows pinned + visually flagged, status/email/input/missing/createdAt columns. Hand-rolled Tailwind tables per file idiom.
2. Final sweep (spec acceptance gate): full `npm run build` (published-css → assets → next build) · `npm run test:run` · `npm run test:e2e` · re-run 3 acceptance inputs manually against dev · confirm demand board shows the photographer lead grouped under `rungC:gallery` with fasttrack pinned.

**Verification**: `npx tsc --noEmit` · `npm run test:run` · `npm run build` succeeds · manual `/admin` view as admin; non-admin gets 404.

---

## Landmine checklist (all phases)

- No block/renderer work in this spec ⇒ dual-renderer parity untouched; never import template modules/resolvers/registry into brief modules or routes (firewall).
- `prisma migrate dev`, never `db push` (phase 2 only schema change).
- Entry flag absent ⇒ understand/scrape byte-identical (frozen generation-contract/golden tests are the tripwire).
- Wizard edits = page.tsx hydrate effects ONLY; any step/store/component diff is a defect until spec 06.
- Build ≠ next build — full `npm run build` in phase 7.

## Unresolved questions

1. Unknown businessType + bridgeable engine ⇒ plan says MANUAL (rungA) even when shortlist non-empty. Confirm vs alt reading (serve + tag rung-A on file)?
2. Old `/onboarding/persona` + `/waitlist` redirect → `/dashboard` ok? (alt: mint token server-side → new entry; risks orphan rows).
3. DemandLead: add optional `userId`/`tokenId` columns now (convert-loop/resume later) or keep spec-exact fields?
4. Fast-track PATCH accepts client-held lead id w/o ownership row (Clerk-authed only) — ok for v1?
5. Confidence threshold 0.6 fine as launch const?
6. Chooser = 6 businessType cards + "Something else" (not 5 engine cards) — approve copy direction? (founder reviews wording pre-launch per spec open q1).
7. Demo-mode entry fixture = agency/serve-shaped only — enough, or want a manual-path fixture too (photographer) for free QA?
