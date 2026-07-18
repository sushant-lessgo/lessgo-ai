# blog-composer-redesign — audit

## Phase 1 — Blog manager reskin (3b first-run + 3c manager)

Branch verified: `feature/blog-composer-redesign` (matches orchestrator).

### Files changed

- `docs/task/blog-composer-redesign.spec.md` (already present in worktree — untracked; to be `git add`ed with this phase, not authored by me)
- `docs/task/blog-composer-redesign.audit.md` (this file, new)
- `src/app/dashboard/[token]/blog/page.tsx` (modified)
- `src/app/dashboard/[token]/blog/components/BlogPostsTable.tsx` (modified)
- `src/app/dashboard/[token]/blog/components/NewPostButton.tsx` (modified)
- `src/app/dashboard/[token]/blog/components/BlogFirstRun.tsx` (new)
- `src/app/dashboard/[token]/blog/components/BlogStatsStrip.tsx` (new)
- `e2e/blog-manager.spec.ts` (new)
- `playwright.config.ts` (modified — **Files-touched list amended by orchestrator ruling**; see below)

Nothing outside the phase's (amended) Files-touched list was edited.

### Per file

**`page.tsx`** — server data layer untouched: same `getWorkspaceProject` (the auth boundary),
same `blogPost.findMany` select, same `blogSubscriber.count`. No new queries. Three states now
render, keyed on the DERIVED rule `enabled ⇔ ≥1 BlogPost` (ruling #1):
1. `!publishedPage` → reskinned R18 locked card ("Publish your site to start blogging");
2. `posts.length === 0` → `<BlogFirstRun />`;
3. else → header + `<BlogStatsStrip />` + `<BlogPostsTable />`.
Stats (`published`, `drafts`, `lastPublishedAt`) are computed in JS from the already-fetched
posts array — no `groupBy`. Legacy `bg-gray-50` / `max-w-6xl` / `font-body` chrome replaced with
the app-chrome container (`px-[26px] pb-[26px] pt-[22px]`) used by the sibling tabs' locked states.

**`BlogFirstRun.tsx` (new)** — server component, handoff TURN 4: headline "Add a blog to
{project}", where-it-will-live line, single "Write a post" CTA. Comment marks the phase-4 AI-CTA
slot and documents the accepted wart.

**`BlogStatsStrip.tsx` (new)** — server component, pure props: Posts / Published / Drafts /
Last published / Subscribers. No view counts (PageAnalytics is site-slug-keyed — they don't
exist); the comment says so, loudly, so nobody adds a fabricated tile. Empty last-published
renders `—`, never a made-up date.

**`NewPostButton.tsx`** — `window.prompt` → shared `promptDialog`, `alert` → `toast`. Added
client-side title validation (non-empty, ≤200 = `BlogPostCreateSchema`'s bound) as a courtesy;
the route stays the real gate. **API contract unchanged**: `POST /api/blog/posts {tokenId,title}`
→ `router.push('/dashboard/{tokenId}/blog/{postId}')`. Added a `variant` prop ('default' |
'hero') so first-run can render the larger CTA without a second component.

**`BlogPostsTable.tsx`** — table → app-chrome card/row list. `confirm()` → `confirmDialog`,
`alert()` → error `toast`, plus success toasts. **Contracts unchanged**:
`POST /api/blog/posts/{id}/{publish|unpublish}` with `{tokenId}`, `DELETE ...?tokenId=`, then
`router.refresh()`. Rows carry `data-testid="blog-post-row-{id}"` for the e2e. The local
`posts.length === 0` empty state was removed — the page owns that state now (one owner per
state); with 0 posts this component is never mounted.

**`e2e/blog-manager.spec.ts` (new)** — authed, serial, with the "WHAT THIS DOES *NOT* COVER"
preamble. Seeds + `publishSeed`s a project (R18 precondition), then: first-run at 0 posts →
create via the real prompt dialog + real route → lands in composer → row + stats in the manager →
delete the only post via `confirmDialog` → **asserts the manager reverts to first-run** (the
derived-enablement wart, not merely "row gone") + DB row really gone.

**`playwright.config.ts`** — added three patterns to the `authed` project's `testMatch`
allow-list: `/blog-manager\.spec\.ts/` (phase 1), plus `/blog-composer\.spec\.ts/` (phase 2) and
`/blog-ai-write\.spec\.ts/` (phase 4) pre-registered. Playwright **no-ops** on patterns matching
no file (confirmed: the run below is green with two of the three files absent), so pre-registering
is safe and stops phases 2/4 rediscovering the trap. That is the entire diff — no other config
key touched.

### Decisions / deviations

1. **Dropped the duplicate `← Dashboard` back-link and the `Blog — {page title}` `<h1>`** from
   `page.tsx`. `[token]/layout.tsx` already renders `WorkspaceHeader` (project name + nav) +
   `WorkspaceTabs` above every tab, so both were redundant legacy chrome from the pre-S1 route.
   A small "Blog" heading + the `{host}/blog ↗` link remain. Conservative reading of "replace the
   legacy gray-50/max-w-6xl chrome"; flag at Gate A if the back-link is wanted.
2. **"Match sibling pages" = their app-chrome *locked* states, not their bodies.** `[token]/leads`
   and `[token]/analytics` bodies are still un-reskinned legacy gray-50 (their locked states are
   the only app-chrome part). I matched the app-chrome/ui-foundation tokens, not the legacy body —
   the phase brief says replace that chrome, so copying it would defeat the phase.
3. Delete-confirm copy names the wart ("your blog goes back to the setup screen") only when it's
   the last post. The e2e pins that sentence.
4. Toast on publish/unpublish/delete success is net-new (there was no success signal at all
   before) — in-scope reskin of the "ad-hoc notices" the plan asked to replace.

### Spec-registration blocker — RESOLVED (scope amended by orchestrator)

Originally reported as an out-of-scope stop: `e2e/blog-manager.spec.ts` matched no Playwright
project, so `npx playwright test blog-manager` exited **"No tests found."** — the config's own
comment names the hazard (*"a spec only runs if it is listed HERE — an unregistered spec silently
matches no project and gives false confidence"*). The plan missed registration for all three blog
specs.

**Orchestrator ruling: phase 1's Files-touched list is amended to include `playwright.config.ts`**
(a plan bug, not scope creep). Registered `blog-manager` + pre-registered the phase-2/4 specs.
The spec now runs and passes — see below. No assertions were weakened to reach green.

### Verification (exact commands, real outcomes)

- `npx tsc --noEmit` → **one error, pre-existing and unrelated to this diff**:
  `src/app/page.tsx(6,26): TS2307: Cannot find module '@/assets/images/founder.jpg'`.
  Cause: this fresh worktree has no generated `next-env.d.ts` / `.next/types` (both gitignored,
  produced by `next dev`/`next build`), so Next's image-module declarations are missing. The file
  itself exists (`src/assets/images/founder.jpg`) and `src/app/page.tsx` is untouched by me.
  **Zero errors in any file this phase changed.**
- `npm run test:run` → **green**: 197 passed | 1 skipped (198 files); 3379 passed | 18 skipped.
- `E2E_PORT=3117 npm run test:e2e -- blog-manager` → **PASSED (observed, real run).**
  ```
  Running 2 tests using 1 worker
    ✓  1 [setup] › e2e\auth.setup.ts:9:6 › authenticate (12.6s)
    ✓  2 [authed] › e2e\blog-manager.spec.ts:75:5 › first-run → create → row in the manager
         → delete the only post → back to first-run (57.3s)
    2 passed (1.7m)
  ```
  Port note: 3000 was occupied by another dev server (`EADDRINUSE`) — `E2E_PORT=3117` is the
  only reason for the override, not a test concession. Ran in mock mode (the config default);
  the blog routes use real Clerk `auth()` via `requireBlogProject`, so the ownership path
  exercised here is the real one, not a demo short-circuit.
- `npm run build` not run (not required by this phase's verification list).

### For the reviewer

- `playwright.config.ts` is on the diff by orchestrator amendment (registration bug in the plan).
  Diff is additive: three regexes in the `authed` `testMatch`. Phases 2/4 need no config change.
- Confirm decision 1 (removing the back-link/h1) is wanted, or restore them — flagged for GATE A.
- `BlogStatsStrip`'s no-view-counts comment and `BlogFirstRun`'s derived-enablement comment are
  load-bearing guardrails, not decoration.
- API contracts: worth diffing `BlogPostsTable`'s `act()` and `NewPostButton`'s `fetch` against
  the previous versions — they should be byte-identical in request shape.

---

## Phase 2 — Post composer reskin (3d shell, manual authoring)

Branch verified: `feature/blog-composer-redesign` (matches orchestrator).

### Files changed

- `src/app/dashboard/[token]/blog/[postId]/page.tsx` (modified)
- `src/app/dashboard/[token]/blog/[postId]/components/BlogPostEditor.tsx` (modified)
- `src/app/dashboard/[token]/blog/[postId]/components/BlogRichTextEditor.tsx` (modified — chrome only)
- `src/app/dashboard/[token]/blog/[postId]/components/HeroImageField.tsx` (new)
- `e2e/blog-composer.spec.ts` (new)
- `docs/task/blog-composer-redesign.audit.md` (this append)

Nothing outside the phase's Files-touched list was edited. `playwright.config.ts` was NOT
touched — phase 1's pre-registration of `/blog-composer\.spec\.ts/` worked exactly as promised
(the spec was picked up with no config change).

### Per file

**`[postId]/page.tsx`** — chrome only. Untouched and verified by eye against the pre-reskin
file: the `getWorkspaceProject` auth boundary, the R18 `!publishedPage → notFound()` gate, the
`post.projectId !== project.id` integrity check, the `body.markdown` flatten, and
`slugLocked: post.firstPublishedAt != null`. Changed: the legacy `bg-gray-50` / `max-w-6xl` /
`font-body` wrapper → the app-chrome container (`px-[26px] pb-[26px] pt-[22px]`, matching
phase 1's blog tab), and the lucide `ArrowLeft` back-link → `AppIcon name="arrow_back"` on app
tokens. The back-link was KEPT here (phase 1 dropped the manager's): the composer is a
sub-page, and `WorkspaceTabs` highlights "Blog" but offers no way back out of a post.

**`BlogPostEditor.tsx`** — relaid out to rail-left / writing-surface-right (handoff TURN 5).
Rail = status, slug (+lock note), excerpt, hero, SEO disclosure; right = a large borderless
title input over the article body. All five frozen contracts preserved and listed in a header
comment: PATCH body `{format:'markdown', markdown}` (with the `...(post.slugLocked ? {} : {slug})`
omission intact), `POST .../publish`, `POST .../unpublish`, the `richKey` remount, and
`slugLocked`. **The preview link is byte-identical**, comment block included — still
`/dashboard/blog/{slug}/{post.id}/preview`. `alert`/`confirm`/the home-grown `flash` notice →
shared `toast`/`confirmDialog`.

**`HeroImageField.tsx` (new)** — the ruling-#7 seam. `uploadHero` lifted verbatim out of the
editor (same `/api/upload-image` endpoint, same FormData fields, same `res.ok && data.url`
success condition); parent sees only `{value, onChange(url)}` + `tokenId` (upload scope, which
the picker will need too). Upload/busy state is private, so the picker branch can replace the
internals without touching `BlogPostEditor`. Added a thumbnail preview when a URL is set.

**`BlogRichTextEditor.tsx`** — styling only, as mandated. Toolbar button/divider/container
classes and the "Loading editor…" line moved to app tokens. Extensions (`StarterKit, Image,
Markdown`), `immediatelyRender:false`, and the `onUpdate` serialization are untouched — a
header comment now says why each is untouchable. **`PROSE` was deliberately NOT retokenized**:
it mirrors what readers get from `BlogPostBodyBlock`, so app-* fonts there would make the
WYSIWYG lie about the published article. `window.prompt`/`alert` at :57/:64/:80 left in place
per instructions, now labelled as a known/accepted leftover (swapping them is behaviour).

**`e2e/blog-composer.spec.ts` (new)** — authed, serial, with the "WHAT THIS DOES *NOT* COVER"
preamble stating the publish exclusion AND its reason (blob-less publish hard-throws from
outside the try). Three tests, all through the real UI + real routes.

### Decisions / deviations

1. **Rail seam implemented as an optional `railPanel` ReactNode prop** on `BlogPostEditor`
   (default = the settings panel) plus a `ComposerRail` wrapper owning width/sticky. It is
   currently UNUSED — speculative generality I'd normally avoid, but the plan explicitly asks
   for a swappable slot for phase 4. Note phase 4's Files-touched list includes neither this
   file nor `[postId]/page.tsx`, so **actually mounting a brief here will need a scope
   amendment** — flagging rather than pre-solving.
2. **Back-link kept** (see above) — a conscious divergence from phase 1's decision #1, because
   the surfaces differ. Flag at GATE A if unwanted.
3. **Hero image = the known SPEC DEVIATION (ruling #7)** — upload flow kept, media picker
   deferred (branch unmerged). Needs founder sign-off at GATE A; phase 5 must grade this box
   "deviated", not ticked.
4. Toolbar "Rich/Markdown" toggle, the SEO disclosure, and the raw-markdown escape hatch all
   survive — only their classes changed.
5. Added `data-testid`s (`composer-title`, `composer-slug`, `composer-slug-locked-note`,
   `composer-markdown`, `composer-status`) for the e2e. Conservative: attributes only.

### Verification (exact commands, real outcomes)

- `npx tsc --noEmit` → **clean, zero errors.** (Phase 1's pre-existing `founder.jpg` TS2307 is
  gone now that the worktree has generated Next types from a build.)
- `npm run test:run` → **green**: 197 passed | 1 skipped (198 files); 3379 passed | 18 skipped.
  Identical to phase 1's numbers — nothing regressed, nothing added.
- `npx vitest run src/lib/blog/__tests__/tiptapRoundTrip.test.ts` → **7 passed** (untouched-green,
  the landmine's contract test).
- `npm run build` → **succeeded** (full route table printed, no errors).
- `E2E_PORT=3117 npx playwright test e2e/blog-composer.spec.ts` → **ALL PASSED (observed):**
  ```
  Running 4 tests using 1 worker
    ✓ 1 [setup] › auth.setup.ts › authenticate (17.1s)
    ✓ 2 [authed] › blog-composer.spec.ts:91 › edit title + body → save → reload → persisted (53.1s)
    ✓ 3 [authed] › blog-composer.spec.ts:124 › markdown round-trip: raw markdown → rich editor
        → save → reload keeps the markup (8.3s)
    ✓ 4 [authed] › blog-composer.spec.ts:170 › slug is locked after first publish — API 409 +
        the field is disabled and explained (1.1m)
    4 passed (3.3m)
  ```
  Port 3117 because 3000 is occupied on this machine — not a test concession. No assertion was
  weakened to reach green.
- ⚠️ **Honest note on the full e2e suite.** My first attempt, `E2E_PORT=3117 npm run test:e2e --
  blog-composer`, did NOT filter (the arg didn't reach Playwright) and ran the whole suite:
  **28 passed, 4 failed, 4 skipped, 30 did not run** (it bailed before reaching blog-composer —
  which is why I re-ran the spec directly). The 4 failures are in specs I did not touch and
  which do not import anything I changed: `dashboard-lifecycle.spec.ts:81`,
  `dashboard-redirects.spec.ts:134`, `dashboard-shell.spec.ts:126` (menuitem count), and
  `publish.spec.ts:14` (`/p/{slug}` navigation returned no response — smells like the local
  blob/KV gap). I believe they are pre-existing/environmental, but **I did not run the suite on
  a clean tree to prove that**, so I am reporting it rather than asserting it. Worth the
  orchestrator's attention independently of this phase.
- Manual visual QA vs the handoff: **not performed by me** — that is GATE A.

### For the reviewer — look here first

- **The landmines.** Diff `BlogPostEditor`'s `save`/`publish`/`unpublish` request bodies and the
  preview `<a href>` against `c9aad99a`'s version; they should be behaviourally identical (the
  preview link is byte-identical incl. its comment). Diff `BlogRichTextEditor` and confirm the
  only changes are `className` strings + comments — extensions, `immediatelyRender`, `onUpdate`,
  and `PROSE` must be untouched.
- **The unused `railPanel` prop** (decision 1) — accept the seam or tell me to drop it; either
  way phase 4 likely needs a Files-touched amendment to use it.
- **The e2e's DB plant** (`db.blogPost.update({ firstPublishedAt })`) — the lock's trigger is
  simulated because publish cannot run locally; the 409 + disabled-field behaviour it asserts is
  the real code path. The preamble says exactly this. The round-trip test edits INSIDE Tiptap
  after the mode switch specifically so the saved markdown is Tiptap's serialization, not the
  raw text typed in step 1 — that's the load-bearing detail.
- **GATE A owes three things**: publish/unpublish manually (only coverage that exists), visual
  sign-off, and the hero-image deviation call.
