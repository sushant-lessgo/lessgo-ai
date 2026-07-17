# secrets-forms-security — audit

## Phase 1 — server-side owner derivation

**Files changed**
- `src/app/api/forms/submit/route.ts` (modified)
- `src/app/api/forms/submit/route.test.ts` (modified)
- `src/lib/validation.ts` (modified — comment-only)
- `src/app/dashboard/[token]/leads/page.tsx` (modified — comment-only)
- `docs/task/secrets-forms-security.audit.md` (created — this file)

`src/lib/publishState.ts` was import-only, NOT edited (verified).

---

### `src/app/api/forms/submit/route.ts`

- Added `import { isServingPublishState } from '@/lib/publishState'` — canonical predicate, re-pointed not reinvented.
- `FormSubmissionRequest.userId` marked `@deprecated` / ignored; `publishedPageId` documented as the identity input.
- Destructure is now `{ formId, data, publishedPageId }` — body `userId` is **never read** (comment explains why the field survives in the schema).
- New gate after zod parse (Locked decision 2):
  - `!publishedPageId` → 400 `missing_page_id`
  - `publishedPage.findUnique({ where: { id }, select: { userId, projectId, publishState } })` → null **or** `!isServingPublishState(publishState)` → 404 `unknown_page` (same body both ways; `draft`/`unpublishing` reject, `published|publishing|failed|null` accept).
- `const ownerUserId = page.userId` swapped in at every trust point: `formSubmission.count` where-clause, `checkLimit(...)`, cap-warning log, `formSubmission.create({ data: { userId: ownerUserId } })`, the "FormSubmission saved" log, and the DB-error log (`hasUserId` → `ownerUserId` prefix).
- Form-config lookup: the all-projects `project.findMany({ where: { userId } })` scan is **gone**, replaced by `project.findUnique({ where: { id: page.projectId } })` reading `content.forms[formId]` from that one project.
- Deleted the `if (!userId)` 400 branch and the trailing "no userId → 500" fallback; the `if (userId)` wrapper became an unconditional `try` (body dedented 2 spaces — that is why the diff looks wide; content is otherwise unchanged).
- Downstream untouched in behavior: ConvertKit path, blog-subscriber upsert, `sendLeadNotification` + notify-outcome flags, success payload shape, rate-limit wrapper.
- Blog edge documented in-code at the gate (cached blog post + non-serving parent → subscribes rejected; correct per spec).

### Null `projectId` handling (the reviewer's catch)

`PublishedPage.projectId` is `String?` (`prisma/schema.prisma:154`). The lookup is guarded:

```ts
let formConfig: any = null;
if (page.projectId) { const project = await prisma.project.findUnique({ where: { id: page.projectId } }); ... }
```

So `projectId == null` → **skip the lookup entirely, no 500** → falls into the same path as "no form config found": submission stored, `formName: 'Unknown Form'`, `integrations: []`, no integrations fire. Typechecks cleanly (the `if` narrows `string | null` → `string`). Pinned by the unit test *"page with a null projectId → skips the form-config lookup, still stores the lead"*.

### `src/app/api/forms/submit/route.test.ts`

- Prisma mock: added `publishedPage: { findUnique }`; `project: { findMany }` → `project: { findUnique }`.
- **Removed both `db.project.findMany.mockResolvedValue([])` default lines** (old `:57` and `:110`) — they would throw against the reworked mock. Replaced with `publishedPage.findUnique → PAGE` + `project.findUnique → null` defaults in both `beforeEach`s.
- Added `const PAGE = { userId: 'owner_1', projectId: 'proj_1', publishState: 'published' }`.
- `BODY` **keeps the forged `userId: 'user_1'`** (file-header comment now states this is deliberate and is the forged-id pin). Flipped the two cap assertions to `'owner_1'`.
- New describe block *"server-side owner derivation"* pins: derived owner on `create` (and `!== 'user_1'`); project-scoped `findUnique({ where: { id: 'proj_1' } })`; null `projectId`; unknown page → 404; missing page id → 400 (+ no page lookup); `draft`/`unpublishing` → 404; `publishing`/`failed` → 200; `null` legacy → 200; omitted body `userId` → 200 attributed to owner.

### `src/lib/validation.ts`

Comment-only on `FormSubmissionSchema`: `userId` documented as accepted-and-ignored (old-client back-compat, form.v1.js sends it forever); `publishedPageId` left optional with a note that the route owns the stable `missing_page_id` 400 instead of a zod issues array. Both fields still `.optional()`.

### `src/app/dashboard/[token]/leads/page.tsx`

Comment-only. The stale "submit takes BOTH ids from the client body (`route.ts:57`, `:198-199`)" bullet is rewritten to describe server-side derivation + the `isServingPublishState` gate, noting rows written before this deploy may still carry a forged `userId`. The "Do NOT restore it" ruling is preserved (it rests on the PK-provenance + clerk-id-vs-User.id arguments, both unaffected).

---

### Deviations from the plan

1. **DB-error log field** — the plan said keep log lines in sync; `hasUserId: !!userId` had no meaning once `userId` is unread, so it became `ownerUserId: <prefix>...` (anonymized, matching the other log lines). Conservative, in-scope.
2. **404 message wording** — the plan's body text was "…contact support."; used `'This form is no longer available. Please contact support.'` (400 uses the plan's `'Form configuration error. Please contact support.'`). Error **codes** are exactly as specced; only the human message differs, and unresolved question 7 leaves wording open.
3. **Test extras** — added `publishing`/`failed` accept pins and an "omitted body userId" pin beyond the plan's (a)–(e) list; they cover the phase's own verification matrix at zero cost.

### Test results

```
npx vitest run src/app/api/forms/submit/route.test.ts
 Test Files  1 passed (1)
      Tests  18 passed (18)

npm run test:run
 Test Files  209 passed | 1 skipped (210)
      Tests  3557 passed | 18 skipped (3575)
```

`npx tsc --noEmit` → **one pre-existing, unrelated error**:

```
src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'
```

Not caused by this phase (untouched file, clean in `git status`). Cause: `next-env.d.ts` is generated + gitignored and has never been created in this fresh worktree, so Next's image-module type declarations are absent. It disappears after any `next dev`/`next build` in the worktree. **Not papered over — reported as-is.** No tsc errors in any Phase-1 file.

### Open risks / noticed but NOT fixed

- **Manual dev-server verification (plan Phase 1 "Verification" b/c/d) not run** — no dev server/DB in this session. Covered deterministically by the new unit pins; Phase 2's e2e spec is the real end-to-end pin.
- **`src/app/api/forms/submit/route.ts:1`** — `NextResponse` and `z` imports, and `sanitizeForLogging`, were already unused before this phase and remain so. Out of scope; not touched.
- Behavior change accepted per Locked decision 3: a `formId` living in a *different* project of the same owner no longer resolves config (lead still stored, no integrations). Phase 4 ConvertKit smoke must attach the integration to a form in the published page's **own** project.
- Leak side is still open until Phase 3: `data-owner-id` remains in published markup and `form.v1.js` still sends `userId` — harmless now that the server ignores it, but the ordering (server first) is why this is safe.
