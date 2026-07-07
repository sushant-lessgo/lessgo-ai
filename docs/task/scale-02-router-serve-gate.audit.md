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
