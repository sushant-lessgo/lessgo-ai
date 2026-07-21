# lead-emails — implementation audit

## Phase 1 — Owner-notification re-routing

Branch: `feature/lead-emails` (verified via `git branch --show-current` before any edit).

### Files changed

- `src/lib/email/sendEmail.ts` (NEW)
- `src/lib/email/resolveOwnerEmail.ts` (NEW)
- `src/lib/email/sendLeadNotification.ts` (modified)
- `src/lib/email/sendEmail.test.ts` (NEW)
- `src/lib/email/resolveOwnerEmail.test.ts` (NEW)
- `src/lib/email/sendLeadNotification.test.ts` (modified)
- `src/app/api/forms/submit/route.ts` (modified)
- `src/app/api/forms/submit/route.test.ts` (modified — added to Files-touched by orchestrator
  ruling mid-phase; see the addendum at the end of this file)
- `docs/task/lead-emails.audit.md` (NEW — this file)
- `next-env.d.ts` (generated, **gitignored** — see "Deviations", not part of the diff)

### What changed, per file

**`src/lib/email/sendEmail.ts` (NEW)** — low-level Resend REST helper extracted from
`sendLeadNotification`. `sendEmail({to, from, replyTo?, subject, text, html, op, extra?})
→ EmailSendOutcome` (`skipped | sent | failed{error}`). Never throws. `skipped` when
`RESEND_API_KEY` is absent (also when `to` is empty). Non-OK response → `failed` +
`Sentry.captureException` tagged `{area:'email', op}` with `extra: {status, body, ...extra}`;
thrown fetch → `failed: send failed: <msg>` + the same Sentry tags. Direct `fetch` kept; no
`resend` npm package added. `RESEND_ENDPOINT` exported for callers/tests.

**`src/lib/email/resolveOwnerEmail.ts` (NEW)** — `resolveOwnerEmail(clerkUserId) →
{email} | {error}`. Clerk v6 style: `const client = await clerkClient(); client.users.getUser(id)`.
Picks the address whose `id === primaryEmailAddressId`, else the first address, else
`{error}`. Empty/non-string id short-circuits to `{error:'no owner id'}` without calling Clerk.
Never throws. Every error path also emits `Sentry.captureException` with tags
`{area:'email', op:'resolveOwnerEmail'}` (truncated user id in `extra`) — the plan asked for
"Sentry via existing path"; putting it here keeps `route.ts` free of a Sentry import.

**`src/lib/email/sendLeadNotification.ts`** — signature gains `to?` and `businessName?`;
the send is delegated to `sendEmail` with `op: 'sendLeadNotification'` and
`extra: {pageId, formName}` (preserves the existing Sentry tag/extra assertions verbatim).
Subject/body/HTML rendering, `labelFor`, `escapeHtml`, empty-value dropping and the
Reply-To-when-`isValidEmail` rule are unchanged. New exported helpers
`sanitizeDisplayName()` (strips CR/LF, `"` and `\`, collapses whitespace, caps at 78 chars)
and `buildFromHeader(businessName, address?)` → `"Name" <addr>` or a bare address when no
display name survives; address = `LEAD_NOTIFICATION_FROM || 'onboarding@resend.dev'`.
`LeadNotifyOutcome` is retained as an alias of `EmailSendOutcome` so existing imports keep
compiling. Outer try/catch retained (body assembly must never throw into the submit path).

**`src/app/api/forms/submit/route.ts`** — added `title` to the EXISTING
`publishedPage.findUnique` select and `title` to the EXISTING `project.findUnique` select
(no new queries). The email block still sits strictly AFTER `formSubmission.create`.
Business name = `page.title` → `project.title` → `'Your website'`, with the literal
`'Untitled Project'` treated as a non-name (falls through), per orchestrator answer 4.
`resolveOwnerEmail(ownerUserId)` runs inside the existing try; `{error}` ⇒ outcome
`{status:'failed', error}` (writes `notifyError`, console warn, no send attempt); success ⇒
`sendLeadNotification({..., to, businessName})` with the `notifiedAt`/`notifyError` writes
unchanged. Body `userId` still not read.

**Tests** — `sendEmail.test.ts`: env-gate skip (no fetch), no-recipient skip, full payload
assertion (URL/method/Authorization/Content-Type/to/from/reply_to/subject/text/html),
reply_to omission, non-OK → failed + Sentry op tag = the CALLER's op, reject → failed +
Sentry. `resolveOwnerEmail.test.ts`: primary pick, primary-id-miss → first address, no
primary id → first address, no addresses → error, Clerk throws → error, empty id → error
without touching Clerk. `sendLeadNotification.test.ts`: rewritten for the new signature —
recipient is the passed owner email and `LEAD_NOTIFICATION_EMAIL` (stubbed to
`founder@lessgo.ai`) appears NOWHERE in the payload; From display name = business name;
hostile business name `Evil" <attacker@evil.com>\r\nBcc: victim@evil.com` produces exactly
two quote chars, no CR/LF, and still ends in our address; 500-char name capped ≤78; default
From address when `LEAD_NOTIFICATION_FROM` unset; bare address when no business name;
no-API-key → skipped; Sentry non-OK; never-throw; legacy no-`to` caller still uses
`LEAD_NOTIFICATION_EMAIL`.

### Deviations from the plan

1. **`to` is optional, not required** (plan: "drops the LEAD_NOTIFICATION_EMAIL
   gate/recipient"). Reason: `src/app/api/demand-lead/route.ts` (two call sites) also calls
   `sendLeadNotification` and is a genuine founder-notify path that has no owner to resolve.
   It is NOT in my Files-touched list, so making `to` required would either break `tsc` or
   require editing an out-of-scope file. Conservative choice: `to?` with a documented
   fallback to `LEAD_NOTIFICATION_EMAIL` used ONLY when no `to` is passed. The forms/submit
   owner path always passes `to`, so `LEAD_NOTIFICATION_EMAIL` is fully retired from that
   path (asserted in a test). No BCC anywhere. If the founder wants demand-lead migrated or
   the env var deleted outright, that is a separate scoped change.
2. **`businessName` optional** — omitted ⇒ bare From address, i.e. byte-identical From for
   the untouched demand-lead caller.
3. **Sentry on the throw path of `sendEmail`** — the old code Sentry'd only non-OK responses.
   The plan says "non-OK/throw", so network rejections are now reported too. Slightly more
   Sentry volume than before.
4. **Sentry inside `resolveOwnerEmail`** rather than in `route.ts` (avoids adding a Sentry
   import to the route).
5. **`next-env.d.ts`** was missing in this fresh worktree (gitignored, normally generated by
   `next dev`/`next build`), which made `npx tsc --noEmit` report an unrelated
   `TS2307 '@/assets/images/founder.jpg'` error in `src/app/page.tsx`. I recreated the
   standard 5-line Next.js stub so the typecheck gate is meaningful. It is gitignored, so it
   does not enter the commit; no tracked file outside the list was touched.

### Out-of-scope breakage — ORCHESTRATOR ACTION REQUIRED

`src/app/api/forms/submit/route.test.ts` is **not** in my Files-touched list, so I did not
edit it. 4 of its 18 tests now fail because of the (planned) route change:

- 3 failures in "notify outcome row flag (F30b)": the test mocks
  `@/lib/email/sendLeadNotification` but not the new `@/lib/email/resolveOwnerEmail`, so the
  real Clerk client runs and throws `Missing Clerk Secret Key` → every case takes the
  `owner email unresolved → notifyError` branch. Fix: add
  `vi.mock('@/lib/email/resolveOwnerEmail', () => ({ resolveOwnerEmail: vi.fn() }))` and
  default it to `{ email: 'owner@example.com' }` in `beforeEach` (plus, ideally, one new case
  pinning "resolve fails ⇒ notifyError written, sendLeadNotification NOT called").
- 1 failure in "scopes the form-config lookup to the page's OWN project": the exact-match
  assertion `select: { content: true }` must become `select: { content: true, title: true }`.

Both are test-harness updates, not product bugs. The plan's Files-touched list simply missed
this file — please authorize it (this phase, or as part of impl-review).

### Test results (verbatim)

```
npm run test:run -- src/lib/email
 Test Files  4 passed (4)
      Tests  27 passed (27)
```

```
npx tsc --noEmit
EXIT=0            (clean; see Deviation 5 about next-env.d.ts)
```

```
npm run test:run -- src/app/api/forms/submit
 Test Files  1 failed (1)
      Tests  4 failed | 14 passed (18)
```
(the 4 failures are the out-of-scope test-file issue documented above)

### Left for later phases

- Visitor auto-reply (`autoReplyTemplate.ts`, `sendVisitorAutoReply.ts`, `MVPForm.autoReply`,
  route wiring) — phase 2. `sendEmail` already accepts the `op` tag it will use.
- Default auto-reply subject/body wording, and the "skip auto-reply when the owner email is
  unresolved" rule — phase 2.
- FormBuilder settings UI — phase 3.

### Risks for the reviewer

- **Env prerequisite:** `LEAD_NOTIFICATION_FROM` must be set to the verified
  `…@mail.lessgo.site` address in Vercel Production AND Preview, otherwise mail goes out as
  `onboarding@resend.dev` (and a From display name on an unverified sender may hurt
  deliverability). `mail.lessgo.site` appears nowhere in `src` by design.
- **Extra Clerk call per form submission** (`users.getUser`) on the hot submit path. It is
  after the row write and fully guarded, but it adds latency and is subject to Clerk rate
  limits under a submission burst. No caching added (not in scope).
- **Clerk outage ⇒ leads still saved but no email**, surfaced only as `notifyError` +
  Sentry — no retry/queue.
- `LEAD_NOTIFICATION_EMAIL` remains live for `/api/demand-lead` (Deviation 1); deleting the
  env var would silently disable those founder notifications.
- Business name comes from `PublishedPage.title` (page title, often SEO-ish) before
  `Project.title`; if a founder's page titles read like headlines, the From display name will
  too. That is the precedent chain the plan specified.

---

## Phase 1 — addendum (orchestrator rulings applied)

The orchestrator authorized the previously out-of-scope test file and accepted the optional-`to`
deviation. Both are now implemented; the counts in the section above are superseded by the
"Final test results" below.

### Additional file changed

- `src/app/api/forms/submit/route.test.ts` (modified — **authorized addition** to Files touched)

### `src/app/api/forms/submit/route.test.ts` — what changed

1. Added `vi.mock('@/lib/email/resolveOwnerEmail', () => ({ resolveOwnerEmail: vi.fn() }))` next
   to the existing `sendLeadNotification` mock, so no real Clerk client is constructed (it throws
   `Missing Clerk Secret Key` in tests). Each of the 3 existing `beforeEach` blocks now sets the
   default `resolveOwner.mockResolvedValue({ email: 'owner@example.com' })`. This restored the 3
   F30b row-flag tests to testing what they were written to test (the `sent` / `failed` /
   `skipped` → row-write mapping) rather than the new Clerk-failure branch.
2. Tightened rather than weakened the project-select assertion. It was an exact match on
   `select: { content: true }`; it is now
   `select: expect.objectContaining({ content: true, title: true })` **plus**
   `expect(Object.keys(select).sort()).toEqual(['content', 'title'])`. The `where: { id: 'proj_1' }`
   security assertion is untouched, and the select is still pinned to an exact 2-key allow-list —
   a future blanket `select` (or a dropped narrowing) still fails the test.
3. New describe block `'/api/forms/submit — owner-email routing (lead-emails phase 1)'` proving the
   new behavior end-to-end at the route level:
   - resolved owner ⇒ `resolveOwnerEmail` called with the DERIVED owner id (`'owner_1'`, not the
     forged body `user_1`), `sendLeadNotification` called once with `to: 'owner@example.com'`,
     `businessName: 'Naayom Farms'` (page title), `replyTo` = visitor email, `pageId`, and
     `notifiedAt` written.
   - page title null ⇒ `businessName` falls back to the project title.
   - project title `'Untitled Project'` ⇒ treated as a non-name ⇒ `businessName: 'Your website'`.
   - resolution failure ⇒ lead row still created with the derived owner, `sendLeadNotification`
     **not** called, `notifyError` written with the resolver's message, `notifiedAt` absent, and
     the visitor still gets `success: true`.

No production code changed as part of this addendum.

### Accepted deviation (recorded per orchestrator ruling 2)

`sendLeadNotification`'s `to` is **optional**; `LEAD_NOTIFICATION_EMAIL` is used as the recipient
**only** when a caller passes no `to`. Rationale: `src/app/api/demand-lead/route.ts` (two call
sites) is a legitimate founder-notify caller with no page owner to resolve, and it is outside this
feature's scope. Consequences recorded:

- The `/api/forms/submit` path is **test-asserted to always pass `to`** — at the unit level
  (`sendLeadNotification.test.ts`: with `LEAD_NOTIFICATION_EMAIL` stubbed to `founder@lessgo.ai`,
  the payload recipient is the owner address and the founder address appears nowhere in the
  serialized payload) and at the route level (`route.test.ts` asserts `notify.mock.calls[0][0].to`
  is the resolved owner email). So the env var is fully retired from the owner path.
- **Migrating or retiring `demand-lead`'s usage of `LEAD_NOTIFICATION_EMAIL` is a separate, scoped
  change.** Until it happens, deleting that env var would silently disable founder demand-lead
  notifications.

### Final test results (verbatim)

```
npx tsc --noEmit
EXIT=0
```

```
npm run test:run -- src/lib/email src/app/api/forms

 Test Files  5 passed (5)
      Tests  49 passed (49)
```

(5 files = `sendEmail.test.ts`, `resolveOwnerEmail.test.ts`, `sendLeadNotification.test.ts`,
`sendBlogPostNotification.test.ts` (untouched, still green), `route.test.ts`. The 4 failures
reported earlier are resolved; `route.test.ts` now has 22 tests, up from 18.)
