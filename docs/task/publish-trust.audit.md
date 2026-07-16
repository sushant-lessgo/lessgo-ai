# publish-trust — implementation audit

## Phase 1 — M3: honest publish failure (route + vitest)

### Files changed

- `src/app/api/publish/route.ts` (modified)
- `src/app/api/publish/route.test.ts` (new)
- `docs/task/publish-trust.audit.md` (new — this file)

(`docs/task/publish-trust.{spec,scout,plan}.md` are untracked-but-existing; commit-only per plan,
not edited by me.)

### What changed + why

**`src/app/api/publish/route.ts` — HTTP-status-only change, two hunks:**

1. Static-export catch (~`:513-556`): replaced the fall-through
   (`// Don't block publish - legacy SSR still works` + the `console.warn`) with
   `return createSecureResponse({ error: 'Publish failed. Your changes were saved — please try publishing again.' }, 500)`.
   Everything else in the catch is byte-identical: `console.error`, `Sentry.captureException`,
   orphaned-blob rollback (`del(uploadedBlobKey)`), and the `publishState:'failed'` + `publishError`
   DB write. Stable, non-leaky body matching the `{ error }` shape already used by the fatal 500.
   Why: the 200 contradicted the route's own `failed` row — first publish reported live with no KV
   routes, republish reported live while the previous version still served.
2. KV sub-catch (`:479`): added an explanatory comment on the deliberate/harmless double-set of
   `publishState:'failed'` (KV sub-catch + outer export catch), so a future reader doesn't "fix" it.

No test backdoor / force-fail hook (explicitly killed in review). No new imports, no util added.

**`src/app/api/publish/route.test.ts` (new)** — deterministic guard mirroring the
`src/app/api/forms/submit/route.test.ts` pattern (in-file `vi.mock`s; `createSecureResponse` →
`{ __body, __status }`; hand-rolled request; exported `POST` called directly). Mocks: Clerk `auth`,
`@sentry/nextjs`, `@/lib/prisma`, `@/lib/rateLimit`, `@/lib/validation`, `@/lib/security`,
`@/lib/planManager`, `@/lib/admin`, `@/lib/staticExport/injectChrome`,
`@/lib/staticExport/htmlGenerator`, `@/lib/staticExport/renderPublishedExport`,
`@/lib/staticExport/versionCleanup`, `@/lib/blog/publishBlogPost`, `@vercel/blob` (`del`, incl. the
dynamic import), `@/lib/routing/kvRoutes`, `@/lib/i18n/localeSlugCollision`.

Cases (4 — the 3 required, with the blob-rollback assertion split out for clarity):
1. export throws → **500**, non-empty `{ error }`, **no `url`**/`message`; exactly one
   `publishState:'failed'` update carrying the thrown message; `del` NOT called (a throw *during*
   generation never records a `blobKey` — the helper self-cleans; matches `route.ts:396-397`).
1b. throw *after* a successful upload (KV write fails) → 500 **and** `del` called with the uploaded
   `BLOB_KEY` — this is the rollback-called-with-uploaded-key assertion from the plan.
2. KV write throws (KV sub-catch path) → 500, no `url`, ≥1 `failed` write containing the KV detail.
3. Happy path → **200** `{ message: 'Page published successfully', url }`, no `failed` write, no `del`.

### Deviations from plan

- **Export-throw seam is `renderPublishedExport`, not `generateStaticHTML`.** The route no longer
  calls `generateStaticHTML` directly (it dynamic-imports `@/lib/staticExport/renderPublishedExport`,
  which wraps generation + upload + versioning). Mocked BOTH; case 1 throws from
  `renderPublishedExport` — the real seam. Same catch exercised.
- **Rollback assertion split into case 1b.** The plan folded "del called with the uploaded key when
  one exists" into case 1, but in case 1 no key exists yet by construction — so case 1 pins
  `del` NOT called and case 1b (post-upload throw) pins `del(BLOB_KEY)`. Conservative: both facts
  asserted, nothing dropped.
- Added a few mocks beyond the listed set (`@/lib/admin`, `@/lib/rateLimit`, `@sentry/nextjs`,
  `versionCleanup`, `publishBlogPost`) — all in-file, needed to reach the catch deterministically.

### Verification (actual output)

- `npx vitest run src/app/api/publish/route.test.ts` → `Test Files 1 passed (1) · Tests 4 passed (4)`.
- `npm run test:run` → `Test Files 210 passed | 1 skipped (211) · Tests 3550 passed | 18 skipped (3568)` (60.8s).
- `npx tsc --noEmit` → **one error, PRE-EXISTING and unrelated**:
  `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'`.
  Cause: this worktree has no generated `next-env.d.ts` (gitignored, produced by `next dev/build`);
  the asset file exists on disk. Not touched by, and not fixable within, this phase's file list — not "fixed".
  No errors in `src/app/api/publish/**`.
- Diff-read: the new `return` sits inside the static-export `catch` (inside the outer `try`, not
  rethrowing), so `'Page published successfully'` at the end of the outer `try` is **unreachable**
  whenever the export catch fires. Confirmed against `git diff`.
- `npm run test:e2e` deliberately NOT run — authed e2e is known-red until phase 2 lands (plan §Phase 1
  verification / §Phase 2).

### Open risks / follow-ups to carry

- **Known-red window:** dev/e2e publish now honestly 500s (no Blob/KV locally). `e2e/helpers/seedDraft.ts`
  `publishSeed`, `publish.spec.ts`, `dashboard-redirects.spec.ts`, `dashboard-shell.spec.ts` are red
  until **phase 2**. Phase 2 must follow immediately.
- **Subpage-blob rollback leak (`route.ts:521-530`) — OUT OF SCOPE, note only:** the rollback deletes
  only the root `uploadedBlobKey`; subpage/locale blobs uploaded by `renderPublishedExport` are
  orphaned on a post-upload failure. The new 500 makes this path more likely to be *hit* (it no
  longer silently succeeds), so the leak is now more visible. Already on the plan's follow-up list.
- Not committed — tree left dirty for the orchestrator.
