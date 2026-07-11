# F30b audit — lead-notification failure now flagged on the FormSubmission row

## Files changed
- `prisma/schema.prisma` — added `notifiedAt DateTime?` + `notifyError String?` to `FormSubmission`.
- `src/lib/email/sendLeadNotification.ts` — helper now returns a `LeadNotifyOutcome` (`skipped` | `sent` | `failed`).
- `src/app/api/forms/submit/route.ts` — persists the notify outcome to the row after the send.
- `src/components/dashboard/FormSubmissionsTable.tsx` — "email failed" chip on rows with `notifyError`.
- `src/lib/email/sendLeadNotification.test.ts` — updated to assert the new outcome return values.
- `src/app/api/forms/submit/route.test.ts` — NEW; pins the row-flag write per outcome.

## What changed, per file

**prisma/schema.prisma** — two nullable columns on `FormSubmission`. `notifiedAt` = when the email
was accepted by Resend; `notifyError` = short failure reason. Both null when the feature is
unconfigured (skipped).

**sendLeadNotification.ts** — previously `Promise<void>`, swallowing every result. Now returns:
`{status:'skipped'}` (env unset), `{status:'sent'}` (Resend `ok`), `{status:'failed', error}`
(non-OK response → `"Resend responded <status>"`; network throw → `"send failed: <msg>"`). Error
strings are `.slice(0,300)`. Sentry capture (the already-landed half) is unchanged; the helper still
never throws.

**forms/submit/route.ts** — the send was already `await`ed inside a try/catch before the response
(not fire-and-forget), so I used await-then-update: `sent` → `formSubmission.update{notifiedAt: now}`,
`failed` → `update{notifyError}`, `skipped` → no write. The whole block is wrapped so a failed
status-write logs and never 500s a saved lead. Submitter success stays independent of email success.

**FormSubmissionsTable.tsx** — added `notifyError?` to the row type and a small amber chip
(`MailWarning` icon + "email failed") in the Submitted cell, `title` = the error. Matches existing
dashboard chip idioms; no new page.

## Deviations from the plan
- **Migration NOT generated — STOP condition hit.** `npx prisma migrate dev --name
  add_form_submission_notify_fields` aborted at **drift detection**: a parallel agent's
  `20260710105655_social_posts` migration (SocialPost table, UserPlan.socialPostsLimit) is applied to
  the shared Neon dev DB but absent from this worktree's local migrations dir. migrate dev proposed
  `prisma migrate reset` (data loss). Per instructions I did NOT reset/force and did NOT create the
  migration. No migration folder was written; only `schema.prisma` is modified. **The migration for
  these two columns still needs to be generated once the drift is resolved** (e.g. after the
  social-posts migration is merged into this branch's migrations, or on a clean dev DB).
- `prisma generate` also hit a transient `EPERM` on the query-engine DLL (locked by a parallel
  process), but it had already written the updated client **types** (`.prisma/client/index.d.ts`
  contains `notifyError`), so tsc is green. The DLL is runtime-only; regenerate before running the
  app.
- Truncation chosen at 300 chars (matches the existing Sentry `body.slice(0,300)` in the same file);
  logged here as an in-scope judgment call.

## Test results
- `npx vitest run src/lib/email/sendLeadNotification.test.ts src/app/api/forms/submit/route.test.ts`
  → **10 passed**. Covers: skipped/sent/failed outcomes from the helper; route writes `notifiedAt` on
  sent, `notifyError` on failed, nothing on skipped; submitter still gets `success:true` when the
  email fails; route still 200s if the status-write itself throws.
- `npx tsc --noEmit` → **0 errors**.

## Open risks
- **Migration is unshipped.** Until the column migration is created and deployed, the runtime prisma
  client (once regenerated against the schema) will reference columns the prod/dev DB may not have.
  The generated *types* exist, so code compiles, but a real write to `notifiedAt`/`notifyError` will
  fail until the DB has the columns. Do not merge/deploy before the migration lands.
- Blog-post notification (`sendBlogPostNotification`) intentionally NOT row-flagged — no equivalent
  row; Sentry half already covers it (out of scope, per task).
