---
tier: standard
tier-why: bounded — email lib + forms/submit route + form-settings UI; no schema, no risky surface (publish/staticExport untouched; submit route extended, not restructured)
---

# lead-emails — spec

## Problem / why
`sendLeadNotification` sends every lead from every published site to ONE fixed env inbox (`LEAD_NOTIFICATION_EMAIL`) — the founder's. Before-customer-2 debt; blocks Kundius handover (her leads must reach her). And visitors get no confirmation email at all after submitting — owners will demand it ("what goes to my leads" = #1 ask).

## Goal
Two emails, correctly routed: (1) **owner notification** — new lead goes to the site OWNER's email, resolved automatically; (2) **visitor auto-reply** — the lead gets a confirmation email whose text the owner controls per form. Kundius handover unblocked: her leads reach her, her leads hear back from her brand.

## Scope IN
- Owner notification recipient = page owner's **Clerk primary email** (owner already server-derived from `publishedPageId` → `PublishedPage.userId`). Env `LEAD_NOTIFICATION_EMAIL` retired as recipient (may remain as admin/BCC-style fallback ONLY if trivially free — not a requirement).
- Visitor auto-reply: sent to the form's validated email field; **ON by default** with default template ("Thanks {name} — {business} received your message and will reply soon"); owner can edit text or disable per form via **form toolbar → settings**.
- Sender identity for BOTH emails: `From: "{Business Name}" <…@mail.lessgo.site>` (Resend domain already verified; local-part free choice — slug or fixed). `Reply-To`: owner notification → visitor's email (exists today); auto-reply → owner's email.
- Same code path/lib for both sends; both stay never-throw (lead row always saved even if email fails), outcome-flagged like today.

## Scope OUT (non-goals)
- Per-site "send leads to" override setting (Clerk email only v1; override when someone asks).
- Custom sender domains (mail from `@kundiusphotography.com`).
- Catch-all/forwarding inbox for the lessgo.site sender address (fresh mail TO it = accepted black hole; Reply-To covers replies).
- Localized/bilingual auto-reply variants (owner writes one text in the site's language; i18n overlay later).
- Weekly report / analytics emails (workEndtoEnd step 10 — separate).
- Rich templates/branding editor for the email (plain, tasteful default markup only).

## Constraints
- **Anti-spam-relay:** auto-reply goes ONLY to the validated email field of a real form on a real published page; visitor-typed content NEVER enters the email body (owner-set text + system template only); rides existing submit-route rate limiting (verify it exists — if absent, add basic per-IP/page throttle as part of this).
- Auto-reply config stored with the form definition (content JSON) — **no prisma schema change expected**; if planning finds one needed, human gate.
- Old published blobs (frozen form.v1/v2.js) must keep working: config is read server-side at submit time, never from the client payload.
- Owner-email resolution must not add a hard Clerk dependency on the hot path failure mode — Clerk lookup fails ⇒ email outcome 'failed', lead still saved.
- Form toolbar/settings UI follows the toolbar-standard direction (don't invent a new toolbar pattern).

## References
- `src/lib/email/sendLeadNotification.ts` — existing send path, env gating, outcome contract, Sentry-on-fail (F30); its L12-14 comment describes exactly the owner-scoping change.
- `src/app/api/forms/submit/route.ts` — call site (~L285); owner derivation from publishedPageId already exists here for authz.
- `src/lib/email/sendLeadNotification.test.ts` — test pattern to extend (env stubbing, outcome asserts).
- Form builder / form toolbar settings UI (`src/components/forms/`) — where the per-form auto-reply controls land.

## Open exploration questions
- Where the form definition lives server-side at submit time (Project content vs PublishedPage snapshot) → where auto-reply text/enabled is read from for PUBLISHED pages (draft edits shouldn't retro-change live behavior unexpectedly — or should they? planner decides with evidence).
- Does /api/forms/submit have rate limiting today?
- Business name source at submit time (Project meta? PublishedPage?) for From display name + {business} token.
- Clerk primary-email lookup pattern server-side (existing helper?).
- Which email field is "the" email when a form has several.

## Candidate human gates
- First live-send verification on prod (real Resend, mail.lessgo.site From, both emails) before Kundius handover relies on it.
- Any prisma schema change (none expected — auto-escalate if found).

## Acceptance criteria
- [ ] Form submit on site A emails site A's owner (Clerk email); a second owner's site emails THAT owner — no shared inbox.
- [ ] Visitor with valid email field gets the auto-reply; forms without an email field skip it silently.
- [ ] Auto-reply text editable + disableable per form in form toolbar → settings; default template with {name}/{business} works untouched.
- [ ] Both emails: `From: "{Business Name}" <…@mail.lessgo.site>`; owner notification Reply-To = visitor; auto-reply Reply-To = owner.
- [ ] Email failure (Clerk lookup fail, Resend non-OK) never loses the lead; outcome flagged + Sentry'd as today.
- [ ] Visitor-typed content appears in NO auto-reply body; sends only to validated email field; rate limiting confirmed/added.
- [ ] Old published pages (frozen form.v1/v2.js) submit + trigger both emails without republish.
- [ ] `tsc` / `test:run` green; sendLeadNotification tests extended for owner resolution + auto-reply.

## Pilot / smallest slice
Phase 1 = owner-notification re-routing only (Clerk email resolution, no UI) — verifiable immediately on any test site; unblocks Kundius handover on its own. Then auto-reply send path with default template, then form-settings UI. Decision gate after phase 1: live email lands in owner inbox on preview/prod.
