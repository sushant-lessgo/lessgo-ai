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

---

## Phase 2 — Visitor auto-reply send path

Branch: `feature/lead-emails` (verified via `git branch --show-current` before any edit).

### Files changed

- `src/types/core/forms.ts` (modified)
- `src/lib/email/autoReplyTemplate.ts` (NEW)
- `src/lib/email/sendVisitorAutoReply.ts` (NEW)
- `src/lib/email/sendVisitorAutoReply.test.ts` (NEW)
- `src/app/api/forms/submit/route.ts` (modified)
- `src/app/api/forms/submit/route.test.ts` (modified)
- `docs/task/lead-emails.audit.md` (this section appended)

Nothing else was touched. (`docs/task/lead-emails.plan.md` shows as modified in
`git status` — that is the orchestrator's own progress-log edit, not mine.)

### Escalation check — saveDraft/loadDraft round-trip (plan step 1)

**Result: NO field whitelist. `autoReply` round-trips. No escalation needed.** Evidence:

- `src/lib/validation.ts:40` — `finalContent: z.unknown().optional()` in `DraftSaveSchema`.
  The whole page payload (which carries `forms`) is unvalidated/unstripped by design; only
  TOP-LEVEL keys are stripped by the schema.
- `src/app/api/saveDraft/route.ts:194-199` — `updatedContent.finalContent = {...existing,
  ...finalContent}`: a shallow spread, no per-key filtering.
- `src/hooks/editStore/persistenceActions.ts:619` — `forms: state.forms || {}` is exported
  wholesale into `finalContent`.
- `src/hooks/editStore/persistenceActions.ts:214-221` — hydration does
  `restoredForms[formId] = { ...form, createdAt, updatedAt }`. Unknown keys ride the spread;
  the only gate is `form.id && Array.isArray(form.fields)` (shape guard, not a whitelist).
- `src/app/api/loadDraft/route.ts:118-120, 150` — `finalContent` is returned whole.

So the phase-3 FormBuilder can persist `autoReply` through the existing `updateForm` →
autosave → reload path with zero persistence changes.

### What changed, per file

**`src/types/core/forms.ts`** — purely additive: new `MVPFormAutoReply { enabled; subject?;
body? }` and `MVPForm.autoReply?`. No existing field changed, so every current form object
still type-checks.

**`src/lib/email/autoReplyTemplate.ts` (NEW)** — pure module, **zero imports** (phase 3
imports it into the `'use client'` FormBuilder). Exports `DEFAULT_AUTO_REPLY_SUBJECT`
(`We received your message`), `DEFAULT_AUTO_REPLY_BODY`
(`Thanks {name} — {business} received your message and will reply soon.`),
`AUTO_REPLY_NAME_MAX_LENGTH = 80`, `escapeHtml`, `sanitizeNameToken`, `renderAutoReply`.
`renderAutoReply` substitutes ONLY `{name}`/`{business}` via two literal regexes — no eval,
no dynamic key lookup, unknown tokens (`{email}`, `{__proto__}`) stay literal; an absent name
removes the token plus its leading space (`Thanks — Acme …`, never a double space).

**`src/lib/email/sendVisitorAutoReply.ts` (NEW)** — `sendVisitorAutoReply({form?, data,
businessName, ownerEmail, fromAddress?}) → EmailSendOutcome`. Recipient = first
`type === 'email'` field → `data[field.id]`, else `data.email`, validated; invalid/absent ⇒
`skipped`. Enabled = `form?.autoReply?.enabled !== false`. `{name}` = first non-email field
whose LABEL matches `/name/i` → else `data.name`, always through `sanitizeNameToken`.
Subject and body both run through `renderAutoReply` (owner text wins, else the defaults).
HTML = paragraph-wrapped, `escapeHtml`'d rendered text (defence in depth). Sends via
`sendEmail` with `op: 'sendVisitorAutoReply'`, `from = buildFromHeader(business, fromAddress)`
(**reused** from `sendLeadNotification` — the display-name/header-injection sanitizer is not
duplicated), `replyTo = ownerEmail`. Wrapped in try/catch: never throws.

**`src/app/api/forms/submit/route.ts`** — (a) `businessName` and a `resolvedOwnerEmail`
holder hoisted just above the existing owner-notification `try` (no logic change to the
notification itself); (b) a NEW `try` block after it calls `sendVisitorAutoReply`, awaited,
outcome `console.log`-ed only — **no DB column written** (Decision 4); (c) when the owner
email did not resolve, the auto-reply is skipped with a warn (no Reply-To target); (d) a new
`autoReplyForm` lookup beside the existing `formConfig` read (see Deviation 2). The email
work still sits strictly after `formSubmission.create`.

**`src/app/api/forms/submit/route.test.ts`** — added the `sendVisitorAutoReply` mock (+ a
`{status:'skipped'}` default in all four existing `beforeEach` blocks so pre-existing tests
keep exercising their own subject), extended the phase-1 "owner unresolved" test with
`expect(autoReply).not.toHaveBeenCalled()`, and added a `visitor auto-reply wiring` describe:
args passed (data/businessName/ownerEmail), config read from `finalContent.forms`, config
read from legacy top-level `content.forms`, no config ⇒ `form: null`, auto-reply failure
writes NO row flag, a THROWING auto-reply still returns 200 with the owner notification sent,
and call ORDER (owner before visitor).

### Deviations from the plan / decisions taken

1. **`sanitizeNameToken` DELETES markup characters (`< > " ' \` \\` and `{ }`) instead of
   entity-escaping them.** The plan said "HTML-escape". Deleting is strictly stronger (nothing
   tag-shaped can exist in EITHER the text or the HTML part even if a future caller forgets to
   escape) and it stops the 80-char cap from ever slicing an HTML entity in half; the plain-text
   part also stays readable instead of showing `&lt;script&gt;`. `escapeHtml` is still applied
   to the whole body when building the HTML part.
2. **⚠️ `autoReply` config is read from `content.finalContent.forms[formId]` as well as the
   pre-existing `content.forms[formId]` — REVIEWER PLEASE SCRUTINIZE.** While wiring step 4 I
   found that the route's existing form-config lookup (`route.ts`, `const forms =
   (content as any).forms`) reads a level that **modern projects do not use**: the editor
   exports forms INSIDE `finalContent` (`persistenceActions.ts:619`), and `saveDraft` stores
   that at `Project.content.finalContent`. Top-level `content.forms` only exists for legacy
   pre-`finalContent` projects. Consequence for phase 2: had I followed the plan literally,
   `formConfig` would be `null` for essentially every current site, so the phase-3 settings UI
   would write config the send path never reads (silent no-op feature).
   Conservative in-scope fix: a SEPARATE `autoReplyForm` variable that falls back to the
   nested location, used only by the auto-reply. I deliberately did **not** widen `formConfig`
   itself — that would change `formName` on stored leads and start firing ConvertKit
   integrations that do not fire today (out of scope, and security-adjacent). **The
   pre-existing bug is left in place and is worth its own ticket** (it also means the owner
   notification's `fields` labels and `formName` are usually missing today).
3. **Local `isValidEmail`.** The plan said reuse "the existing `isValidEmail`", but it is a
   private function inside `sendLeadNotification.ts`, which is NOT in this phase's
   Files-touched list. Rather than edit an out-of-scope file to export it, the same 1-line
   regex predicate is defined locally in `sendVisitorAutoReply.ts` with a comment. (The
   From-header sanitizer WAS reused — `buildFromHeader` was already exported in phase 1.)
4. **Typed-email-field pick does not fall back.** If a form declares an email field but its
   submitted value is missing/invalid, the outcome is `skipped` (no fall back to `data.email`)
   — literal reading of Decision 3 + "invalid ⇒ skipped".
5. **Link stripping is over-eager** (any `word.tld`-shaped token is removed, so `j.smith`
   becomes empty). Chosen deliberately: a mangled first name is cheaper than our verified
   sending domain relaying a spam link.
6. **Reply-To validation:** an invalid `ownerEmail` is dropped rather than sent (test-pinned).
   The route already guarantees a resolved address, so this is belt-and-braces.

### Test results (verbatim)

```
npx tsc --noEmit
EXIT=0
```

```
npm run test:run -- src/lib/email src/app/api/forms

 Test Files  6 passed (6)
      Tests  86 passed (86)
```

(6 files: `sendEmail`, `resolveOwnerEmail`, `sendLeadNotification`, `sendBlogPostNotification`,
the new `sendVisitorAutoReply` (30 tests), and `route.test.ts` (now 29, up from 22).)

**Mutation check (anti-inert-test verification).** `sanitizeNameToken` was temporarily
neutered to `return raw` and the suite re-run: **7 tests failed** — all four hostile-input
cases (script markup, links, newlines, 500-char cap), the `{business}` re-expansion case and
both pure-helper cases. Restored afterwards and re-run green. The Decision-7 tests assert the
ABSENCE of hostile substrings in the serialized Resend payload, not merely that a send
happened.

### Left for phase 3

- FormBuilder "Auto-reply email" section (enable toggle + subject/body inputs, placeholdered
  with `DEFAULT_AUTO_REPLY_SUBJECT`/`DEFAULT_AUTO_REPLY_BODY` imported from the pure
  `autoReplyTemplate.ts` — do NOT import `sendVisitorAutoReply`/`sendEmail` there).
- Persistence needs no work (see the round-trip evidence above).

### Risks for the reviewer

- **Deviation 2 is the one to check.** If the reviewer disagrees with the dual-location read,
  the alternative is a separate ticket to fix the lookup level for the whole route — but then
  the auto-reply settings UI is a no-op until that lands.
- **Auto-reply outcome is log-only.** A silently failing auto-reply is visible in Sentry
  (`op: 'sendVisitorAutoReply'`) and server logs, but nowhere in the product. Accepted per
  Decision 4 (no schema change).
- **Second outbound send per submission** on the hot path: submits now await two Resend calls
  sequentially after the row write. Both are guarded and never block the 200, but p95 latency
  of `/api/forms/submit` grows. Not parallelized (kept simple + ordered: owner first).
- **Retro-behavior (Decision 2):** editing a draft form's auto-reply text changes live
  behavior for already-published pages immediately.
- **Business name double duty:** it lands both in the From display name and in the
  `{business}` body token, so a headline-ish page title reads oddly in the visitor's email.
- **Sender reputation:** the auto-reply is mail to a stranger from our shared domain. If
  `LEAD_NOTIFICATION_FROM` is not the verified `…@mail.lessgo.site`, these will land in spam
  (or bounce) at a higher rate than the owner notification did.

---

## Phase 3 — FormBuilder auto-reply settings UI

Branch: `feature/lead-emails` (verified via `git branch --show-current` before any edit).

### Files changed

- `src/components/forms/FormBuilder.tsx` (modified)
- `src/components/forms/FormBuilder.test.tsx` (modified)
- `docs/task/lead-emails.audit.md` (this section appended)

Nothing else was touched. (`docs/task/lead-emails.plan.md` shows modified in `git status` —
that is the orchestrator's progress-log edit, not mine.) No edits to
`src/types/store/formActions.ts`, `src/stores/*`, `src/hooks/editStore*`; no rename of the
`addForm`/`createForm` pair.

### What changed, per file

**`src/components/forms/FormBuilder.tsx`**

1. Imports: added the `MVPFormAutoReply` type and `DEFAULT_AUTO_REPLY_SUBJECT` /
   `DEFAULT_AUTO_REPLY_BODY` from `@/lib/email/autoReplyTemplate`, with a comment pinning WHY
   that import is legal (pure zero-import module) and naming the three modules that must never
   be imported here (`sendVisitorAutoReply` / `sendEmail` / `resolveOwnerEmail`).
2. Edit-load effect: `autoReply: existingForm.autoReply ? {...existingForm.autoReply} : undefined`
   (shallow clone, same idiom as `fields`/`integrations`); the new-form/reset branch sets
   `autoReply: undefined` so a stale draft cannot leak across opens.
3. New `handleUpdateAutoReply(updates: Partial<MVPFormAutoReply>)` — local-draft only
   (`setFormData(prev => ...)`), no store write. Base object is
   `{ enabled: prev.autoReply?.enabled !== false, ...(prev.autoReply ?? {}), ...updates }`, so the
   FIRST write (e.g. the owner just types a subject) records `enabled: true` rather than
   accidentally minting a config with a falsy `enabled`.
4. Derived `autoReplyEnabled = formData.autoReply?.enabled !== false` — mirrors the server's
   `form?.autoReply?.enabled !== false` exactly.
5. New "Auto-reply email" section rendered immediately after the Success Message block (plan
   precedent `:311-320`), using the modal's existing primitives only: a bordered
   `border rounded-lg p-4 bg-gray-50` card (same idiom as the field/integration rows), the plain
   `<input type="checkbox" className="rounded" />` + `Label` pattern used by "Required field" and
   the integration enable toggles, `Input` for Subject, `Textarea rows={3}` for Message. No new
   visual pattern, no new dependency, no Radix Switch introduced.
   - Placeholders are the shipped defaults, so the UI can never promise wording the send path
     does not use.
   - Helper text documents that `{name}` and `{business}` are the only tokens, and that leaving
     both boxes empty uses the default wording.
   - When the toggle is off, Subject/Body are `disabled` AND greyed
     (`bg-gray-100 text-gray-400`, labels `text-gray-400`) and a reason line
     (`data-testid="auto-reply-disabled-reason"`) states that visitors get no confirmation email —
     greyed-with-a-why, never silently hidden.
   - Test ids added: `auto-reply-section`, `auto-reply-enabled`, `auto-reply-subject`,
     `auto-reply-body`, `auto-reply-disabled-reason`.
   - Persistence rides the untouched `handleSave` → `updateForm(editingFormId, formData)` path.

**`src/components/forms/FormBuilder.test.tsx`** — additive only; the 11 existing tests are
unmodified and still pass. Added three helpers (`typeInto` — native value setter + `input` event,
the repo's no-testing-library convention; `q(testid)`; `clickSave()`) and a new describe block
`FormBuilder — visitor auto-reply settings` (6 tests) against the REAL store:

1. defaults — section renders, toggle checked with an ABSENT config, both inputs empty and
   enabled, placeholders `toBe` the imported constants, section text contains `{name}` and
   `{business}`.
2. saved config re-opens with the owner's subject/body/toggle state.
3. toggle off ⇒ both inputs `disabled`, both carry `text-gray-400`, reason line present, store
   still `undefined` BEFORE Save (local-draft model), and after Save the store holds
   `{enabled: false}`.
4. edited subject + body ⇒ asserts the EXACT payload handed to `updateForm` (captured by
   replacing the action with a wrapper that still calls the real one) **and** the committed store
   state; also asserts nothing was written pre-Save.
5. untouched section ⇒ `autoReply` stays ABSENT after Save (absent = ON by default; this pins
   that we never mint a stray/false config).
6. re-enabling a disabled config clears `enabled:false` and keeps the existing text.

### Decisions / assumptions (in-scope judgment calls)

1. **Absent means absent.** Saving without touching the section leaves `autoReply` undefined
   rather than writing `{enabled:true}`. Conservative: matches the server default and avoids
   rewriting every existing form's JSON on an unrelated save. Pinned by test 5.
2. **`enabled` is stored as a real boolean on first touch** (typing only a subject yields
   `{enabled:true, subject}`) — required because `MVPFormAutoReply.enabled` is non-optional.
3. **Plain checkbox, not a Switch.** `components/ui` has no Switch in use in this modal; the two
   existing toggles here are plain checkboxes. Matching them satisfies "use the modal's existing
   primitives / don't invent a visual pattern".
4. **Section placement is literally "after Success Message"** per the plan, which puts it above
   the "Start from a template" picker. Consequence: `handleLoadTemplate` (unchanged) resets the
   whole draft, so it also clears an untouched-form auto-reply draft. Left as-is — it already
   resets name/fields/successMessage, so this is consistent, and the picker only appears for a
   NEW form. Flagged here rather than silently "fixed", since it touches existing behaviour.
5. **No validation added** on subject/body (e.g. unknown-token warnings). `renderAutoReply`
   leaves unknown tokens literal by design; adding lint-y validation was not in scope.

### Verification (verbatim)

```
npx tsc --noEmit
EXIT=0
```

```
npm run lint
EXIT=0
```
(only pre-existing `@next/next/no-img-element` + one `react-hooks/exhaustive-deps` warning
across template/provider files; grepping the full lint output for `FormBuilder` and for `Error:`
returns NOTHING. No bare `useEditStore()` introduced — the file still uses
`useEditStore((s) => s.forms)` + `useEditStoreApi()` exactly as before.)

```
npm run test:run -- src/components/forms src/lib/email src/app/api/forms

 Test Files  7 passed (7)
      Tests  103 passed (103)
```
(7 files: `FormBuilder.test.tsx` — now 17 tests, up from 11 — plus the 6 phase-1/2 email +
route files, all still green.)

**Mutation check (anti-inert-test verification).** Two mutations were applied and reverted:

- `handleSave` → `updateForm(id, {...formData, autoReply: undefined})` (the exact "field never
  reaches `updateForm`" bug the brief warns about): **3 tests failed** (toggle-off save,
  subject/body round-trip, re-enable).
- `autoReplyEnabled` → `formData.autoReply?.enabled === true` (server default inverted):
  **2 tests failed** (defaults, re-enable).

Suite re-run green after reverting both.

### For the whole-diff reviewer to scrutinize

- **Client-boundary import.** `FormBuilder.tsx` (`'use client'`) now imports
  `@/lib/email/autoReplyTemplate`. That module is deliberately zero-import; if anyone later adds
  a Sentry/logger/prisma import to it, server code enters the client bundle. There is no
  automated guard on that property — only the comments in both files.
- **`handleUpdateAutoReply` spread order** — `{enabled: default, ...prev.autoReply, ...updates}`.
  Correct today because `prev.autoReply` never carries `enabled: undefined`, but a future writer
  that sets `enabled: undefined` explicitly would defeat the default.
- **Decision 2 (settled) still applies:** these edits change LIVE auto-reply behaviour for
  already-published pages as soon as the draft is autosaved — no publish required, and no UI here
  says so.
- **Phase-2 Deviation 2 dependency:** this UI writes into
  `Project.content.finalContent.forms[id].autoReply`; the send path only sees it because phase 2
  added the nested-location lookup. If that dual-location read is reverted at review, this
  settings UI becomes a silent no-op.
- **Test-only store mutation:** the round-trip test swaps `updateForm` on the real store via
  `store.setState({updateForm: wrapper})` to capture arguments. It calls through to the real
  action, and the same test also asserts the resulting store state, so it is not a
  mock-only assertion — but it is the one place the tests reach into store internals.
- Founder gate still owed (plan): preview end-to-end — custom text arrives in a real inbox,
  toggle-off actually stops the auto-reply, owner notification unaffected.
