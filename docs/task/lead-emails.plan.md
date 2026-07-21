# lead-emails — implementation plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\lead-emails`
- **Branch:** `feature/lead-emails`
- **Tier:** standard (no plan-review loop; per-phase implement, ONE impl-review over the whole diff at the end)
- **Spec:** `docs/task/lead-emails.spec.md` (⚠️ untracked on main, NOT present in this worktree — orchestrator should copy/commit it in before implement so agents can read it)

## Overview

Re-route the lead-notification email from the single founder inbox (`LEAD_NOTIFICATION_EMAIL`) to each page owner's Clerk primary email, and add a visitor auto-reply (ON by default, owner-editable per form). Both emails share one never-throw Resend send helper, are sent from `"{Business Name}" <…@mail.lessgo.site>` (address via env), and never block or lose the lead row. No prisma schema change; auto-reply config lives in the form definition inside `Project.content.forms[formId]`, read server-side at submit time.

## Progress log

- phase 1 owner-notification re-routing: pending
- phase 2 visitor auto-reply send path: pending
- phase 3 FormBuilder auto-reply settings UI: pending

## Decisions (settled — do not re-open during implement)

1. **UI surface = `FormBuilder.tsx` modal**, NOT a form toolbar. Deviation from the spec's "form toolbar → settings" wording: founder ruling 8 (recorded in `src/modules/.../toolbars/actionSets.tsx:63-74`) deleted the unreachable `form` toolbar entry and forbids re-adding it without a DOM affordance. FormBuilder is the reachable per-form settings modal and already hosts `successMessage`/`submitButtonText`.
2. **Auto-reply config read live from `Project.content.forms[formId]` at submit time** (existing architecture, `route.ts:163-179`). Accepted consequence: draft edits retro-change live auto-reply behavior for already-published pages. No publish-time snapshot.
3. **Visitor email pick:** FIRST field with `type === 'email'` (by `fields` order) → `data[field.id]`, validated with existing `isValidEmail`. Fallback `data.email` when no typed email field / no form config (back-compat with today's hardcoded read + frozen form.v1). No/invalid email → auto-reply outcome `skipped`, silently.
4. **NO prisma schema change.** Auto-reply outcome is logged + Sentry-tagged only; `notifiedAt`/`notifyError` keep their owner-notification meaning.
5. **Env gating:** owner notification gated on `RESEND_API_KEY` present + owner email successfully resolved. `LEAD_NOTIFICATION_EMAIL` retired as recipient AND as gate — it becomes unused by this path (left in env docs as dead; not a fallback). Unconfigured envs (no `RESEND_API_KEY`) still send nothing → `skipped`.
6. **Clerk lookup failure ⇒ owner-notification outcome `'failed'`** (Sentry'd, `notifyError` written); lead row always saved; nothing throws into the submit path.
7. **Anti-spam-relay:** visitor-typed content NEVER enters the auto-reply body. Body = owner-set/default template with ONLY `{name}`/`{business}` substituted; `{name}` is visitor-typed → HTML-escaped, newline-stripped, URL-stripped, length-capped (~80 chars). Dedicated verification item.
8. **Shared send path:** new low-level `sendEmail()` in `src/lib/email/`; `sendLeadNotification` refactored onto it. `sendBlogPostNotification.ts` untouched (out of scope).
9. **Rate limiting: already exists** — `withFormRateLimit` wraps the route (`route.ts:383`, preset 10 req/60s per IP, `src/lib/rateLimit.ts:57-61`) plus per-owner monthly cap. Do NOT add another throttle. Known limitation: in-memory Map store = per-instance only (see Risks).
10. **Business name** = `PublishedPage.title` → `Project.title` → `'Your website'` (reuse the precedent chain from `src/app/api/leads/[id]/draft-reply/route.ts:202-216`; `Project.title` default `"Untitled Project"` is a weak but acceptable fallback). Display name is owner-typed → strip quotes/newlines before use in the From header (header-injection guard).

---

## Phase 1 — Owner-notification re-routing (Clerk email, business-name From)

**Goal:** every lead email goes to the page owner's Clerk primary email with `From: "{Business Name}" <env-address>`; no UI; independently shippable → unblocks Kundius handover.

**Files touched**
- `src/lib/email/sendEmail.ts` — NEW: low-level Resend send helper
- `src/lib/email/resolveOwnerEmail.ts` — NEW: Clerk primary-email lookup
- `src/lib/email/sendLeadNotification.ts` — refactor onto `sendEmail`, new recipient/From params
- `src/lib/email/sendLeadNotification.test.ts` — extend
- `src/lib/email/sendEmail.test.ts` — NEW
- `src/lib/email/resolveOwnerEmail.test.ts` — NEW
- `src/app/api/forms/submit/route.ts` — resolve owner email + business name, pass through

**Steps**
1. `sendEmail.ts`: extract the direct `fetch('https://api.resend.com/emails')` logic from `sendLeadNotification.ts` into `sendEmail({to, from, replyTo?, subject, text, html, op}) → EmailSendOutcome` (`skipped | sent | failed{error}` union, same shape as today's `LeadNotifyOutcome`). Contract: never throws; `skipped` when `RESEND_API_KEY` absent; Sentry `captureException` on non-OK/throw with tags `{area:'email', op}` (op passed per caller, e.g. `'sendLeadNotification'`, keeping today's tag values). Keep direct fetch — do NOT add the `resend` npm package.
2. `resolveOwnerEmail.ts`: `resolveOwnerEmail(clerkUserId) → {email: string} | {error: string}`. v6 pattern: `import { clerkClient } from '@clerk/nextjs/server'` → `(await clerkClient()).users.getUser(id)` → pick `emailAddresses` entry matching `primaryEmailAddressId` (fallback: first email address; none → error). Never throws; catches → `{error}`.
3. `sendLeadNotification.ts`: signature gains `to` (resolved owner email) and `businessName`; drops the `LEAD_NOTIFICATION_EMAIL` gate/recipient. From = `"{sanitized businessName}" <${LEAD_NOTIFICATION_FROM || 'onboarding@resend.dev'}>` (address stays env-driven; prod/preview must set it to the verified `…@mail.lessgo.site`). Keep: Reply-To = visitor email if `isValidEmail`, existing subject/body rendering, outcome union, never-throw. Delegate the actual send to `sendEmail`. Sanitize display name: strip `"`/newlines, cap length.
4. `route.ts`: after `ownerUserId` derivation (L104), add `title` to the existing `publishedPage.findUnique` select and `title` to the existing project select (L163-179) — no new queries. After the `formSubmission.create` (keeping email strictly post-row-write, current L284 position): call `resolveOwnerEmail(ownerUserId)`; on `{error}` → treat as outcome `failed` (write `notifyError`, Sentry via existing path), skip send; on success → `sendLeadNotification({..., to, businessName})` and write `notifiedAt`/`notifyError` exactly as today (L292-302). Body `userId` stays accepted-and-ignored.
5. Tests — `sendEmail.test.ts`: env-gate skipped, sent (assert URL/method/Authorization/payload `to/from/reply_to`), failed + Sentry tags (mirror existing patterns: `vi.mock('@sentry/nextjs')`, `vi.stubGlobal('fetch')`, `vi.stubEnv`). `resolveOwnerEmail.test.ts`: mock `@clerk/nextjs/server`; primary-email pick, primary-id miss → first-email fallback, no-emails → error, thrown → error. `sendLeadNotification.test.ts`: update for new signature — recipient = passed owner email (NOT `LEAD_NOTIFICATION_EMAIL`), From display name = business name, display-name sanitization, no-RESEND_API_KEY → skipped, never-throw preserved.

**Verification**
- `npx tsc --noEmit`
- `npm run test:run -- src/lib/email` (all email tests green)
- Manual (dev): submit a form on a dev-published page with `RESEND_API_KEY` unset → lead row saved, outcome `skipped`, no crash.

**HUMAN GATE (decision gate, per spec):** live send on preview/prod — real form submit lands in the OWNER's actual inbox (Clerk email), From shows business name + `mail.lessgo.site` address (`LEAD_NOTIFICATION_FROM` env set in Vercel), Reply-To = visitor. A second owner's site reaches THAT owner. Founder sign-off before phase 2 relies on the shared send path.

---

## Phase 2 — Visitor auto-reply send path (default template, no UI)

**Goal:** valid visitor email ⇒ confirmation email with the default template (`Thanks {name} — {business} received your message and will reply soon`), ON by default, config-driven from `Project.content.forms[formId].autoReply` when present; Reply-To = owner email.

**Files touched**
- `src/types/core/forms.ts` — add `MVPFormAutoReply` + optional `autoReply?` on `MVPForm`
- `src/lib/email/autoReplyTemplate.ts` — NEW: pure constants/helpers (client-safe)
- `src/lib/email/sendVisitorAutoReply.ts` — NEW: pick/render/send
- `src/lib/email/sendVisitorAutoReply.test.ts` — NEW
- `src/app/api/forms/submit/route.ts` — read `autoReply` config, call send after owner notification

**Steps**
1. `src/types/core/forms.ts`: `interface MVPFormAutoReply { enabled: boolean; subject?: string; body?: string }`; `MVPForm.autoReply?: MVPFormAutoReply`. Optional field ⇒ NO editStore/persistence edits needed — VERIFIED: `updateForm(id, Partial<MVPForm>)` spread-merges (`src/hooks/editStore/formActions.ts:29-40`) and hydration passes form objects through wholesale (`persistenceActions.ts:206-232`). Implementer must CONFIRM (read-only) that saveDraft/loadDraft round-trips unknown form keys — no field whitelist strips `autoReply`. If a whitelist exists, stop and report (files-touched escalation).
2. `autoReplyTemplate.ts`: PURE module, zero imports (will be imported by the client FormBuilder in phase 3 — must not pull Sentry/fetch/server code). Exports: `DEFAULT_AUTO_REPLY_SUBJECT` (proposed: `We received your message`), `DEFAULT_AUTO_REPLY_BODY` (`Thanks {name} — {business} received your message and will reply soon.`), `sanitizeNameToken(raw)` (HTML-escape, strip newlines, strip URL-looking substrings, cap ~80 chars), `renderAutoReply(template, {name?, business})` (substitute ONLY `{name}`/`{business}`; absent name → collapse gracefully to `Thanks — …`; unknown `{tokens}` left literal — no eval, no other substitution).
3. `sendVisitorAutoReply.ts`: `sendVisitorAutoReply({form?, data, businessName, ownerEmail, fromAddress}) → EmailSendOutcome`.
   - Recipient: first `form.fields` entry with `type === 'email'` → `data[field.id]`; else `data.email`; validate with `isValidEmail`; invalid/absent → `skipped`.
   - Enabled: `form?.autoReply?.enabled !== false` (absent config = ON, per spec).
   - `{name}`: first field whose label matches `/name/i` → `sanitizeNameToken(data[field.id])`; else fallback `data.name` sanitized; else omit.
   - Body/subject: `form?.autoReply?.body || DEFAULT_AUTO_REPLY_BODY` (same for subject) → `renderAutoReply`. Owner body is trusted-ish (owner-typed) but still rendered as text + minimal HTML paragraph wrapping — NO visitor data beyond the sanitized `{name}` token. Plain tasteful markup only.
   - Send via `sendEmail` with `op: 'sendVisitorAutoReply'`, From = same `"{business}" <fromAddress>` builder as phase 1, Reply-To = `ownerEmail`.
4. `route.ts`: read `formConfig?.autoReply` right beside the integrations consumption (L181-215 region — the documented precedent for server-read config). After the owner-notification block: if owner email resolved earlier, call `sendVisitorAutoReply` (await, never-throw); log outcome (`logger` + rely on `sendEmail`'s Sentry on fail); do NOT write any DB column for it. If owner email resolution failed → still attempt auto-reply? NO — skip (`skipped`, reason logged): without an owner Reply-To the visitor reply would black-hole; keep coupling simple. Note in code comment.
5. `sendVisitorAutoReply.test.ts`: email-field pick (typed field beats `data.email`; multi-email-field → first; fallback path; invalid → skipped), ON-by-default vs `enabled:false` → skipped, default + custom template rendering, `{name}` sanitization (script tags, URLs, newlines, 500-char name), no-name collapse, Reply-To = owner, never-throw, Sentry op tag. Sanitization tests are the decision-7 verification item — mutate-style asserts (feed hostile input, assert absence in payload), not presence-only.

**Verification**
- `npx tsc --noEmit`
- `npm run test:run -- src/lib/email`
- Manual (dev, `RESEND_API_KEY` unset): submit with an email field → both outcomes `skipped`, lead saved; submit with hostile `{name}` input → payload log shows sanitized text.

---

## Phase 3 — FormBuilder auto-reply settings UI

**Goal:** per-form enable toggle + editable auto-reply text (subject + body) in the existing FormBuilder modal, persisted into `MVPForm.autoReply` via the existing local-draft → `updateForm` save flow.

**Files touched**
- `src/components/forms/FormBuilder.tsx` — add "Auto-reply email" section
- `src/components/forms/FormBuilder.test.tsx` — extend

**Steps**
1. Add an "Auto-reply email" block after the Success Message section (`FormBuilder.tsx:311-320` precedent), using the modal's existing primitives (`Label`, `Input`, `Textarea`, checkbox/switch already in `components/ui`): enabled toggle (checked when `formData.autoReply?.enabled !== false` — mirrors server ON-by-default), subject `Input` + body `Textarea` placeholder'd with `DEFAULT_AUTO_REPLY_SUBJECT`/`DEFAULT_AUTO_REPLY_BODY` from `autoReplyTemplate.ts` (client-safe pure module — do NOT import `sendVisitorAutoReply`/`sendEmail` into this `'use client'` file), helper text documenting `{name}`/`{business}` tokens. Disable subject/body inputs (greyed) when toggle off.
2. Wire edits into the LOCAL `formData` draft only (`setFormData(prev => ({...prev, autoReply: {...}}))`) — same pattern as every other field; existing `handleSave` → `updateForm` persists it (verified merge, no store changes). Do NOT write to the store mid-draft (documented desync landmine, `FormBuilder.tsx:217-235` comment).
3. Do NOT touch `src/types/store/formActions.ts` (known-stale parallel interface; reconciling it is its own spec per the in-file warning) and do NOT rename the `addForm`/`createForm` pair — existing save flow works today.
4. `FormBuilder.test.tsx`: section renders with defaults, toggle off greys inputs + saves `enabled:false`, edited body round-trips through Save (assert `updateForm` called with `autoReply` payload), existing tests stay green.

**Verification**
- `npx tsc --noEmit`
- `npm run lint` (this is a `'use client'` file — confirm no banned bare `useEditStore()` introduced; existing selector/API usage kept)
- `npm run test:run -- src/components/forms`
- Manual (dev): edit a form → set custom text → save → reopen shows it; submit on dev shows the custom body in the (skipped-send) log path.

**HUMAN GATE (final, pre-merge):** founder end-to-end on preview: custom auto-reply text arrives in a real inbox, disable toggle actually stops the auto-reply, owner notification unaffected. Merge to main is itself a human gate per branch rules.

---

## Risk / escalation

- **No escalation-surface files planned**: no `prisma/schema.prisma`, no `src/stores/*`, no `src/hooks/editStore*` edits, no `.published.tsx`, no `src/modules/generatedLanding/`, no publish/staticExport, no billing libs. `src/types/core/forms.ts` (phase 2) is shared by editor + route but is a pure additive optional field.
- **Conditional escalation trigger:** if phase-2 step 1's saveDraft/loadDraft round-trip check finds a field whitelist stripping `autoReply`, persistence code would need edits → STOP, report to orchestrator (tier re-check) before touching `src/hooks/editStore/persistenceActions.ts` or `saveDraft` route.

## Risks / open items

- **Spec file missing from worktree** (untracked on main) — orchestrator to copy it in before implement.
- **Rate limiting is per-instance** (in-memory Map, `rateLimit.ts:35`): a multi-instance deploy multiplies the 10/60s IP budget. Accepted known limitation; monthly per-owner cap backstops volume. Not fixed here.
- **Env prerequisite:** `LEAD_NOTIFICATION_FROM` must be set to the verified `…@mail.lessgo.site` address in Vercel (Production AND Preview) before the phase-1 gate; otherwise sends go out as `onboarding@resend.dev`. `mail.lessgo.site` appears nowhere in src — env-only by design.
- **Clerk email quality:** owner's primary email may be unverified; Resend will still send. Missing email entirely → `failed` outcome (visible in `notifyError`).
- **Header injection:** business name (owner-typed title) enters the From display name → sanitized (quotes/newlines stripped) in phases 1/2; unit-tested.
- **Retro-behavior:** draft form edits change live auto-reply for published pages immediately (Decision 2, accepted).
- **Old blobs:** frozen form.v1/v2 payloads carry no config → typed-email-field pick falls back to `data.email`; both emails still fire without republish (acceptance criterion; covered by fallback unit tests + founder QA).
- **`LEAD_NOTIFICATION_EMAIL` retirement:** after phase 1 the env var is dead on this path. Founder may want it as BCC — currently NOT implemented (Decision 5 says not required).

## QA split

**Automated (lands in this feature):** send-helper env gating + payload shape + Sentry tags; Clerk resolution outcomes; recipient/From/Reply-To assembly; email-field pick incl. fallbacks; `{name}` sanitization (hostile-input asserts); ON-by-default/disable logic; FormBuilder round-trip; never-throw contracts. `tsc` + `test:run` green per phase.

**Founder manual (cannot automate — no real email in CI):**
1. Phase-1 gate: real Resend send on preview/prod → owner inbox delivery, From display name + `mail.lessgo.site`, Reply-To=visitor, second-owner isolation.
2. Vercel env check: `RESEND_API_KEY` + `LEAD_NOTIFICATION_FROM` present in Production + Preview; Resend domain `mail.lessgo.site` verified.
3. Final gate: auto-reply inbox delivery (incl. spam-folder check), custom text, disable toggle, old published page (frozen form.v1) submit fires both emails, Kundius site handover smoke.

## Unresolved questions

1. From local-part: fixed `leads@mail.lessgo.site` ok, or per-site slug?
2. Keep `LEAD_NOTIFICATION_EMAIL` as founder BCC, or fully retire (plan = retire)?
3. Default auto-reply subject text: "We received your message" ok?
4. Weak fallback business name `'Your website'` acceptable when both titles missing?
5. Auto-reply skipped when owner email unresolved (no Reply-To target) — agree?
