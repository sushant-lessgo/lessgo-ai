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

---

## Phase 2 — DemandLead model + migration

**Files changed**
- `prisma/schema.prisma` — added `DemandLead` model (appended at end)
- `prisma/migrations/20260707210859_add_demand_lead/migration.sql` — CLI-generated

**Final model (as in schema.prisma):**
```prisma
model DemandLead {
  id         String   @id @default(cuid())
  userId     String // Clerk id of creator — PATCH ownership scope (phase 4)
  input      String // raw one-liner or URL
  briefDraft Json // classified Brief draft at submit time
  missing    String // "rungC:gallery,rungA:photographer" | "out-of-icp" | "bridge:work" | "rungE:place"
  email      String
  phone      String?
  fasttrack  Boolean  @default(false)
  status     String   @default("new") // new|contacted|converted|declined
  createdAt  DateTime @default(now())

  @@index([status, createdAt])
  @@index([missing])
  @@index([userId])
}
```

**Migration:** `20260707210859_add_demand_lead/migration.sql`
```sql
-- CreateTable
CREATE TABLE "DemandLead" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "briefDraft" JSONB NOT NULL,
    "missing" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "fasttrack" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemandLead_status_createdAt_idx" ON "DemandLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DemandLead_missing_idx" ON "DemandLead"("missing");

-- CreateIndex
CREATE INDEX "DemandLead_userId_idx" ON "DemandLead"("userId");
```

**Deviations**
- Orchestrator's task message said the revised plan model has `userId String?`
  (optional); the plan's actual Phase-2 block (line 93) says `userId String`
  (required). Plan text is authoritative per instructions ("reproduce verbatim")
  → used REQUIRED `userId`. This also matches phase 4 (route is Clerk-gated,
  userId always set at create).

**Verification**
- `npx prisma migrate status` — "Database schema is up to date!" (22 migrations) ✅
- migration.sql — CREATE TABLE + 3 CREATE INDEX only; no DROP/ALTER, no data migration ✅
- `npx tsc --noEmit` — clean ✅
- `npm run test:run` — 63 files passed | 1 skipped; 874 tests passed | 2 skipped ✅

**Gotchas**
- Known EPERM on `prisma generate` (query_engine-windows.dll.node rename blocked
  by running dev server) — hit twice; benign per scale-01 audit: client JS/types
  regenerated (`DemandLead` present in `node_modules/.prisma/client/index.d.ts`),
  DLL is same version already in place. `.tmp` leftovers cleaned.

**Open risks**
- None. No readers of DemandLead yet ⇒ zero behavior change by construction.

---

## Phase 3 — classification extension of understand + scrape (entry mode)

**Files changed**
- `src/lib/schemas/entryClassify.schema.ts` (created)
- `src/lib/schemas/index.ts` (edited — 1 line, barrel export)
- `src/lib/schemas/entryClassify.schema.test.ts` (created)
- `src/app/api/v2/understand/route.ts` (edited — additive)
- `src/app/api/v2/scrape-website/route.ts` (edited — additive)

**Per file**

- `entryClassify.schema.ts` — `EntrySignalsSchema` (full zod mirror of phase-1
  `EntrySignals`; compile-time parity guard `EntrySignalsData extends EntrySignals`).
  Idiom copied from `scrapeWebsite.schema.ts`: nullable-NOT-optional for guess
  fields (OpenAI strict structured outputs); NO numeric min/max on
  `businessTypeConfidence` (strict json_schema conversion risk — range is
  prompt-enforced, matching the file's existing avoidance of string `.min` on
  suggested fields). Composites: `EntryUnderstandSchema = EntrySignalsSchema`
  (standalone one-liner path) and
  `EntryScrapeSchema = ScrapeWebsiteExtendedSchema.extend({...signal fields})`
  — base name confirmed as `ScrapeWebsiteExtendedSchema`; extension deliberately
  EXCLUDES fields the base already has (oneLiner/productName/categories/
  audiences/offer/testimonials) so verbatim `{quote,author_name,author_role}`
  testimonials + facts + excerpts are preserved; route maps base→signals.
  Enums sourced from `@/modules/goals/vocabulary` (goalIntents/goalIntentMeta),
  `@/types/brief` (designStyles), `@/modules/businessTypes/config` (keys+labels).
  Also exports two prompt-block builders (`entryClassificationPromptBlock`,
  `entryPrefillDeltaPromptBlock`) — co-located here because the menus derive
  from the same closed vocabularies as the schema enums, and the only other
  allowed homes were the two routes (would mean duplicated menu text). Both
  blocks state "guess only — do not decide the engine". Firewall: imports are
  zod + pure vocab/config modules + a TYPE-ONLY import from
  `@/modules/brief/classify` (erased at compile) — no template/resolver/registry.

- `index.ts` — barrel EXISTS and both routes already import from `@/lib/schemas`;
  added `export * from './entryClassify.schema';` following the existing
  `export *` convention. (Noted: barrel doesn't export brief/productStrategy/
  strategyService schemas — left as-is, matched sibling scrape/understand
  convention.)

- `understand/route.ts` — request schema gains `entry: z.boolean().optional()`
  (additive field inside the existing object). New code: imports,
  `buildEntryUnderstandPrompt()` (neutral fields + delta block + classification
  block + no-invention rules), `ENTRY_DEMO_SIGNALS` (agency-shaped ⇒ serve path
  testable free), `handleEntryUnderstand()` (demo branch → fixture+briefDraft;
  real branch → `generateWithSchema('understand', ..., EntryUnderstandSchema,
  'entry_understanding')` → SERVER-SIDE `buildBriefDraft(signals, oneLiner)` →
  `consumeCredits(UNDERSTAND)` with metadata `extractionShape:'entry'` →
  `{ success, data, briefDraft, creditsUsed, creditsRemaining }`). Branch wired
  as `if (entry === true) return handleEntryUnderstand(...)` immediately after
  auth, BEFORE the existing demo-mode block — existing statements untouched.

- `scrape-website/route.ts` — same pattern: `entry` flag on request schema;
  `mapEntryScrapeToSignals()` (base fields double as prefill: productName→
  businessName, testimonials→quote strings); `MOCK_DATA_ENTRY` (agency-shaped,
  facts/excerpts stripped like the other mocks); `handleEntryScrape()` — demo →
  fixture+briefDraft; real → own crawl (same scrapeSite/ScrapeError/no_content
  handling as the default path) → prompt = `buildScrapePrompt(combinedText)` +
  appended delta + classification blocks (verbatim-testimonial rules ride the
  base prompt) → `EntryScrapeSchema` / `'entry_scrape_website'` → briefDraft
  from mapped signals → facts/excerpts stripped from response →
  `consumeCredits(SCRAPE_WEBSITE)` metadata `extractionShape:'entry'`. Branch
  `if (entry === true)` after auth, before demo/cache. SaaS/extended/
  manufacturer/service paths untouched.

**Non-entry byte-identity (the hard invariant)** — `git diff` of the two routes
shows removed lines are EXACTLY the two destructure statements, each replaced
by the same line + `, entry`:
```
-    const { oneLiner, audienceType, templateId } = validation.data;
-    const { url, audienceType, templateId } = validation.data;
```
Everything else is insertions (new imports, schema field, helpers above the
handlers, one early-return `if (entry === true)` block per handler). With
`entry` absent, `validation.data.entry` is `undefined`, the branch is not
taken, and every downstream statement is the prior code verbatim. Frozen
generation-contract + golden tests green (tripwire held).

**Deviations**
- SiteContext cache is BYPASSED on the entry scrape path (no read, no write).
  Plan is silent on cache; conservative call: cached extracts lack signal
  fields (unusable), and WRITING entry-shaped extracts would change what the
  non-entry cached path returns to clients (violates byte-identity in spirit).
  Cost: entry re-crawls a previously-cached URL. Revisit if entry volume makes
  this expensive.
- Added a demo entry fixture to the SCRAPE route too (plan step 2 only mandates
  one for understand; step 3 says "same pattern"). Without it, demo-mode
  `entry:true` scrape would have returned the non-entry mock with no briefDraft
  and broken phase-5 free QA on the URL path.
- Prompt-block builders live in `entryClassify.schema.ts` rather than a route
  file — Files-touched constraint left either duplication across both routes or
  co-location with the enums they render; chose co-location (logged above).

**Verification**
- `npx tsc --noEmit` — clean ✅
- `npm run test:run` — 64 files passed | 1 skipped; 886 tests passed | 2 skipped
  (was 874 pre-phase; +12 = the new schema tests). Generation-contract + golden
  green ✅
- `git diff` route inspection — only additive per quoted diff above ✅
- Manual dev-server POST check (plan verification line) NOT run — read-level
  diff verification performed instead per task instructions ("read, don't run
  a server").

**Open risks**
- `entry_understanding`/`entry_scrape_website` schemas are large flat objects;
  cheap-tier model may fill prefill arrays thinly — acceptable, wizard steps
  re-ask. Enum fields are schema-constrained so buildBriefDraft can't throw on
  bad enums; a genuinely failed parse falls into the existing ai_error path.

---

## Phase 4 — API routes: brief confirm/hydrate + demand-lead + founder email

**Files changed**
- `src/app/api/brief/route.ts` (create — GET hydrate)
- `src/app/api/brief/confirm/route.ts` (create — POST authoritative gate + write)
- `src/app/api/demand-lead/route.ts` (create — POST create + PATCH fasttrack)

**Real infra signatures found (reviewer check)**
- `assertProjectOwner(clerkId: string|null|undefined, tokenId: string, opts: { action: string; claimIfOrphan?: boolean; allowMissing?: boolean }): Promise<ProjectOwnerResult>` — `src/lib/security.ts:57`. Returns `{ok:true,...}` or `{ok:false,status,error}`.
- `createSecureResponse(data: any, status = 200, logData?): NextResponse` — `src/lib/security.ts:152`.
- `withFormRateLimit(handler: (req: NextRequest) => Promise<Response>)` — `src/lib/rateLimit.ts:284` (FORM_SUBMISSION preset).
- `sendLeadNotification(args: { formName: string; data: Record<string,string>; fields?: MVPFormField[]; replyTo?: string; pageId?: string }): Promise<void>` — `src/lib/email/sendLeadNotification.ts:47`. Env-gated (RESEND_API_KEY + LEAD_NOTIFICATION_EMAIL), never throws.
- `validateToken(token): boolean` — `src/lib/security.ts:179` (loadDraft idiom, reused on both brief routes).
- Brief modules: no barrel `@/modules/brief/index.ts` exists — imported `decideServe` from `@/modules/brief/serveGate` and `getEntryFacts` from `@/modules/brief/classify` directly (matches how serveGate itself imports classify).

**Per-file**
- `brief/route.ts` — GET: Clerk `auth()` → 401; `validateToken` → 400; `assertProjectOwner({action:'brief:get'})` (read: no claimIfOrphan, no allowMissing ⇒ missing project = 404 from the helper); returns `{brief, audienceType, templateId}` (nulls when unset).
- `brief/confirm/route.ts` — POST: zod body `{tokenId, brief: BriefSchema}` (BriefSchema.parse is the D2 tripwire — place/quick-yes never in copyEngine); `assertProjectOwner({action:'brief:confirm', claimIfOrphan:true})` (write route, saveDraft idiom; no allowMissing — project pre-exists via /api/start). **Server re-runs `decideServe(brief)` — client verdict never read from the body** (schema has no outcome field at all). SERVE ⇒ single `prisma.project.update {brief, audienceType, templateId}` ⇒ `{outcome:'serve', redirectTo:'/onboarding/{audienceType}/{token}'}`. MANUAL ⇒ zero project writes ⇒ `{outcome:'manual', missing, outOfIcp}`.
- `demand-lead/route.ts` — POST (Clerk-gated, `withFormRateLimit`): zod `{input(≤2000), briefDraft: BriefSchema, missing, email (z.email), phone?, fasttrack?}`; `prisma.demandLead.create` with `userId = clerkId` (phase-2 ownership column); founder notify in try/catch AFTER the write (`formName: 'Demand lead' + ' — FAST TRACK'` when fasttrack; flat data `{input, businessType, engine, missing, email, phone, fasttrack}`, engine via `getEntryFacts(briefDraft)?.resolvedEngine`; `replyTo: email`); returns `{id}`.
  PATCH (also rate-limited — conservative): **ownership-scoped** `prisma.demandLead.updateMany({where:{id, userId: clerkId}, data:{fasttrack:true}})`; `count===0` ⇒ 404 (covers not-found AND not-yours — no ownership oracle). On success, second FAST TRACK notification built from the STORED row (`lead.briefDraft.businessType` / `facts.entry.resolvedEngine`), not request data.

**Middleware evidence (verified, NOT edited)** — `src/middleware.ts` `isPublicRoute` list (lines 13–47) contains no `/api/brief*` or `/api/demand-lead` entry; nearest API entries are `'/api/forms/submit'`, `'/api/analytics/event'`, `'/api/og(.*)'`. Line 160–162: `if (!isPublicRoute(req)) { await auth.protect() }` ⇒ all three routes protected-by-default. No middleware change needed.

**Deviations**
- PATCH also wrapped in `withFormRateLimit` (task only mandates POST; plan step 3 says "withFormRateLimit" generally) — conservative, prevents notification spam via repeated PATCH.
- `validateToken` added on both brief routes (not explicitly in plan) — matches loadDraft/saveDraft injection-prevention idiom on every token route.
- Imports from `@/modules/brief/serveGate`/`@/modules/brief/classify` (deep paths) because phase 1 created no `@/modules/brief` barrel; creating one was out of Files-touched.

**Verification**
- `npx tsc --noEmit` — clean ✅
- `npm run test:run` — 64 files passed | 1 skipped; 886 passed | 2 skipped ✅ (unchanged from phase 3 — no new tests in this phase per plan)
- Middleware read-verified (above) ✅ — no edit.
- `decideServe` invoked server-side in confirm; request schema carries no client verdict ✅
- Firewall: routes import only `@/modules/brief/*` (pure), prisma, zod, security/rateLimit/email helpers — no template resolver/registry/renderer ✅
- Plan's manual dev checks (agency confirm ⇒ surge row, photographer ⇒ DemandLead, PATCH cross-user 404) NOT run — deferred to phase-5/6 manual QA when the entry UI exists to drive them.

---

## Phase 5 — entry UI `/onboarding/[token]`

**Files changed**
- `src/app/onboarding/[token]/layout.tsx` (create)
- `src/app/onboarding/[token]/page.tsx` (create)
- `src/app/onboarding/[token]/components/EntryInputStep.tsx` (create)
- `src/app/onboarding/[token]/components/ConfirmBriefStep.tsx` (create)
- `src/app/onboarding/[token]/components/ManualOnboardStep.tsx` (create)

**Per-file**
- `layout.tsx` (SERVER) — Clerk guard (`redirect('/sign-in')`); claim-on-visit copied verbatim from `src/app/onboarding/product/[token]/layout.tsx` (`prisma.project.updateMany({where:{tokenId, userId:null}})` — race-safe, try/catch'd, logger idiom); then project-existence check `findUnique({where:{tokenId}, select:{id:true}})` OUTSIDE any try/catch (Next `redirect()` throws) ⇒ missing project → `redirect('/dashboard')`. ZERO persona reads.
- `page.tsx` (CLIENT) — 3-step `useState` flow `input → confirm → manual` (NO new zustand store, D1 in-memory draft); holds `{rawInput, briefDraft, leadId}` + `missing`. Simple chrome mirroring StepContainer's shell (fixed white header + Logo, `max-w-xl` white card) — StepContainer itself is product-store-coupled so not reused.
- `EntryInputStep.tsx` — ONE field. URL detection = OneLinerStep's `normalizeUrl` (protocol-prefix + `new URL` + dot-in-hostname guard) — copied verbatim from `src/app/onboarding/product/[token]/components/steps/OneLinerStep.tsx`, plus one added guard: input containing whitespace ⇒ not a URL (OneLinerStep has separate one-liner/URL fields; this shared field must not misroute a sentence — logged as deviation). One-liner validation = OneLinerStep's `validateOneLiner` verbatim (min-10 matches the understand route's zod min). URL ⇒ POST `/api/v2/scrape-website {url, entry:true}`; text ⇒ POST `/api/v2/understand {oneLiner, entry:true}`; success gate = `res.ok && json.success && json.briefDraft` (phase-3 shape `{success, data, briefDraft, creditsUsed}`); `json.message` fallback error copy + Loader2 states per OneLinerStep conventions.
- `ConfirmBriefStep.tsx` — renders `playbackSentence(briefDraft)`; 1-tap Confirm; "Not quite right?" reveals `chooserCards()` (6 businessType labels + "Something else", D7); chooser rendered UPFRONT when `(brief.confidence ?? 0) < LOW_CONFIDENCE_THRESHOLD` (undefined confidence treated as low — conservative). **Chooser tap routes ONLY through `applyBusinessTypeCorrection(draft, key)`** (`@/modules/brief/classify`) — never hand-mutates businessType; the helper resets `classificationSource='lookup'`/`tiebreaker='none'`/`resolvedEngine` per D7, so a corrected KNOWN type carries no stale portfolio rung. "Something else" ⇒ `onManual('rungA:unclassified')`. Confirm ⇒ POST `/api/brief/confirm {tokenId, brief}` ⇒ `serve` → `router.push(redirectTo)` (server's authoritative verdict); `manual` → manual step with the SERVER's `missing`.
- `ManualOnboardStep.tsx` — spec §5 copy VERBATIM: "Not automated yet — someone from Lessgo AI will connect with you shortly."; email required (regex), phone optional; POST `/api/demand-lead {input, briefDraft, missing, email, phone?}` ⇒ `leadId` lifted to page state; thank-you shows "Need it sooner?" ⇒ PATCH `{id, fasttrack:true}` ⇒ message upgrades verbatim to "Sushant will connect with you shortly to personalize." Screen identical for out-of-icp — only the `missing` payload tag differs; nothing internal rendered.

**No internal-term leak** — grep of the 5 files: `engine`/`rung`/`archetype`/`missing` appear only in comments, prop names, and payloads; all rendered strings come from `playbackSentence`/`chooserCards` (pure playback module) + the spec §5/§11.11 verbatim copy. Confirmed none reach JSX text.

**App Router precedence** — `src/app/onboarding/` contains static siblings `persona/`, `waitlist/`, `product/`, `service/` alongside new `[token]/`. Next App Router matches static segments before dynamic ones at the same level, so `/onboarding/persona`, `/onboarding/waitlist`, `/onboarding/product/*`, `/onboarding/service/*` all still resolve to their existing segments; only unmatched `/onboarding/<anything-else>` hits `[token]`. Nothing routes here yet (cutover = phase 6) ⇒ phase invisible to existing flows.

**Deviations**
- `normalizeUrl` whitespace guard added (above) — required because entry has ONE shared field; without it `new URL('https://a b.com…')` behavior is engine-dependent and a sentence containing a domain-like word could misroute to scrape.
- Undefined `brief.confidence` treated as below threshold (chooser upfront) — conservative; `buildBriefDraft` always sets it, so only defensive.
- Confirm button copy "Looks right — continue" + input-step headline copy authored here (no spec-verbatim copy exists for these); centralized playback strings untouched — founder reviews wording pre-launch per spec open q1.

**Verification**
- `npx tsc --noEmit` — clean ✅
- `npm run test:run` — 64 files passed | 1 skipped; 886 passed | 2 skipped ✅ (identical to phase 4 — no existing test changed)
- `git status` — only the 5 new files under `src/app/onboarding/[token]/` (+ a PRE-EXISTING uncommitted orchestrator edit to this plan.md adding phase-4's commit hash — not touched by this phase). No wizard/`/api/start`/middleware edit ✅
- Firewall: components import `@/modules/brief/{classify,playback}` + `@/types/brief` + ui/lucide/Logo only — no template resolver/registry/renderer/block ✅
- Plan's manual dev checks (real-LLM 3 acceptance inputs, fasttrack upgrade, rungE no-500) NOT run here — deferred to manual QA per plan (wizard hydrate lands phase 6; serve redirect into an empty wizard is EXPECTED).

---

## Phase 6 — cutover: /api/start rewrite, old-route redirects, wizard bridge hydrate

**Files changed**
- `src/app/api/start/route.ts` (edit)
- `src/app/onboarding/persona/page.tsx` (edit — now a redirect)
- `src/app/dashboard/page.tsx` (edit — persona gate removed)
- `src/app/layout.tsx` (edit — signUpForceRedirectUrl)
- `src/app/onboarding/waitlist/page.tsx` (edit — now a redirect)
- `src/app/onboarding/waitlist/WaitlistForm.tsx` (DELETED)
- `src/app/onboarding/service/[token]/layout.tsx` (edit — persona gate removed, project-keyed soft guard added)
- `src/app/onboarding/product/[token]/page.tsx` (edit — hydrate added inside the existing `checkedResume` effect, per plan "share/extend the checkedResume ref flow")
- `src/app/onboarding/service/[token]/page.tsx` (edit — mount hydrate effect added)
- `src/app/README.md` (edit — entry-flow docs)
- `src/components/README.md` (edit — PersonaPrompt settings-only note)

NOT touched (per amended plan): `src/components/onboarding/PersonaPrompt.tsx`, `src/app/dashboard/settings/page.tsx`, `/api/user/persona` route, `User.persona` column, wizard steps/stores/components.

### Per-file changes

**`src/app/api/start/route.ts` (D4)** — deleted the persona-prompt redirect (`/onboarding/persona?next=/api/start`) and the entire `PILOT_SERVICE_PERSONAS` waitlist branch. KEPT: user upsert, default-plan creation, persona→audienceType derivation onto the Project row (e2e back-compat; serve gate overwrites at confirm). Redirect target changed from `/onboarding/{product|service}/{token}` to `/onboarding/${tokenValue}` (universal entry).
**`{url}` shape-unchanged evidence:** the route still returns exactly `NextResponse.json({ url: SITE_URL + '/onboarding/' + tokenValue })` — one key, `url`, token still the LAST path segment. Verified live: `DashboardHeader.handleCreatePage` parses `{url}` (its `/onboarding/persona` branch is now dead but harmless — falls to `window.open(url)`); e2e `publish.spec.ts:31-34` got a 200 + url and successfully parsed the token (product publish spec passed end-to-end through this route).

**`src/app/onboarding/persona/page.tsx`** — full file replaced by a server `redirect('/dashboard')` with a scale-02 comment. `PersonaPrompt` import removed (component itself kept for settings).

**`src/app/dashboard/page.tsx`** — removed exactly the persona-gate block:
```tsx
-  if (!viewerIsAdmin && user && !user.persona) {
-    return <PersonaPrompt next="/dashboard" />
-  }
```
plus the `import PersonaPrompt from '@/components/onboarding/PersonaPrompt'` line; replaced by a comment. NOTHING else in the file touched — persona-null self-serve users now reach the dashboard.

**`src/app/layout.tsx`** — one-line change: `signUpForceRedirectUrl="/onboarding/persona?next=/dashboard"` → `signUpForceRedirectUrl="/dashboard"`. `signInForceRedirectUrl` untouched.

**`src/app/onboarding/waitlist/page.tsx`** — full file replaced by server `redirect('/dashboard')`. **`WaitlistForm.tsx` deleted** — reader check before deletion: its ONLY importer was `waitlist/page.tsx` (relative `./WaitlistForm`); the marketing `src/app/components/WaitlistForm.tsx` (different file, imported by `src/app/page.tsx`) untouched.

**`src/app/onboarding/service/[token]/layout.tsx`** — removed: persona lookup/select, persona-null bounce to `/onboarding/persona?next=`, `PILOT_SERVICE_PERSONAS` set + waitlist redirect, persona-derived wrong-audience redirect. KEPT: Clerk auth redirect + claim-on-visit (verbatim). ADDED: project-keyed soft guard — `project.audienceType === 'product'` ⇒ redirect to `/onboarding/product/{token}`; anything else passes.

**`src/app/onboarding/product/[token]/page.tsx` — exact hydrate diff.** Added import `briefToProductPrefill` from `@/modules/brief/bridge`. The hydrate lives INSIDE the existing resume effect's async chain (plan step 5: "share/extend the `checkedResume` ref flow so resume-to-generating wins"), sequenced strictly AFTER the resume check. The resume logic is preserved except `if (!res.ok) return` → `if (res.ok) { … }` nesting + an added `return` after `goToStep('generating')` (so resume WINS deterministically — no race). Added block:
```tsx
      // scale-02 phase 6 (D5): bridge hydrate — sequenced AFTER the resume
      // check (same async chain) so resume-to-generating wins. …
      try {
        const pre = useProductGenerationStore.getState();
        if (pre.currentStep !== 'oneLiner' || pre.oneLiner) return;
        const briefRes = await fetch(`/api/brief?tokenId=${encodeURIComponent(tokenId)}`);
        if (!briefRes.ok) return;
        const { brief, templateId } = await briefRes.json();
        const prefill = briefToProductPrefill(brief);
        if (!prefill) return; // no brief / no facts.entry ⇒ no-op
        const s = useProductGenerationStore.getState();
        if (s.currentStep !== 'oneLiner' || s.oneLiner) return; // dirty since fetch
        if (
          templateId &&
          (TEMPLATE_PARAM_WHITELIST as readonly string[]).includes(templateId)
        ) {
          setTemplateId(templateId as (typeof TEMPLATE_PARAM_WHITELIST)[number]);
        }
        s.setOneLiner(prefill.oneLiner);
        s.setProductName(prefill.productName);
        s.setUnderstanding(prefill.understanding);
        if (prefill.offer) s.setOffer(prefill.offer);
        if (prefill.landingGoal) s.setLandingGoal(prefill.landingGoal);
        goToStep('understanding');
      } catch { /* best-effort — wizard starts empty, exactly as today */ }
```
**Steps/stores untouched proof:** the template-selection effect (`?template=` whitelist + manufacturer→vestria, lines 51-70) is byte-identical; `stepComponents` map, `TEMPLATE_PARAM_WHITELIST`, all step imports, and `useProductGenerationStore.ts` show ZERO diff (`git status`: no file under `components/steps/`, no hook file). Effect ORDER unchanged (template effect first, resume effect second; hydrate is inside the second).

**`src/app/onboarding/service/[token]/page.tsx` — exact hydrate diff.** Added imports: `useEffect, useRef` (react), `useParams` (next/navigation), `briefToServicePrefill`, `templateIds`/`TemplateId`. Added inside the component (before the untouched `stepComponents` dispatch):
```tsx
  const params = useParams();
  const tokenId = params?.token as string | undefined;
  const checkedBrief = useRef(false);
  useEffect(() => {
    if (checkedBrief.current || !tokenId) return;
    checkedBrief.current = true;
    (async () => {
      try {
        const pre = useServiceGenerationStore.getState();
        if (pre.currentStep !== 'oneLiner' || pre.oneLiner) return;
        const res = await fetch(`/api/brief?tokenId=${encodeURIComponent(tokenId)}`);
        if (!res.ok) return;
        const { brief, templateId } = await res.json();
        const prefill = briefToServicePrefill(brief);
        if (!prefill) return; // no brief / no facts.entry ⇒ no-op
        const s = useServiceGenerationStore.getState();
        if (s.currentStep !== 'oneLiner' || s.oneLiner) return; // dirty since fetch
        if (templateId && (templateIds as readonly string[]).includes(templateId)) {
          s.setTemplateId(templateId as TemplateId);
        }
        s.setOneLiner(prefill.oneLiner);
        s.setBusinessName(prefill.businessName);
        s.setUnderstanding(prefill.understanding);
        if (prefill.goal) s.setGoal(prefill.goal);
        if (prefill.offer) s.setOffer(prefill.offer);
        if (prefill.importedTestimonials?.length) {
          s.setImportedTestimonials(
            prefill.importedTestimonials.map((quote) => ({
              quote, author_name: '', author_role: '',
            }))
          );
        }
        s.goToStep('understanding');
      } catch { /* best-effort — wizard starts empty, exactly as today */ }
    })();
  }, [tokenId]);
```
The pre-flagged shape gap handled as planned: `ServicePrefill.importedTestimonials: string[]` → `ScrapedTestimonial[]` mapping (`q ⇒ {quote:q, author_name:'', author_role:''}`) lives HERE in page.tsx, not in the bridge. `stepComponents` map + all step imports byte-identical; `useServiceGenerationStore.ts` zero diff.

**READMEs** — `src/app/README.md`: onboarding table rewritten (universal entry row added; persona/waitlist rows documented as redirects; wizards noted as brief-hydrating) + entry-flow paragraph rewritten (no persona gate; serve gate decides). `src/components/README.md`: `onboarding/` row now says PersonaPrompt is the settings-only persona editor, no longer an onboarding gate.

### Grep sweep (step 7)

`rg 'PILOT_SERVICE_PERSONAS|onboarding/waitlist|onboarding/persona\?next=|PersonaPrompt' src/`:
- `PILOT_SERVICE_PERSONAS` — **zero hits**
- `/onboarding/persona?next=` — **zero hits**
- onboarding `WaitlistForm` — **zero readers** (file deleted; remaining `WaitlistForm` hits are the DIFFERENT marketing component `src/app/components/WaitlistForm.tsx` + its reader `src/app/page.tsx`, intentionally untouched)
- `PersonaPrompt` — remaining refs exactly as the plan EXPECTS: `src/app/dashboard/settings/page.tsx` (settings editor — kept), `src/components/onboarding/PersonaPrompt.tsx` (the component), `src/components/README.md` (doc), a comment in the new `persona/page.tsx` redirect. **No gate usage remains** (dashboard gate removed).
- Residual STALE references outside Files-touched (NOT edited — out of scope, flagged for phase 7 sweep): `src/app/api/README.md:48` still describes /api/start's old persona gate/waitlist; `src/components/dashboard/DashboardHeader.tsx:44-48` has a now-dead `/onboarding/persona` branch (harmless — never matches, falls through to `window.open`).

### Verification

- `npx tsc --noEmit` — **clean**
- `npm run test:run` — **64 files passed | 1 skipped; 886 passed | 2 skipped** (identical counts to phase 5)
- `npm run test:e2e` — full-suite result:
  - `[setup] authenticate` — **PASS**
  - `generation.spec` product pipeline — **PASS**; service pipeline — skipped (pre-existing conditional skip, unchanged)
  - `render.spec` /dev/hearth-demo, /dev/meridian, /dev/meridian/blocks — **PASS (all 3)**
  - `publish.spec` **product / Meridian → /p/[slug] — PASS** (end-to-end through the rewritten /api/start: persona set → {url} parsed → seed → publish → published page renders)
  - `publish.spec` **service / Hearth — FAIL (PRE-EXISTING, not phase-6)**: seed helper `e2e/helpers/seedDraft.ts` sends the LEGACY understanding shape (`targetClients` as string, no `whatYouDo`) and `/api/audience/service/strategy` 400s on zod validation (`whatYouDo Required`, `targetClients Expected array, received string`). Provenance: seedDraft.ts last touched `87888a7` (2026-06-15); the strategy route's lean-understanding schema landed `a89e370` (2026-06-18) — the fixture has been stale since, on the branch base, BEFORE any scale work. Neither file is in this phase's Files-touched, and neither is in this phase's diff. Fix = update the two service `strategyBody`/`copyExtra` understanding fixtures in `e2e/helpers/seedDraft.ts` (out of scope here — reporting per instructions). service/Lex publish shares the same stale fixture (did not run — serial abort after Hearth).
  - Environmental note: the FIRST 3 e2e runs failed `auth.setup` (clerk-js never loaded) + `/dev/meridian/blocks` ("Loading blocks…" stuck). Root cause: 4 stale concurrent `next dev` processes had corrupted `.next` (client chunks 404'd as text/html — confirmed via a Playwright network probe). Killed the processes, wiped `.next`, clean server ⇒ both specs green. Not code-related.

### Deviations

1. **service layout `findUnique` → `upsert` on User**: old code did `findUnique` then hard-stopped on `!dbUser?.persona`, guaranteeing a row before claim-on-visit used `dbUser.id`. With the persona gate gone, a first-visit user could have NO User row ⇒ crash. Conservative fix: `upsert` (same idiom as /api/start + old persona/page.tsx). In-scope judgment call.
2. **Product hydrate placed INSIDE the resume effect** (after the resume check, early-`return` when resumable) rather than as a sibling effect — this is the plan's "share/extend the `checkedResume` ref flow" and the only race-free way for resume-to-generating to win deterministically. Resume semantics preserved (`if (!res.ok) return` became `if (res.ok) {…}` nesting; same behavior).
3. **templateId store-type guards in the hydrate effects**: GET /api/brief returns a DB string; the product store accepts only `'meridian'|'vestria'`, the service store the `templateIds` union. Guarded with whitelist checks — an out-of-union value (e.g. product `techpremium`, which a product shortlist can emit but the product store cannot represent) is SKIPPED (store default stays) rather than force-cast. Conservative; the rest of the prefill still hydrates.
4. e2e required 3 re-runs + an environment repair (stale dev servers / corrupted `.next`) before a valid signal; documented above.

### Open risks

- **publish.spec service (Hearth/Lex) red — pre-existing stale seed fixture** (`e2e/helpers/seedDraft.ts` vs the 2026-06-18 lean-understanding schema). The phase's hard-invariant "service publish green" CANNOT be met without editing that out-of-scope file; the failure is provably independent of this diff (the 400 fires in the seed helper on a route this phase never touched; product publish through the SAME rewritten /api/start passes). Recommend: orchestrator authorizes a fixture update to seedDraft.ts (add `whatYouDo`, make `targetClients` an array, add `outcomes`) as a phase-6 addendum or in phase 7.
- Product serve-path templateId `techpremium` can't be represented in the product wizard store (deviation 3) — falls back to meridian. Cosmetic until product shortlists actually emit it.
- Manual dev end-to-end (entry → confirm → prefilled wizard on UnderstandingStep with surge) NOT run here — real-LLM QA is the plan's merge-gate item.

---

## Phase 7 — admin demand board + final sweep

**Files changed**
- `src/app/admin/page.tsx` (edit — Demand board section)
- `e2e/helpers/seedDraft.ts` (edit — fix pre-existing stale service fixture)
- `src/app/api/README.md` (edit — /api/start row rewritten)
- `src/components/dashboard/DashboardHeader.tsx` (edit — dead /onboarding/persona branch removed)

### 1. Demand board (`src/app/admin/page.tsx`)

- Added `prisma.demandLead.findMany({ take: 500, orderBy: [{fasttrack:'desc'},{createdAt:'desc'}] })` to the page's existing first `Promise.all`.
- JS grouping (briefDraft is Json — no SQL groupBy): (a) `missing` split on commas → per-tag counts, ranked desc ("N leads blocked on X"); (b) `briefDraft.businessType` counts (null-safe via `(lead.briefDraft as any)?.businessType`, fallback `(none)`); (c) `briefDraft.facts.entry.resolvedEngine` counts (same null-safe pattern).
- Rendered as a new "Demand Board" `<section>` after Published Pages, matching the page's existing hand-rolled Tailwind table idiom: 3-column summary grid (blocked-on / business type / engine) + full lead table with columns status/email/input/missing/createdAt. Fasttrack rows are pinned to top by the query orderBy and visually flagged (amber row bg + "FAST TRACK" badge in the status cell). Empty state handled ("No demand leads yet.").
- **Gate UNCHANGED**: `if (!isAdmin(userId)) notFound();` remains the first statement; the board is inside the same server component after it. Manual reasoning: admin sees the board; non-admin still hits notFound() — no new client code, no new route.

### 2. seedDraft.ts fixture fix (pre-existing drift, RED since 2026-06-18)

Schema satisfied: `ServiceStrategyRequestSchema.understanding` (strategy route) + the identical object in `GenerateServiceCopyRequestSchema` (generate-copy route) — both require `whatYouDo: z.string().min(1)`, `targetClients: z.array(z.string()).min(1)`, `outcomes: z.array(z.string()).default([])`, plus serviceType/services/deliveryModel (already correct in the fixture).

All FOUR understanding blocks fixed (Hearth strategyBody + copyExtra, Lex strategyBody + copyExtra), same three-line change each:

Before (Hearth; Lex analogous with consultancy values):
```
serviceType: 'agency', serviceCategories: ['branding'], industries: ['dtc'],
targetClients: 'DTC founders at $300k-$2M ARR',          // STRING — schema wants array
                                                          // whatYouDo MISSING
services: [...], deliveryModel: 'remote',
```
After:
```
serviceType: 'agency', serviceCategories: ['branding'], industries: ['dtc'],
whatYouDo: 'We build complete brand identities for DTC founders in six weeks',
targetClients: ['DTC founders at $300k-$2M ARR'],         // now array(string).min(1)
outcomes: [],                                             // explicit array (schema default)
services: [...], deliveryModel: 'remote',
```
Lex: `whatYouDo: 'We advise regulated firms on risk, compliance and counsel'`, `targetClients: ['CFOs at mid-market regulated firms']`, `outcomes: []`. Extra keys (`serviceCategories`, `industries`) left as-is — zod objects strip unknown keys; only the shapes the schema rejects were changed.

### 3. Stale-doc sweep

- `src/app/api/README.md:48` — `/start` row rewritten: persona gate + waitlist description → universal entry bootstrap (upsert User + plan, Token+Project, persona still seeds `Project.audienceType` for back-compat, serve gate overwrites at `/api/brief/confirm`, returns `/onboarding/{token}`).
- `src/components/dashboard/DashboardHeader.tsx` — deleted the dead `if (url.includes('/onboarding/persona')) router.push(...)` branch (never matches post-cutover); kept the working `window.open(url, '_blank')` path with a short comment. Also removed the now-unused `useRouter` import + `router` var (lint hygiene; no behavior change).

### Verification (spec acceptance gate)

- `npx tsc --noEmit` — **clean**
- `npm run test:run` — **64 files passed | 1 skipped; 886 passed | 2 skipped** (same counts as phase 6)
- `npm run test:e2e` — full suite, clean `.next` (wiped pre-run per phase-6 audit note; no stray dev servers on port 3000): **8 passed | 1 skipped, exit 0 (2.4m)**
  - `[setup] authenticate` — PASS
  - `generation.spec` — PASS (service pipeline conditional skip = the 1 skipped, pre-existing, unchanged)
  - `render.spec` (hearth-demo / meridian / meridian blocks) — PASS
  - `publish.spec` **service / Hearth — PASS (30.1s) — now GREEN via the seedDraft fix**
  - `publish.spec` **service / Lex — PASS (7.1s) — now GREEN**
  - `publish.spec` product / Meridian — PASS (1.0m; rate-limiter 429 retries handled by the seed helper's built-in backoff, as designed)
- `npm run build` — **SUCCESS** (full pipeline: build:published-css → build:assets → next build; route table emitted, no errors)
- Manual reasoning (stated, no server): admin demand board renders for admins; non-admin path unchanged (`isAdmin || notFound()` untouched, first statement).

### Deviations

1. Removed the unused `useRouter` import/var in DashboardHeader alongside the dead branch — strictly consequential cleanup within the listed file (the branch was its only user).
2. None otherwise. Scope guard respected: no schema/brief-module/route/wizard files touched.

### Open risks

- Live-data confirmation of the board (photographer lead under `rungC:gallery`, fasttrack pinned) needs a dev-server manual pass — the plan's real-LLM acceptance QA remains a merge-gate item (per phase 5/6 notes).
- Demand board renders raw `missing` tags + engine keys (internal vocabulary) — fine for the admin surface by design (spec keeps internal terms admin-only).
