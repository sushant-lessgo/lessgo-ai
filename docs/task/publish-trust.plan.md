# publish-trust — implementation plan (rev 2)

> **Tier: `full` (escalated from spec's `standard`).** Touches `src/app/api/publish/` +
> `src/lib/staticExport/` — risky-surface list (live publish path, bytes on customer domains).

WORKDIR: `C:\Users\susha\lessgo-ai\.claude\worktrees\publish-trust` · branch `feature/publish-trust`.
Inputs: `docs/task/publish-trust.spec.md`, `docs/task/publish-trust.scout.md` (rulings binding).
Rev 2 folds in plan-review blocking issues #1-#5 + all non-blocking suggestions (adopted).

## Overview

Three publish-path correctness fixes. **M3** — `POST /api/publish` returns 200 "published" even when
static export threw (deliberate fall-through, `route.ts:544-551`); return an honest 500 the existing
client already surfaces. Consequence (orchestrator ruling, option b): local dev publish now
legitimately 500s (Blob/KV absent) — the e2e helpers relied on the lie being removed, so a dedicated
phase re-seams them. **M4** — canonical URL, `og:image`, hreflang `href`, `data-slug` interpolate raw
into exported HTML (stored XSS); escape every sink with the existing `escapeHTML` + a URL scheme gate
where validation is genuinely absent (`previewImage`). **M5** — `buildPublishedCSS.js` globs scan a
removed dir and omit all ~155 template/skeleton/sharedBlocks published+core files (silent purge =
dual-renderer parity break); fix globs, regenerate `public/published.css`, bump the existing sha256
baseline, and make the script itself fail loudly on any zero-match glob / missing marker / app-chrome
leak so this can never rot silently again.

## Progress log

- phase 1 M3 route fix + route vitest + docs commit: **done** (commit `f2776e18`, review loops 1, verdict `ship`)
  - Plan correction: route calls `renderPublishedExport` (`:344`/`:372`), NOT `generateStaticHTML` (zero
    matches in route.ts) — scout+plan named the wrong seam; a test mocking only `generateStaticHTML`
    would have been VACUOUS. Test throws from the real seam. Rollback case split (1b): a throw during
    generation never records a `blobKey` (helper self-cleans, `renderPublishedExport.ts:547-556`), so
    case 1 pins `del` NOT called; 1b drives the throw past a successful export to exercise `del`.
  - Tests mutation-sensitive: 3 of 4 go red on revert (verified by reviewer, not claimed).
  - Env note: `npx tsc --noEmit` reports ONE pre-existing unrelated error —
    `src/app/page.tsx(6,26) TS2307 '@/assets/images/founder.jpg'` — this worktree lacks the generated
    `next-env.d.ts` (gitignored; produced by `next dev/build`). NOT caused by this branch. Expect it
    in every phase's tsc until a `next build` runs here.
  - Repo hygiene: vitest rewrites `__snapshots__/uiFoundationIsolation.test.tsx.snap` with LF endings
    on every run → git flags it modified with an EMPTY diff. Pure EOL churn; `git checkout --` it.
    Do NOT mistake it for a phase-3 escaping regression (phase 3's guard asserts this file unmodified —
    check `git diff` CONTENT, not just status).
- phase 2a rate-limit key namespacing (SCOPE ADDITION — founder-approved 2026-07-17): **impl done**,
  awaiting review. `name` now REQUIRED on `RateLimitConfig` (optional+fallback would let the bug
  silently recur; grep proved zero inline configs / zero custom keyGenerators repo-wide). Single
  `buildStoreKey` = sole key derivation for rateLimit/getRateLimitStatus/clearRateLimit (closes the
  consistency trap). Custom keyGenerators deliberately NOT namespaced (caller declares own scope) —
  documented. New `src/lib/rateLimit.test.ts` (9 cases). test:run 3550→3559.
  - **Non-vacuousness MEASURED, not reasoned:** reverting the namespace → 3 failed / 6 passed.
    That revert run also caught a DUD test of the implementer's own (an IP-namespacing case that
    passed even against the bug, because DOMAIN_VERIFY's shared increments still cleared GENERAL's
    limit of 100 either way) → strengthened to assert `remaining` (99 vs 97). **Lesson: measure
    non-vacuousness by reverting; reasoning about it would have shipped a dud that looked like coverage.**
  - Risk accepted (founder-approved): this is a LOOSENING. Per-user AI exposure goes from an
    effective shared ceiling to the true 5/10 per tier. `checkCredits` — not the limiter — is the
    real cost gate. Pre-existing + unchanged: store is in-memory per instance, so on multi-instance
    serverless the limits are already per-lambda and looser than advertised (Redis = long-term answer).
- phase 2 M3 e2e seam (dev publish now 500s): **impl done**, awaiting review + final e2e.
  - 429s GONE after 2a (0 in log; 60→68 passed).
  - `dashboard-shell.spec.ts` DID run (8 passed, 1 skipped) — earlier doubt was a truncated-tail
    artifact. `dashboard-shell:258` runs (1.5m), does NOT silently skip. Seam works.
  - Folded in: fix for a PRE-EXISTING e2e flake (see below).

### PRE-EXISTING e2e flake — root-caused 2026-07-17 (NOT caused by this branch)

`dashboard-lifecycle.spec.ts:393` intermittently 404s on `POST /api/projects/{token}/unpublish`.
**Not the route** — it's `src/middleware.ts:251-253` Clerk `auth.protect()` → `notFound()` on an
EXPIRED session for a non-document request (same behavior deliberately pinned by the sibling test
at `:187`). `page.request` shares the browser cookie jar; Clerk's `__session` JWT lives ~60s and is
refreshed by clerk-js ONLY on an **app** page (see `e2e/publish.spec.ts:19-21` — why `authedApi()`
exists). `:383` does `page.goto('/p/{slug}')` = published page, no clerk-js → refresh stops → `:393`
lands past expiry when the test ran slow. Latent at `:287`/`:330` too.

Evidence it's pre-existing: file byte-identical to main; non-deterministic (passes alone 53.8s,
whole-file 14/14, fails full-suite at identical duration); **main's own full authed run = 2 failed /
50 passed / 13 did not run (21.4m)** — failures `dashboard-redirects.spec.ts:134` + `publish.spec.ts:14`
(Lex), BOTH files phase 2 edits and NEITHER fails on our branch. Our run = 1 failed / 55 passed /
4 did not run (13.9m) — **strictly better than main, and 7.5min faster** (2a cuts limiter backoff).

**MAIN IS NOT A GREEN BASELINE.** Judging this branch by "0 failed" is unfair — score it against main.

"4 did not run" = `test.describe.configure({ mode: 'serial' })` (`:32`) aborting the rest of the
group after the failure (the 4 tests at `:402`/`:428`/`:452`/`:557`). Not maxFailures (unset), not
retries (`retries: 0` locally).

### Orchestrator hygiene notes (bit us this run)

- **NEVER pipe `npm run test:e2e` through `tail`** — the pipe returns TAIL's exit code (0), masking a
  failed suite. Nearly reported a red suite as green. Read the summary line, not `$?`.
- Port 3000 held by foreign PID 17640 → use explicit `E2E_PORT`. NEVER let Playwright reuse an
  existing server (`playwright.config.ts:86-90`: it would silently test ANOTHER worktree's code).
  - Carry into phase 2 (phase-1 review non-blocking, folded — `route.test.ts` added to phase 2 files):
    (a) drop/reword the dead `vi.mock('@/lib/staticExport/htmlGenerator')` (`route.test.ts:55`) — route
    never imports it, mock is inert; (b) tighten case 1 to `expect(res.__body.error).toBe('Publish
    failed. …')` — status+typeof would also pass on an outer FATAL-catch 500, so pin the exact honest-
    failure path + the user-facing string as contract; (c) add a `Sentry.captureException` called
    assertion — spec's M3 constraint names Sentry capture as preserved behavior but nothing pins it.
- **phases 2 + 2a: done** (commit `1a12ad87`, ONE joint review loop, verdict `ship`).
  - **e2e FULL SUITE GREEN: 73 passed / 0 failed / 10 skipped (15.3m), REAL_EXIT=0.**
    Beats the main baseline outright (main = 2 failed / 50 passed / 21.4m). +23 tests actually RUN
    (main's shared-limiter 429s + serial-abort were preventing them). Main's own 2 failures
    (`dashboard-redirects:134`, `publish.spec:14` Lex) are GREEN here.
  - Hardening folded in post-review (all 3 non-blocking, orchestrator's call):
    1. **`as` → `satisfies` on all 6 presets.** The required-`name` guard was THEATRE: a type
       ASSERTION does not enforce required props (`{maxRequests,windowMs} as RateLimitConfig`
       compiles with 0 errors), so a future preset copy-pasting the convention would get
       `undefined:user:{id}` = the shared-counter bug SILENTLY BACK. `satisfies` now errors TWICE
       (decl `TS1360` + consumer site `TS2345`); under `as` both were invisible. Compile-time only,
       zero runtime change. **The code was already correct — the PROTECTION was fake.**
    2. Outer fail-open path pinned (was untested; the existing case covered the INNER tier catch).
       Seam = a throwing custom `keyGenerator` on a non-tierBased config, so the inner try/catch
       provably never runs. Implementer REJECTED the obvious `auth`-throws seam because
       `defaultKeyGenerator` swallows auth errors → nothing reaches either catch → would have been
       a dud. Mutation-checked (outer catch rethrow → 1 failed).
    3. `rateLimit.test.ts:90` comment arithmetic 97 → 98.
  - Reviewer INDEPENDENTLY re-measured non-vacuousness (reverted `buildStoreKey` itself): 4 failed /
    5 passed — better than the audit's claimed 3, because the strengthened IP case now bites too.
    Spot-checked all 8 remaining cases for the dud disease: **none found** (the 5 passing pre-fix each
    target a DIFFERENT mutation).
  - Audit correction: ONE `page.goto('/p/{slug}')` remains (`dashboard-lifecycle.spec.ts:115`), not two
    — it's the last statement before unchecked `finally` cleanup, so no expiry hazard.
  - `test-results/` is gitignored (`.gitignore:52`) — cannot be accidentally committed.
- phase 3 M4 head escaping + URL scheme gate: pending — **HUMAN GATE**
- phase 4 M5 published-CSS globs + in-script guards + sha baseline bump: pending
- phase 5 integration verification + gates sweep: pending

---

## Investigation report — M3 e2e seam (plan-review blocking #1)

**Central finding: the fix changes ONLY the HTTP status, not the DB outcome.** The export `catch`
keeps its `publishState:'failed'` + `publishError` write (`route.ts:532-542`) *before* the new 500
return. `failed` is a SERVING state (`isServingPublishState`, documented at `seedDraft.ts:276-279`),
so `/p/{slug}` still renders and the dashboard 'Published' badge still shows — which is exactly how
these specs pass **today** with `failed` rows. So consumers do NOT need a row that reads
`publishState:'published'`; they need a *serving* row, and they still get one. No DB-direct seeding,
no dev-only env flag needed — **chosen seam: accept `500 && row serves` in the helpers** (verified
HTTP-only via `GET /p/{slug}` < 400; keeps Prisma out of the helper).

Verified consumer inventory (grepped, not assumed):

| Consumer | Today | Post-fix breakage | Seam |
|---|---|---|---|
| `e2e/helpers/seedDraft.ts:305` `publishSeed` (`expect(res.ok())`) | 200, row `failed` | hard-fail | accept `200 \|\| (500 && GET /p/{slug} < 400)`; update the :276-279 doc comment |
| `e2e/dashboard-lifecycle.spec.ts` (7 `publishSeed` calls; :462 plants `published` via DB directly) | pass | red via helper only | fixed by helper; **zero assertion changes in this spec** |
| `e2e/publish.spec.ts` (real publish UI → live card :75-82) | live card after doomed-call timeouts | live card never appears | branch on `page.waitForResponse('/api/publish')` status: 200 → existing live-card + `/p` assertions; 500 → `data-testid="publish-error"` visible in SlugModal (testid EXISTS, `SlugModal.tsx:261`), live card NOT visible, `/p/{slug}` still renders template (SSR fallback). The 500 branch IS the M3 UI acceptance test (honest failure surfaced); the branch keeps the spec valid in Blob/KV-provisioned envs |
| `e2e/dashboard-redirects.spec.ts:73-110` `getPublishedFixture` (drives publish UI, waits `Page Published`, **stale pre-t17 selectors**) | fragile-pass | never resolves | replace the UI drive with `publishSeed(api, token, SLUG, CFG, finalContent)` — `seedDraft` already returns `finalContent`; fixture only needs a serving row for the shims/tabs (satisfied today by `failed` rows). Also retires the stale selectors |
| `e2e/dashboard-shell.spec.ts:279-289` (direct POST, `test.skip(!ok)`) | runs | **silently SKIPS forever** (coverage loss) | accept `200 \|\| 500`, then skip only if `/p/{slug}` doesn't serve |
| `e2e/dashboard-workspace.spec.ts` | — | **none** — grep confirms it never touches publish (review list overstated) | no change |
| `e2e/README.md` | documents non-fatal-fallback behavior | stale | document: dev publish honestly 500s, row lands `failed` (serving) |

**Blast radius: 5 files, plumbing only — no dashboard spec expectations rewritten. Within the ~6-file
budget; no scope escalation to surface.** Timeout note: today's specs wait out doomed Blob/KV
retries before the 200; post-fix the 500 arrives after the same doomed calls, so existing generous
timeouts stay (don't tighten in this bundle).

**No new e2e spec file** → `playwright.config.ts` testMatch allowlist (blocking #3) needs no change;
the M3 deterministic guard is a **vitest** on the route (phase 1), and the UI-level 500 path lives in
the already-registered `publish.spec.ts`.

---

## Phase 1 — M3: honest publish failure (route + vitest + docs commit)

### Decision being reversed (tradeoff)

Fall-through is deliberate (`route.ts:544` "Don't block publish - legacy SSR still works"). What it
misses: (a) first publish — KV routes never written, subdomain routing degraded/dead; (b) republish —
old blob/KV serve the PREVIOUS version while the user is told new edits are live; (c) DB already says
`failed`, so the 200 contradicts the system's own state. Spec chose truth: actionable "publish
failed, retry" (detail in `publishError` + Sentry) over silent staleness on a customer's live page.

### Behavior change

- In the export `catch` (`route.ts:513-546`): **keep** logging, Sentry capture, orphaned-blob rollback
  (`:521-530`), and the `failed` DB write (`:532-542`) exactly as-is; then
  `return createSecureResponse({ error: <stable user-facing message> }, 500)` instead of falling
  through. No raw error internals in the body. Matches `{ error }` shape at `:556`; the sole client
  caller (`preview/[token]/page.tsx:481-483` → `setPublishError` → `SlugModal` `publish-error`)
  already surfaces it. **No UI work — ruling #1.**
- KV sub-catch (`:459-491`) already throws → now correctly reaches the 500. Leave the harmless
  double-set of `failed` (minimal diff). Delete the `:544-545` comment + warn.
- **NO test backdoor** (review blocking #2): no force-fail header. Determinism comes from the vitest
  below; local dev fails the export naturally anyway.
- Out of scope (audit note only): subpage-blob rollback leak (`:521-530`, ruling #4); state-machine
  redesign.

### Route vitest (deterministic guard on the catch)

New `src/app/api/publish/route.test.ts`, mirroring the established route-test mocking pattern
(`src/app/api/forms/submit/route.test.ts`): `vi.mock` for `@/lib/staticExport/htmlGenerator`
(`generateStaticHTML`), `@/lib/prisma`, auth (Clerk), Blob (`@vercel/blob` / dynamic `del`), KV
routes, rate-limit wrapper, `createSecureResponse`. Cases:
1. `generateStaticHTML` throws → response status **500**, body `{ error }` non-empty, **no `url`**;
   blob rollback `del` called with the uploaded key when one exists; prisma update called with
   `publishState:'failed'` + `publishError`.
2. Throw AFTER blob upload but in KV write (KV sub-catch path) → same 500 + `failed` write.
3. Happy path (all mocks succeed) → **200** + `{ message, url }` (regression pin).

**Files touched**
- `src/app/api/publish/route.ts`
- `src/app/api/publish/route.test.ts` (new)
- `docs/task/publish-trust.spec.md` (commit — was untracked, ruling #5)
- `docs/task/publish-trust.scout.md` (commit)
- `docs/task/publish-trust.plan.md` (commit)

**Steps**
1. Commit the three docs (`docs(publish-trust): spec + scout + plan`).
2. Route change; new vitest.

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green incl. new suite.
- Diff review: `Page published successfully` unreachable when the export catch fires.
- **Known-red window:** authed e2e is expected red until phase 2 lands — do NOT run `test:e2e` as a
  phase-1 gate; phase 2 must immediately follow.

---

## Phase 2a — rate-limit key namespacing (SCOPE ADDITION, founder-approved 2026-07-17)

**Not in the spec.** Surfaced by phase 2: `test:e2e` failed 2× on `/api/publish -> 429`. Root cause is a
**live production bug**, not a test artifact — orchestrator verified against source, founder approved
fixing it here (option 1 of 4) rather than splitting it to its own spec.

### The bug

`defaultKeyGenerator` (`src/lib/rateLimit.ts:115-127`) returns `user:{userId}` / `ip:{ip}` with **no
per-preset namespace**, and every preset shares ONE `rateLimitStore` (`:24`). So every rate-limited
route increments **the same counter**, then compares it against **its own** `maxRequests`
(`:195`) — the LOWEST limit effectively governs ALL routes for a given user.

Live impact: AI-generate/regenerate 5× (`AI_GENERATION` = 5/min FREE) → **publish 429s** with "Too many
requests", a message about a limit the user never hit on publishing. Consumers of the shared counter:
`withAIRateLimit` (5/tier), `withPublishRateLimit` (5), `withDraftRateLimit` (30),
`withFormRateLimit` (10), `withGeneralRateLimit` (100) — see `src/app/api/**` (many routes).

Phase 1 did NOT cause this — it EXPOSED it. Publishes used to take ~2min (waiting out doomed Blob/KV
retries), accidentally spacing them past the 60s window; M3's honest 500 returns in ~2.3s, so the
collision now surfaces every run.

**The correct pattern already exists 40 lines up:** `checkDomainRateLimit` (`:75`) namespaces its key
`domain:{name}`. This fix makes the per-user path consistent with it.

### Design

Namespace the store key per preset: `${presetName}:user:${userId}` / `${presetName}:ip:${ip}`.

**Consistency trap (do not miss):** `getRateLimitStatus` (`:297-315`) and `clearRateLimit`
(`:318-322`) call `keyGenerator` directly and hit the store themselves. If `rateLimit()` namespaces
but they don't, they silently read/clear the WRONG key. All three must derive the key through ONE
shared helper. `checkDomainRateLimit` keeps its own `domain:` key (already correct, don't touch).

**This is a LOOSENING** — each route now gets its own budget, so a user may make strictly more total
requests/min than today. That is the intent (the presets' documented numbers become true), and it is
the founder-approved tradeoff. Every preset's own advertised limit is still enforced.

**Files touched**
- `src/lib/rateLimit.ts`
- `src/lib/rateLimit.test.ts` (new if absent — implementer checks)
- `docs/task/publish-trust.audit.md` (append `## Phase 2a`)

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green.
- Unit tests: presets do NOT share a counter (exhaust AI budget → publish still allowed); each preset
  still enforces its OWN limit (exhaust publish's 5 → 6th publish 429s); `getRateLimitStatus` /
  `clearRateLimit` operate on the SAME namespaced key `rateLimit()` uses (the consistency trap).
- Phase 2's `test:e2e` green is the real proof — run it in phase 2, not here.

---

## Phase 2 — M3 e2e seam (dev publish now honestly 500s)

Implements the seam table from the investigation report above. Design rule: helpers accept
`200 || (500 && serving)` — never blanket-accept 500, always confirm the row serves via
`GET /p/{slug}` < 400 so a genuinely broken publish (no row) still fails loudly.

**Files touched**
- `e2e/helpers/seedDraft.ts` (relax `publishSeed` :305 assertion + update :268-279 doc comment)
- `e2e/publish.spec.ts` (branch on `/api/publish` response status; 500 branch asserts
  `publish-error` visible + live card absent + `/p/{slug}` template render)
- `e2e/dashboard-redirects.spec.ts` (`getPublishedFixture` → `publishSeed`, drop stale UI selectors;
  add `publishSeed` import)
- `e2e/dashboard-shell.spec.ts` (:279-289 accept 200|500 + serving check; keep skip-not-fail contract)
- `e2e/README.md` (document new dev publish contract: honest 500, `failed` row still serves)

**Steps**
1. Helper + spec edits per table. Keep `awaitPublishWindow` pacing untouched; publish call counts
   unchanged (rate-limit budget: publish.spec 2 UI publishes, redirects 1 via publishSeed
   [self-pacing], shell 1 direct, lifecycle self-pacing).
2. Comment in each touched spec: why 500 is the expected local outcome (link `route.ts` catch).

**Verification**
- `npx tsc --noEmit` clean (e2e is TS).
- `npm run test:e2e` — full suite green: `publish.spec.ts` (500 branch exercised locally),
  `dashboard-lifecycle`, `dashboard-redirects`, `dashboard-shell`, `dashboard-workspace` + public specs.
- Confirm `dashboard-shell` blog test RUNS (not skipped) — the seam exists to prevent silent skips.

---

## Phase 3 — M4: head escaping + URL scheme gate — **HUMAN GATE**

**HUMAN GATE (spec candidate #1):** changes the exact bytes served on customer domains. User signs
off pre-merge on: unit-test evidence + a generated-HTML sample pair (benign vs hostile fixture)
showing identical output for benign values (except correct `&` → `&amp;` inside attributes) and no
double-escaping (`&amp;amp;`). Final live confirmation = first prod publish post-deploy (local dev
can no longer produce a real blob — M3 consequence). May batch evidence into phase 5.

### Design

1. **Scheme gate — `isSafeURL(url: string): boolean`** in `src/lib/staticExport/headTags.ts`:
   - normalize by stripping **ALL** chars `\x00-\x20` (not trim — defeats `java\tscript:`), lowercase;
   - reject protocol-relative `//`; accept only `https:`/`http:` absolute or root-relative `/...`;
     everything else (`javascript:`, `data:`, `vbscript:`, no-scheme garbage, empty) → false;
   - no entity-decode needed — HTML-escaping runs after, so entity-encoded colons never re-activate.
   - Doc comment states the contract AND the chosen reject semantics per sink (below).
2. **Reject semantics = fallback/omit, NOT `''`** (review non-blocking, adopted):
   - `ogImage`: gate at source in `resolveOgImage` (`buildPageMetadata.ts:82-99`) — an unsafe
     `previewImage` candidate falls through the `||` chain to the auto `/api/og/{slug}` URL. Load-
     bearing: `previewImage` validation is `z.string().url()` (`validation.ts:117`) which ACCEPTS
     `javascript:`. Gate the `seo.ogImage` candidate at its merge point too (defense-in-depth; it is
     `HttpsUrl`-gated at schema but gating is one predicate call).
   - hreflang `a.href` (`htmlGenerator.ts:317`): unsafe → omit that alternate `<link>` entirely.
   - `canonicalURL` (`:382/:386/:394`): **escape-only** (`escapeHTML`) — it is always constructed
     `https://${host}${path}` (`canonicalUrl.ts:18-21`) so the scheme gate can never fire; hostile
     content sits inside host/path where escaping is the correct and sufficient defense. Document
     this reasoning at the call site (prevents a future "why no gate here" churn).
3. **Escape the raw sinks** in `htmlGenerator.ts`: `a.href` (:317, post-gate), `canonicalURL`
   (:382/:386/:394), `ogImage` (:389/:397, post-gate output), `metadata.slug` +
   `metadata.publishedPageId` (:431, data attrs → `escapeHTML`). No other line changes.
4. **DO NOT wrap (double-escape list — scout explicit):** `metadata.title`/`description` (already
   escaped :378/379/387/388/395/396), `faviconUrl` (escaped inside `faviconLinkTag`), `lang`,
   `a.hreflang`, `bodyHTML` (React), `metaPixelId`/`ga4MeasurementId` (regex-gated), `assetBase`
   (env). `resolveOgImage`'s `encodeURIComponent` is percent-encoding — orthogonal, no conflict.
5. **Import hygiene:** `escapeHTML` from `src/lib/staticExport/headTags.ts` ONLY (confusable
   namesakes in `src/lib/email/*`, `src/utils/formatUtils.ts`, `formHandler.js` — do not import).

### Ruling #3 assessment (CSS/script-context sinks) — follow-up, not this bundle

- `cssVariablesStyle` (`htmlGenerator.ts:441-455`): raw theme values in `<style>`; needs a CSS-value
  validator; naive filtering risks corrupting legit values on every page → follow-up finding.
- `jsonLd`: already breakout-safe (`structuredData.ts:70` escapes `<`; test pins it). Nothing to do.
- `localeJson`: escapes `<`; U+2028/29 only breaks pre-ES2019 engines; controlled config → audit note.
- Neither closure is both trivial AND low-risk → default ruling: record, don't expand.

**Files touched**
- `src/lib/staticExport/headTags.ts`
- `src/lib/staticExport/htmlGenerator.ts`
- `src/lib/staticExport/buildPageMetadata.ts`
- `src/lib/staticExport/headTags.test.ts` (extend — EXISTS)
- `src/lib/staticExport/buildPageMetadata.test.ts` (extend — EXISTS)
- `src/lib/staticExport/htmlGenerator.test.ts` (extend — EXISTS)

**Steps**
1. `isSafeURL` + doc comment in `headTags.ts`.
2. Gate in `resolveOgImage`; wrap sinks in `htmlGenerator.ts`.
3. Tests:
   - `headTags.test.ts`: `isSafeURL` accept (`https://…?b=1&c=2`, `http://…`, `/rel/path`) / reject
     (`javascript:alert(1)`, `JaVaScRiPt:`, ` javascript:x`, `java\tscript:x`, `java script:`,
     `data:text/html,…`, `vbscript:`, `//evil.com`, `''`); `escapeHTML` matrix (`& < > " '`,
     combined, empty, pre-encoded input documents no-double-encode contract); `faviconLinkTag` `&` →
     `&amp;` exactly once.
   - `buildPageMetadata.test.ts`: hostile `previewImage` (`javascript:…`) → resolveOgImage returns the
     auto `/api/og/{slug}` URL; benign `previewImage` unchanged.
   - `htmlGenerator.test.ts`: hostile slug / canonicalDomain / previewImage fixture → output head
     contains no raw `<script>`/unescaped `"` from payloads; benign fixture byte-stable except
     documented `&amp;`.

**Verification**
- `npx tsc --noEmit` clean; `npm run test:run` green.
- **Snapshot guard (review blocking #4, ASSERT not assume):**
  `npx vitest run src/modules/generatedLanding/uiFoundationIsolation.test.tsx` passes AND
  `git status` shows `__snapshots__/uiFoundationIsolation.test.tsx.snap` UNMODIFIED — its canonical
  `https://iso.lessgo.site` / og `https://lessgo.ai/api/og/iso` values are clean URLs `escapeHTML`
  must no-op on. Any snap diff = escaping regression → fix, never re-record here.
- Generate + save the benign/hostile HTML sample pair (human-gate evidence).

---

## Phase 4 — M5: published-CSS globs + in-script guards + sha baseline bump — **HUMAN GATE**

**HUMAN GATE (spec candidate #2):** `public/published.css` ships with every published page; the diff
includes the regenerated artifact + a deliberate sha256 baseline bump — both expected. User signs off
on: (a) before/after sizes, (b) 0-leak grep result, (c) `/p/{slug}` local render styled == editor
(dual-renderer parity restored; local `/p` SSR uses the published renderer + this CSS). May batch
into phase 5.

### Glob fix (`scripts/buildPublishedCSS.js:25-30`)

Replace dead L26 (`src/modules/UIBlocks/**` — removed dir, zero matches); keep L27-29. New content
list (scout-recommended, targeted — NOT whole-repo):

- `src/modules/templates/**/*.published.tsx` (~90) and `src/modules/templates/**/*.core.tsx`
- `src/modules/skeletons/**/*.published.tsx` + `src/modules/skeletons/**/*.core.tsx`
- `src/modules/generatedLanding/sharedBlocks/**/*.{ts,tsx}`
- template class-source non-block modules: `src/modules/templates/**/{tokens,variants,palettes,sectionRules}.ts`
  + SSR token/theme modules (`SSRTokens*`, `ThemeInjector.tsx` — implementer confirms per template)
- `src/modules/Design/**/*.ts` (designTokens + background helpers)
- `src/lib/staticExport/*.{ts,js}` (wrapper markup + runtime class-toggling behavior scripts:
  `workBehaviors.js`, `atelierSliderBehaviors.js`, `lumenBehaviors.js`, `naayomBehaviors.js`,
  `formHandler.js`)
- keep: `src/components/published/**/*.tsx`, `LandingPagePublishedRenderer.tsx`,
  `componentRegistry.published.ts`

No `src/**` / editor-twin globs. Safelist (L31-208) shrink = follow-up backlog one-liner.

### In-script guards (the anti-rot core — review blocking #5; markers vitest + JSON dropped per non-blocking: the existing sha256 fixture guard is strictly stronger for artifact drift)

After the tailwind run, the script itself:
1. **Per-glob zero-match hard fail:** resolve EACH content glob; any glob matching **0 files** →
   `process.exit(1)` naming that glob. This is the exact failure mode that rotted for months
   (L26 silently matched nothing) — the primary guard.
2. **Marker-class presence:** 4-5 real classes hardcoded in the script (one from a template
   `.published.tsx`, one from a `.core.tsx`, one from `skeletons/work/blocks/**`, one from
   `sharedBlocks/**`, plus safelist sentinel `landing-page-published`); missing → `exit 1` naming it.
   Prefer distinctive classes attributable to the new globs; implementer verifies each in source.
3. **App-chrome 0-leak assertion:** output must contain none of (case-insensitive) `onest`, `caveat`,
   `material symbols`, `app-primary`, `app-cta`, `app-ink` → else `exit 1`. The new `Design/**` +
   `staticExport/*` globs are the plausible leak vector; this pins the ui-foundation isolation
   contract at build time.
4. **Size cap — measured, not pre-committed:** record BEFORE size (baseline 32,031 B), rebuild,
   record AFTER; set hard-fail cap ≈ AFTER +25% (rounded), replace the stale `>100KB` warn (`:329`)
   and stale header comment (`:5`). Note in script comment: the sha256 fixture guard catches drift;
   the cap only catches an over-broad-glob explosion. If AFTER looks anomalous (≳10x baseline),
   stop and bring numbers to the human gate before committing.

### Baseline bump (review blocking #4)

`src/modules/generatedLanding/uiFoundationIsolation.test.tsx:124-145` pins
`sha256(public/published.css)` to `__fixtures__/published-css.sha256`. Regenerating the artifact
fails `test:run` until the baseline is bumped. Order: full `npm run build` FIRST → compute sha256 of
the fresh artifact → overwrite the fixture (deliberate, documented bump). Also re-run the documented
0-leak grep against the new artifact:
`rg -i "onest|caveat|material symbols|app-primary|app-cta|app-ink" public/published.css` → 0 matches.

**Files touched**
- `scripts/buildPublishedCSS.js`
- `public/published.css` (regenerated artifact — committed)
- `src/modules/generatedLanding/__fixtures__/published-css.sha256` (deliberate baseline bump)

**Steps**
1. Record BEFORE size; rewrite globs; add guards 1-3; build once; measure AFTER; set cap; finalize.
2. Bump sha fixture from the fresh artifact; run the 0-leak grep.
3. Negative spot-check: temporarily break one glob path → script exits 1 naming it → restore.

**Verification**
- `npm run build` succeeds (guards pass, sizes logged).
- `npm run test:run` green — specifically `uiFoundationIsolation.test.tsx` sha case against the NEW
  baseline; HTML snapshots untouched.
- 0-leak grep = 0 matches. BEFORE/AFTER sizes + cap rationale recorded in the phase audit.
- `/p/{slug}` local render of a marker-class template block: styling == editor.

---

## Phase 5 — integration verification + gates sweep

**Files touched**
- `docs/task/publish-trust.plan.md` (progress log only, if delegated here)
- (no source files — defects route back to the owning phase)

**Steps**
1. Full gates: `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` (full — not
   just `next build`) — all green.
2. `npm run test:e2e` — full suite (publish + parity + all dashboard specs), mind 5/60s publish limit
   (serial runner + publishSeed pacing handle it).
3. Local smoke on `npm run dev` (one page, honest-dev expectations):
   - page uses a marker-class template block, hostile `previewImage`;
   - publish → **500** (honest local outcome), SlugModal shows `publish-error`, no live card;
   - `/p/{slug}` (SSR fallback) renders: template styling applied (M5), hostile payload inert (M4
     where SSR head overlaps; static-HTML bytes evidence = phase 3's generated sample pair).
4. Present human-gate evidence bundle (M4 sample pair + snapshot-unchanged proof; M5 sizes + grep +
   parity screenshot) for sign-off. **Merge to main remains the standing human gate**; first prod
   publish post-deploy is the final M3/M4 live confirmation (deploy-watcher + founder spot-check).

**Verification**
- All commands green; smoke observations + sign-offs recorded in the audit.

---

## Follow-up findings to record (audit + backlog one-liners, NOT this bundle)

- `cssVariablesStyle` CSS-context injection (`htmlGenerator.ts:441-455`) — needs CSS-value validator.
- Subpage-blob rollback leak (`route.ts:521-530` deletes root blob only).
- Safelist shrink in `buildPublishedCSS.js` (L31-208) now that real globs exist.
- `localeJson` U+2028/U+2029 (pre-ES2019 only — near-nil priority).
- `canonicalDomain` trust boundary (scout's "biggest live gap") — source validation is the fuller fix.
- `previewImage` schema (`validation.ts:117`) could be tightened to `HttpsUrl` at the boundary —
  belt-and-braces over phase 3's sink gate.

## Unresolved questions

None blocking. (Rev-1 questions resolved: force-fail header killed per review; CSS cap now measured
post-fix, not pre-committed.)
