# blog-composer-redesign — plan (rev 2, post plan-review)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\blog-composer-redesign`
- **Branch:** `feature/blog-composer-redesign` (verified via worktree HEAD)
- **Tier:** full
- **Spec:** `docs/task/blog-composer-redesign.spec.md` — ⚠️ ABSENT on this branch (exists in main repo). **Phase 1 must copy+commit it** — phase 5 grades against it; without it on-branch the acceptance sweep has no source of truth.
- **Handoff:** `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Dashboard.dc.html` — TURN 4 ("Add a blog to [project]" first-run) + TURN 5 ("Write a post with AI" composer + generated article view). Spec labels these 3b/3c/3d.

## Overview

Reskin the blog authoring experience (first-run enable state, posts manager, post composer) onto app-chrome/ui-foundation over the existing blog backend, without touching the blog publish path. Then add net-new AI-write: a credit-gated LLM route that drafts a post (title/excerpt/markdown) into `BlogPost`, landing fully editable in the composer. Reskin ships first (Gate A), AI-write second (Gate B), per the spec's pilot slice.

## Progress log

- phase 1 Blog manager reskin (3b first-run + 3c manager): **done** (commit `c9aad99a`, review loops 1, verdict `ship`). Orchestrator amendment: `playwright.config.ts` added to Files touched — the plan missed e2e spec registration (`authed` project's `testMatch` is an allow-list; an unregistered spec silently runs nothing). All three blog specs pre-registered (Playwright no-ops on patterns matching no file — confirmed empirically) → **phases 2 and 4 need no config change**. e2e observed green (2 passed, `E2E_PORT=3117`; 3000 occupied). For GATE A: duplicate `← Dashboard` back-link + `Blog — {title}` h1 removed (already rendered by `WorkspaceHeader`/`WorkspaceTabs`); success toasts on publish/unpublish/delete are net-new (previously no success signal); sibling pages (`leads`/`analytics`) turn out to be only partially reskinned themselves, so "matches siblings" was a weaker target than assumed — tokens matched rather than legacy chrome copied.
- phase 2 Post composer reskin (3d shell, manual authoring): **done** (commit `684abeca`, review loops 1, verdict `ship`) — **GATE A OPEN**. All landmines verified held by review: preview link byte-identical (incl. its DELIBERATE comment), rich-editor diff is 3 classNames only (extensions/`onUpdate`/`immediatelyRender:false` absent from diff), publish path + PATCH shape + `richKey` + `slugLocked` preserved. e2e observed green (4 passed, `E2E_PORT=3117`); slug-lock test carries a pre-publish **negative control** (rename expects 200) so it can't pass against a route that 409s everything. `PROSE` deliberately NOT retokenized — it mirrors reader-facing `BlogPostBodyBlock`; app fonts there would be the app-chrome font-bleed failure in reverse (WYSIWYG lying about published output). Review concurred.
  - **PLAN INCONSISTENCY found (no action):** phase 2's goal sentence says the rail seam lets "phase 4 mount the AI brief in the same slot", but **ruling #5 rejects embedding** and chooses navigation (phase 4 = separate `/blog/new` + `router.push`). So phase 4 will never mount into the rail. Implementer built the `railPanel` prop to the goal sentence; reviewer's read = leave the ~4 inert lines (zero behavior, cheap insurance if ruling #5 is ever revisited), do NOT amend phase 4's scope. Accepted — phase 4 proceeds as specced.
  - Non-blocking, for GATE A: hero-upload no longer disables the action bar (Save mid-upload → URL lands after the PATCH, unsaved); status badge now binary (`Published`/`Draft`) vs raw `{status}` — safe today (`src/lib/blog/` only writes draft/published) but would mislabel a future third status; composer keeps its "All posts" back-link (conscious divergence from phase 1's removal — `WorkspaceTabs` gives no exit from a post).
- phase 3 AI-write backend (generate route + credits): pending
- phase 4 AI-write UI (brief panel + gating copy): pending — **GATE B after**
- phase 5 Acceptance sweep + docs: pending

## Design rulings (made here, per scout mandate)

1. **Blog enablement (3b) = DERIVED, no migration.** `enabled ⇔ project has ≥1 BlogPost` (from the posts query the page already runs). No `Project.blogEnabled` field — a stored flag needs a `prisma/schema.prisma` migration (risky surface), adds a second source of truth, and buys nothing: `publishBlogPost` only writes the `/blog` index + KV routes on publish, so 0 posts genuinely = no public blog. First-run CTA(s) create post #1 → manager appears. **Known wart (accepted):** deleting your LAST post reverts the manager to the 3b "Add a blog" first-run screen — that reversion is asserted in phase 1's e2e, not papered over. The existing site-publish precondition stays: `!publishedPage` → reskinned "Publish your site to start blogging" state (pre-publish blogging semantics out of scope).
2. **Credit cost: `BLOG_POST_GENERATION = 3`.** One long-form LLM call; sibling `GENERATE_COPY = 3`, longer output than `PRIVACY_POLICY_GENERATION = 2`. `UsageEvent.eventType` is a plain String in DB → **no migration**; only a `CREDIT_COSTS` const + `UsageEventType` enum entry in `src/lib/creditSystem.ts`.
3. **Generate route CREATES the draft post server-side** (reusing the slugify/uniquify pattern from `api/blog/posts/route.ts`), charges credits via `consumeCredits()` **after** the DB create succeeds, returns `{post, creditsUsed, creditsRemaining}`. Alternative (return draft JSON, client creates+patches) risks charging for a draft that never persists and needs 3 round trips. The three billing invariants — **charge-after-create, no charge on 422 parse failure, 402 shape** — are pinned by a route-level vitest (phase 3), not just by convention.
4. **AI writes `title` + `excerpt` + `markdown` ONLY — never the `seo` blob.** `sanitizeSeo` drops the whole blob if ANY field is invalid; keep AI out of it. Excerpt already feeds meta description at publish time.
5. **AI flow navigates to the composer after the post is created — a deliberate CHOICE, tradeoff named.** `BlogRichTextEditor` parses `initialMarkdown` once on mount; navigation gives a fresh mount and sidesteps the landmine. A keyed remount (`key={postId}`, the existing `richKey` trick) would ALSO give a fresh mount in place and preserve the handoff's brief-left/post-right side-by-side — but it means embedding the composer client-side inside `/blog/new`, duplicating `[postId]/page.tsx`'s server data-load + integrity check + `slugLocked` computation. We trade the persistent side-by-side for one composer mount path: the brief page keeps the handoff's two-pane layout DURING generation (brief left, skeleton/preview right), then hands off to the composer as the "generated article view". No in-place AI insertion into a live Tiptap instance, ever.
6. **Stats strip (3c) promises only what exists:** total/published/draft post counts, last published date, subscriber count — **derived in JS from the posts array `page.tsx` already fetches** (it selects `status` + `publishedAt` for every post at :52-63; no extra `groupBy` round trips). **NO per-post view counts** — `PageAnalytics` is site-slug-keyed; per-post views need schema change (out of scope).
7. **Hero image: wire, don't rebuild — ⚠️ SPEC DEVIATION, needs founder sign-off.** Spec acceptance says "Hero image via the media picker; built on ui-foundation", but `media-library-picker` lives on a separate UNMERGED branch. We keep the existing `/api/upload-image` flow, extracted into a `HeroImageField` component with a narrow `{value, onChange(url)}` contract so the picker branch swaps internals later. This is recorded as a deviation: flagged at GATE A, listed in unresolved questions, and phase 5's acceptance sweep must grade this box as "deviated (approved at Gate A)" — not silently ticked.

## Landmines (repeat — do NOT "fix")

- **Blog publish is FATAL without blob env.** `publishBlogPost` calls `renderAndUpload` → `uploadStaticSite` (`src/lib/blog/publishBlogPost.ts:230-252`) OUTSIDE its try block, and `blobUploader.ts` throws after 3 retries + backoff when `BLOB_READ_WRITE_TOKEN` is absent. This is UNLIKE site publish, which fails non-fatally in e2e (`e2e/publish.spec.ts:58`). Consequence: **no publish/unpublish e2e for blog** (see phase 2) — that path is verified manually at GATE A.
- Preview link in `BlogPostEditor.tsx:177-194` stays on `/dashboard/blog/{slug}/{post.id}/preview` (root `(blog-preview)` group — no `.app-chrome` font bleed). No `[token]` twin. Leave it.
- `src/app/dashboard/blog/[slug]/{page.tsx,[postId]/page.tsx}` are live redirect shims — do not delete/move.
- Publish path (`publishBlogPost`, `publish`/`unpublish` routes, blob/KV/versioning, `buildBlogPages`) — **untouched** in every phase.
- Keep `BlogRichTextEditor` extensions exactly (StarterKit + Image + tiptap-markdown; Image is NOT in StarterKit), `immediatelyRender:false`, markdown-canonical `onUpdate`. Round-trip contract test: `src/lib/blog/__tests__/tiptapRoundTrip.test.ts`.
- Slug immutability: 409 in `[postId]/route.ts` when `firstPublishedAt` set; editor already computes `slugLocked` — the reskin must keep the field locked+explained.
- **Mock-mode credit attribution:** `NEXT_PUBLIC_USE_MOCK_GPT=true` (set by `playwright.config.ts:79`) → `isDemoMode` → `requireAuth` returns `userId:'demo-user'` → credits charge to `demo-user`, not the real account. Harmless in e2e (prod flag false; matches `generate-privacy-policy` precedent) but any MANUAL ledger check must run with mock OFF (phase 3).
- Every new e2e spec starts with a "WHAT THIS DOES *NOT* COVER" preamble (convention from `e2e/dashboard-lifecycle.spec.ts`) so a green run isn't over-read.

---

## Phase 1 — Blog manager reskin (3b first-run + 3c manager)

**Goal:** `/dashboard/[token]/blog` on app-chrome tokens with three states: (i) site not published → reskinned "publish first" state, (ii) published + 0 posts → first-run "Add a blog" entry state (handoff TURN 4), (iii) ≥1 post → manager: stats strip + reskinned posts list + create entry (handoff 3c). No API contract changes. **Also commits the spec file to this branch.**

**Steps:**
1. Copy `docs/task/blog-composer-redesign.spec.md` from the main repo into this worktree and commit it with this phase (phase 5 grades against it).
2. `blog/page.tsx`: keep server data layer (`getWorkspaceProject`, `blogPost.findMany`, `blogSubscriber.count`) exactly as-is — **derive** counts-by-status + last `publishedAt` in JS from the fetched posts array (ruling #6; no new queries). Replace legacy gray-50/`max-w-6xl` chrome with app-chrome layout matching sibling workspace pages (`[token]/leads`, `[token]/analytics`).
3. New `BlogFirstRun.tsx`: TURN-4 entry state — headline, "Write your first post" CTA (opens the create dialog; phase 4 adds the AI CTA beside it). Reskin the existing "publish first" state in `page.tsx` (already partially tokenized at :40-49).
4. New `BlogStatsStrip.tsx`: posts total / published / drafts / last published / subscribers, props computed by the server page. Ruling #6 — nothing else.
5. Rework `NewPostButton.tsx`: replace `window.prompt` with the EXISTING `promptDialog` from `src/components/ui/ConfirmDialog` (`DialogHost`/`ToastProvider` are already mounted in `src/app/dashboard/layout.tsx` — no layout edit, no bespoke dialog component). Title from `promptDialog` → client-side validation → same `POST /api/blog/posts {tokenId,title}` (pending state on the button, errors via `toast`) → push to composer.
6. Reskin `BlogPostsTable.tsx` to the handoff list (card/row list): row = title, status badge, updated/published dates; row click → composer; inline publish/unpublish/delete keep the exact `fetch('/api/blog/posts/{id}/{action}')` + `DELETE ?tokenId=` contract + `router.refresh()`. Replace `confirm()` with `confirmDialog`, ad-hoc notices with `toast`.
7. e2e `e2e/blog-manager.spec.ts` (authed, follow `dashboard-lifecycle.spec.ts` pattern incl. its "WHAT THIS DOES NOT COVER" preamble; serial/1-worker): first-run state renders at 0 posts; create-via-dialog → row appears; delete the ONLY post via `confirmDialog` → manager **reverts to the first-run state** (asserts ruling #1's wart, not just "row gone").

**Files touched:**
- `docs/task/blog-composer-redesign.spec.md` (copied from main repo — commit)
- `src/app/dashboard/[token]/blog/page.tsx`
- `src/app/dashboard/[token]/blog/components/BlogPostsTable.tsx`
- `src/app/dashboard/[token]/blog/components/NewPostButton.tsx`
- `src/app/dashboard/[token]/blog/components/BlogFirstRun.tsx` (new)
- `src/app/dashboard/[token]/blog/components/BlogStatsStrip.tsx` (new)
- `e2e/blog-manager.spec.ts` (new)

**Verification:** `tsc` clean; `npm run test:run` green; `e2e/blog-manager.spec.ts` passes; manual: three states render vs handoff TURN 4 / 3c.

---

## Phase 2 — Post composer reskin (3d shell, manual authoring) — **HUMAN GATE A after**

**Goal:** `/dashboard/[token]/blog/[postId]` becomes the redesigned composer: left settings rail (slug w/ lock, excerpt, hero image, SEO, status/dates) + right writing surface (title + rich text), on app-chrome. Save/publish/unpublish plumbing unchanged. The left rail is built as a swappable panel seam so phase 4 can mount the AI brief in the same slot.

**Steps:**
1. Reskin `[postId]/page.tsx` server chrome (keep `getWorkspaceProject` + integrity check + `body.markdown` flatten + `slugLocked` computation).
2. Rework `BlogPostEditor.tsx` layout into rail-left/editor-right per handoff TURN 5 article view. KEEP: `PATCH` body `{format:'markdown', markdown}`, `POST .../publish`, `.../unpublish`, `slugLocked` behavior (locked field + "URL is permanent after first publish" note), rich↔markdown toggle + `richKey` remount, preview-link landmine verbatim. REPLACE: `alert()`/`confirm()`/flash notice → `toast` + `confirmDialog`; ad-hoc buttons/inputs → ui-foundation primitives.
3. Extract hero upload into `HeroImageField.tsx` per ruling #7 (existing `/api/upload-image` internals; narrow `{value, onChange}` contract; clean seam for media-library-picker). This is the spec deviation — surfaces at GATE A.
4. `BlogRichTextEditor.tsx`: **chrome/toolbar styling only** — extension set, markdown serialization, `immediatelyRender:false` untouched.
5. e2e `e2e/blog-composer.spec.ts` (with "WHAT THIS DOES NOT COVER" preamble): edit title+body → save → reload → persisted; slug edit after publish-lock → UI locked (assert against a post with `firstPublishedAt` set via API where feasible, else assert the locked-field rendering path) + API 409 asserted via direct fetch; markdown round-trip through the rich editor survives save/reload. **Explicitly NO publish/unpublish e2e:** blog publish hard-throws without `BLOB_READ_WRITE_TOKEN` (`publishBlogPost.ts:230-252` upload sits outside the try; `blobUploader.ts` throws after retries) — unlike site publish's non-fatal e2e behavior — so the spec would 500 in a blob-less env, and GATE A already verifies publish/unpublish manually on a real project. The preamble states this exclusion. (If the runner env ever has blob creds, an env-gated `test.skip(!process.env.BLOB_READ_WRITE_TOKEN)` block may be added later — not in this plan's scope.)

**Files touched:**
- `src/app/dashboard/[token]/blog/[postId]/page.tsx`
- `src/app/dashboard/[token]/blog/[postId]/components/BlogPostEditor.tsx`
- `src/app/dashboard/[token]/blog/[postId]/components/BlogRichTextEditor.tsx` (styling only)
- `src/app/dashboard/[token]/blog/[postId]/components/HeroImageField.tsx` (new)
- `e2e/blog-composer.spec.ts` (new)

**Verification:** `tsc`; `test:run` (incl. `tiptapRoundTrip.test.ts` untouched-green); `e2e/blog-composer.spec.ts`; `npm run build`.

**HUMAN GATE A:** founder QA — (a) publish/unpublish works end-to-end on a real project incl. live `/blog/{slug}` page (this is the ONLY coverage of blog publish — no e2e, see step 5), (b) visual sign-off of manager + composer vs handoff, (c) **sign off the hero-image spec deviation** (upload flow kept, media picker deferred to its own branch — ruling #7). Reskin is shippable here even if AI-write slips.

---

## Phase 3 — AI-write backend (generate route + credits)

⚠️ Touches billing surface (`src/lib/creditSystem.ts`) — diff limited to one cost const + one enum entry. No schema/migration (ruling #2).

**Goal:** `POST /api/blog/posts/generate` — zod-validated brief in, credit-gated, one LLM call, creates a `BlogPost` draft, charges after success. Modeled on `/api/v2/understand` (single-purpose, structured), NOT on `regenerate-element`'s error handling (no swallow-to-mock on real failures, no `req.json()` re-read in catch). Billing invariants pinned by a route-level vitest.

**Steps:**
1. `src/lib/creditSystem.ts`: add `CREDIT_COSTS.BLOG_POST_GENERATION = 3` + `UsageEventType.BLOG_POST_GENERATION`.
2. New `src/lib/blog/generatePost.ts`: brief zod schema (`tokenId`, `brief` ≤2k chars, optional `title` hint), prompt builder, strict parser → `{title, excerpt, markdown}` (validated against `BlogPostCreateSchema`/`BlogBodySchema` limits: markdown ≤200k, slug from `slugifyTitle`), deterministic mock output when `NEXT_PUBLIC_USE_MOCK_GPT`/demo (needed for e2e). **Prompt context source — be precise:** `requireBlogProject` returns ONLY `{id, audienceType, templateId}` (`src/lib/blog/access.ts:23-26`) — no business context. The ROUTE runs its own `prisma.project.findUnique({ where: { tokenId }, select: { title: true, inputText: true, content: true, brief: true } })` and passes those fields to the prompt builder (`inputText` = onboarding one-liner; `content`/`brief` JSON mined for business/audience copy context). `access.ts` stays untouched. Do NOT reuse `src/modules/prompt/*` (section-shaped).
3. New `src/app/api/blog/posts/generate/route.ts`:
   - `requireBlogProject(tokenId, 'generate')` (ownership, demo-404) → `requireAICredits(req, UsageEventType.BLOG_POST_GENERATION, CREDIT_COSTS.BLOG_POST_GENERATION)` → `if (!allowed) return creditCheck.response!` (402 `INSUFFICIENT_CREDITS`).
   - Own `prisma.project.findUnique` for prompt context (step 2).
   - Rate limit with the same helper `withDraftRateLimit` wraps (or its underlying limiter).
   - Provider call: primary (OpenAI when `USE_OPENAI==='true'`) → flipped-provider fallback → **error 502 on real double-failure** (mock only via explicit mock/demo flags). Parse; on parse failure → 422, **NO charge**.
   - Create `BlogPost` draft (status `draft`, uniquified slug `-2..-50` like create route; body `{format:'markdown', markdown}`; no `seo` — ruling #4).
   - `consumeCredits(userId, ..., 3, {endpoint, duration, metadata})` **AFTER** create; return `{post, creditsUsed, creditsRemaining}` via `createSecureResponse`.
4. Vitest `src/lib/blog/__tests__/generatePost.test.ts`: parser accepts good payloads, rejects malformed/oversized; prompt includes brief + project context fields; mock path deterministic.
5. **Route-level vitest `src/app/api/blog/posts/generate/route.test.ts`** — the server billing contract, copying the `src/app/api/saveDraft/i18n.test.ts` precedent (`vi.mock` for `@clerk/nextjs/server`, `@/lib/prisma`, `@/lib/security`, `@/lib/rateLimit`; plus mocks for credit check + provider). Asserts the three invariants nothing else pins:
   - **charge-after-create:** happy path → `blogPost.create` called BEFORE `consumeCredits`, both called once, 200 shape `{post, creditsUsed, creditsRemaining}`;
   - **no charge on 422:** provider returns unparseable → 422, `blogPost.create` NOT called, `consumeCredits` NOT called;
   - **402 shape:** credit check denies → response is the credit-check 402 with `code:'INSUFFICIENT_CREDITS'`, no create, no charge.

**Files touched:**
- `src/lib/creditSystem.ts` (2-line addition — billing surface, tight)
- `src/lib/blog/generatePost.ts` (new)
- `src/lib/blog/__tests__/generatePost.test.ts` (new)
- `src/app/api/blog/posts/generate/route.ts` (new)
- `src/app/api/blog/posts/generate/route.test.ts` (new — route-level billing-invariant vitest)

**Verification:** `tsc`; `test:run` green incl. BOTH new test files; manual dev check **with mock OFF** (`NEXT_PUBLIC_USE_MOCK_GPT` unset — otherwise `requireAuth` yields `demo-user` and the ledger check validates the wrong user): generate creates a draft, `UserUsage`/`UsageEvent` rows appear under the REAL user, insufficient-credit user gets 402.

---

## Phase 4 — AI-write UI (3d brief panel + gating copy) — **HUMAN GATE B after**

**Goal:** "Write a post with AI" flow per handoff TURN 5: brief-left / preview-right during generation, then navigate to the composer as the generated-article view (ruling #5 — navigation chosen over keyed-remount embedding; tradeoff named there). Entry CTAs on manager + first-run → brief page → generate (shows "3 credits") → route creates draft → composer with the AI draft fully editable. Credit-block → clear upgrade message, no silent fail.

**Steps:**
1. New `src/app/dashboard/[token]/blog/new/page.tsx` (server: `getWorkspaceProject`, reuse the published-site precondition) + `AiBriefPanel.tsx` (client): brief textarea + optional title hint, "Generate — 3 credits" primary CTA, generating/skeleton state on the right pane, on success `router.push` to `/dashboard/[token]/blog/{postId}`.
2. Error paths: 402 → inline gating message ("You need 3 credits…") + link to `/dashboard/billing` (align copy direction with `docs/task/billing-beta.spec.md`); 422/502 → retryable error toast, brief preserved. Never silent.
3. Wire entries: `page.tsx` manager header + `BlogFirstRun.tsx` get "Write a post with AI" CTAs → `/blog/new`; keep manual create beside them.
4. e2e `e2e/blog-ai-write.spec.ts` (with "WHAT THIS DOES NOT COVER" preamble): (a) mock-LLM happy path — brief → generate → lands in composer, title/body present + editable, save round-trips; (b) Playwright route-intercept `/api/blog/posts/generate` → 402 `{code:'INSUFFICIENT_CREDITS'}` → upgrade message renders, no navigation. **Scope honesty:** test (b) covers CLIENT error-rendering only — the server's 402/charging contract is pinned by phase 3's route vitest, and the preamble says so (intercept would pass even against a broken server; it is not the billing gate). Mock-mode credits attribute to `demo-user` (landmine above) — fine for e2e, not for ledger validation.

**Files touched:**
- `src/app/dashboard/[token]/blog/new/page.tsx` (new)
- `src/app/dashboard/[token]/blog/new/components/AiBriefPanel.tsx` (new)
- `src/app/dashboard/[token]/blog/page.tsx` (CTA wire)
- `src/app/dashboard/[token]/blog/components/BlogFirstRun.tsx` (CTA wire)
- `e2e/blog-ai-write.spec.ts` (new)

**Verification:** `tsc`; `test:run`; `e2e/blog-ai-write.spec.ts`; `npm run build`.

**HUMAN GATE B:** founder sign-off — (a) credit/gating copy + upgrade path (spec candidate gate a; faces paying users), (b) real-LLM draft quality on 2–3 briefs (`USE_OPENAI=true`, mock OFF, manual — automation can't judge copy), (c) confirm cost=3 feels right vs ledger (ledger check with mock OFF), (d) **visual sign-off of the 3d AI brief screen vs handoff TURN 5** (GATE A only covered manager+composer; this screen lands here).

---

## Phase 5 — Acceptance sweep + docs

**Goal:** all spec acceptance boxes verified honestly; docs current; full gates green.

**Steps:**
1. Walk spec acceptance criteria (spec on-branch since phase 1); fix strays ONLY within files already listed in phases 1–4 (any new surface → back to the orchestrator). The hero-image box is graded **"deviated — upload flow kept, picker deferred; approved at GATE A"** (ruling #7), not ticked.
2. Update `src/lib/blog/README.md` (generate route, credit cost, enablement ruling, hero-image seam) and `docs/tracks/blogPlan.md` **if it exists on this branch** (earlier check found none — skip creating one; track docs live on main).
3. Full run: `tsc`, `npm run test:run`, `npm run build`, `npm run test:e2e` (blog specs).

**Files touched:**
- `src/lib/blog/README.md`
- (strays: only files from phases 1–4 lists)

**Verification:** all four gates green; acceptance checklist annotated in commit message (incl. the deviation note).

---

## Risky-surface census (auto-escalation list)

- `prisma/schema.prisma` / migrations: **not touched** (rulings #1, #2 designed around this).
- Billing/credits: `src/lib/creditSystem.ts` phase 3 only, 2-line additive diff; server contract pinned by route vitest. No `planManager.ts`, no `api/{stripe,billing,credits}`.
- Publish path (`api/publish`, `lib/staticExport/`, `kvRoutes.ts`, `publishBlogPost.ts`): **not touched**; manual-only verification at GATE A (blog publish fatal without blob env → no e2e).
- Auth/middleware: reuse `requireBlogProject` + `requireAICredits`; **no changes to either** (`access.ts` untouched — route does its own project-context query).
- Editor store / dual-renderer: not involved (dashboard surface only).

## OPEN RISK — 4 unrelated e2e failures, baseline UNPROVEN (must resolve before push)

A full-suite e2e run on this branch (phase 2, accidental — CLI file args don't filter; see below) showed **28 passed / 4 failed / 30 not run**:
`dashboard-lifecycle.spec.ts:81`, `dashboard-redirects.spec.ts:134`, `dashboard-shell.spec.ts:126`, `publish.spec.ts:14`.

**Status: NOT PROVEN pre-existing.** Three orchestrator runs + two subagent attempts all died (harness kills the long run; the subagent stalled twice waiting on a monitor). Investigation STOPPED deliberately — it was costing more than the answer is worth here, because **the merge gate requires a fully green suite anyway** (no CI; founder pushes to main after a locally-green run). Resolve it there, not by more baselining.

**Evidence it is NOT feature-caused (analysis, not proof — impl-reviewer, phase 2):**
- Phase 2's diff is confined entirely to the `[postId]` composer subtree; none of the 4 specs visit it.
- Phase 1's diff is confined to the blog manager subtree + additive `playwright.config.ts` regexes.
- `dashboard-redirects:134` = analytics redirect; `dashboard-shell:126` = project-card ••• menuitem count. Neither renders blog UI.
- Likely environmental (missing blob/KV creds locally — same class as the blob-fatal publish landmine).

**⚠️ Playwright CLI trap (bit two agents — do not repeat):** `npm run test:e2e -- <spec>` and `npx playwright test <path>` do **NOT** filter — each project's `testMatch` allow-list wins, so the whole 39-test suite runs. Use `-g`/`--grep` on test titles. Ports 3000/3117/3119 have been occupied on this machine.

## Unresolved questions

1. **Hero image = SPEC DEVIATION:** keep `/api/upload-image` (picker branch unmerged), swap to media picker later via `HeroImageField` seam — sign off at GATE A?
2. Deleting last post reverts manager to "Add a blog" first-run (derived enablement wart) — acceptable?
3. AI flow navigates to composer (drops persistent brief/post side-by-side; two-pane kept only during generation) — OK, or want keyed-remount embed later?
4. Keep "publish site first" block before blogging — or allow pre-publish drafting?
5. Cost 3 credits for AI post — OK?
6. Generate route creates draft server-side, charges after create — OK?
7. AI never writes `seo` blob — OK?
8. Brief v1 = one textarea + optional title hint (no tone/length knobs) — enough?
