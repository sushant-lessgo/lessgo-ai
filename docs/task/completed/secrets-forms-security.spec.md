---
tier: standard
tier-why: bounded security hardening (encrypt integration keys at rest, move key off URL, server-derive form ownership) — one adversarial diff review over crypto + ownership derivation. Escalate if the encrypt-in-place migration turns non-trivial.
---

# secrets-forms-security — spec

## Problem / why
Two real security / data-integrity holes to close before public beta: customer integration secrets are stored and transmitted in the clear, and public form submissions trust a client-controlled owner id. Source: `docs/reports/code-quality-report.md` findings M6, M8.

- **M6 — integration keys exposed.** Customer API keys (e.g. ConvertKit) are stored **plaintext**; the Prisma schema comment falsely claims "Encrypted." The live submit path reads the key from the `Project.content` JSON blob, and the ConvertKit client sends the key as a **URL query parameter** → written into proxy/CDN/server logs. Anyone with DB or log access gets customer secrets.
- **M8 — forged form submissions.** `POST /api/forms/submit` trusts a body `userId` that is embedded in the **public** page HTML. An attacker can submit with any owner's id → fake submissions fire that owner's integrations and lead-notification emails (spam from the owner's own inbox) and pollute their leads.

## Goal
Customer integration secrets are encrypted at rest, never placed in a URL, and read only from their proper encrypted store — the schema's "Encrypted" claim becomes true. Form submissions attribute ownership from a **server-derived** source (the page's slug/project), so a submitter can never forge whose integrations/emails fire.

## Scope OUT (non-goals)
- No new integrations — only harden the existing surface (ConvertKit is the live one; cover the generic `UserIntegration` path it uses).
- No change to what data forms collect or the `FormSubmission` shape beyond how ownership is resolved.
- No rate-limiting/validation overhaul of the submit endpoint (that's the LOW-bucket subscribe/analytics hardening — separate).
- Not the broader billing/plan work.

## Constraints
- **M6 encryption:** keys encrypted at rest with a server-held key (env-based secret); decrypt only in-process at call time. No secret in any URL — ConvertKit call must move the key to a header/body, not a query param. Consolidate reads to the encrypted `UserIntegration` store; stop reading keys from `Project.content` JSON.
- **Existing stored keys** must be migrated (encrypt-in-place) or, if unrecoverable, customers re-enter — decide at plan time based on what's actually in prod (prod data was wiped 2026-06-16 keeping accounts, so likely few/none, but must be confirmed before assuming greenfield).
- **M8 ownership:** derive the owning project/user from the submission's slug/pageId server-side (the mapping already exists for routing); ignore any client-supplied `userId`. A submission for a non-existent/unpublished slug is rejected.
- Do not regress the live ConvertKit integration or the lead-notification email flow (env-gated `RESEND_API_KEY` + `LEAD_NOTIFICATION_EMAIL`).
- Fix the schema comment to reflect reality.
- No CI gate — `tsc` + `test:run` green locally; plus a live ConvertKit round-trip smoke check.

## AMENDMENT — scope cut to M8 only (founder decision, 2026-07-17)

Scouting invalidated this spec's M6 premise. Founder ruling: **M6 is not needed; this run ships M8 only.** Prod confirmed **greenfield** (no real integration keys) → no data migration.

Corrections to the record (the body above is left as originally written; where it conflicts, THIS section wins):

- **`UserIntegration` is DEAD schema** — zero references anywhere in `src/`. The spec's "consolidate reads to the encrypted `UserIntegration` store" is not a consolidation; that store was never built. `Project.content` JSON is the ONLY key store (written by `src/components/forms/FormBuilder.tsx:436`, read by `src/app/api/forms/submit/route.ts:145`).
- **The URL leak is entirely dead code** — `convertkit.ts:80 testConnection` and `:108 getForms` have zero callers. The only live instantiation (`forms/submit/route.ts:148`) calls `addSubscriber`, which already sends the key in the POST body. A Kit v4 migration (Bearer/OAuth, a *different* credential than v3's `api_key`) would have invalidated every stored key — correctly avoided.

**IN SCOPE for this run (M8 only):** `forms/submit` derives the owner server-side from `publishedPageId` via `PublishedPage.userId`; the client-supplied body `userId` is ignored/dropped from the contract; submissions for an unknown/unpublished page are rejected; `data-owner-id` stops being emitted into public HTML.

**OUT OF SCOPE (deferred, re-spec via `/discuss`):** all M6 work — at-rest encryption, the env secret + rotation story, standing up `UserIntegration`, migrating keys out of `Project.content`, the schema comment, and deleting the dead query-param methods. Acceptance criteria 1, 2, 3, and 6 above are therefore **deferred, not met by this run**. Criterion 5's ConvertKit round-trip still applies as a no-regression check.

**Tier: ESCALATED `standard` → `full`** (one-way, per the risky-surface rule): M8 edits `src/lib/staticExport/formHandler.js`, which is on the publish path.

## References
- `prisma/schema.prisma:349` — `UserIntegration` "Encrypted" comment that lies
- `src/app/api/forms/submit/route.ts:56,85,166` — M8 trusts body `userId`; `:115` reads key from `Project.content`
- `src/lib/integrations/convertkit.ts:80,110` — key sent as URL query param
- Owner-resolution pattern to imitate: `assertProjectOwner` and the slug→project→owner routing lookups (`src/lib/routing/kvRoutes.ts`, publish path) — the same server-side mapping forms should use.

## Open exploration questions
- Where does the ConvertKit key currently get written on connect — `UserIntegration` row, `Project.content`, or both? (determines migration surface)
- Is `UserIntegration` already the canonical store, with `Project.content` a legacy duplicate to drop?
- What actually maps slug/pageId → owning user server-side today, and is it available inside `forms/submit`?
- How many real integration keys exist in prod right now (greenfield vs. migration needed)?
- Is there an existing encryption helper/env secret in the repo, or does one need standing up?

## Candidate human gates
- **Encryption key management** — introducing/standing up the at-rest encryption secret (env var, key rotation story) needs sign-off; losing it locks out all stored keys.
- **Data migration** of any existing plaintext keys (encrypt-in-place vs. force re-entry) — prod-data touch.
- Schema change to `UserIntegration` (Prisma migrate).

## Acceptance criteria
- [ ] Integration keys are stored encrypted at rest; the DB row holds no readable key; the schema comment is accurate.
- [ ] No integration key appears in any URL/query string or in logs; ConvertKit auth moves to header/body.
- [ ] The live submit path reads keys only from the encrypted store, not `Project.content` JSON.
- [ ] `forms/submit` resolves owner server-side from slug/pageId; a forged/omitted body `userId` cannot change which owner's integrations/emails fire; submission to an invalid slug is rejected. Regression test covers the forged-`userId` case.
- [ ] Live ConvertKit round-trip still works end-to-end; lead-notification email still fires for a legitimate submission.
- [ ] Any existing prod keys handled (migrated or re-entry path decided + documented).
- [ ] `tsc` + `test:run` green.

## Pilot / smallest slice
Two independent fixes; M8 (owner resolution) is self-contained and higher-frequency abuse risk — land it first, then M6 (encryption + URL/storage). Ship together as the pre-beta security bundle. Verification = one forged-submission test (M8) + one ConvertKit connect→submit→deliver round-trip with a DB/log inspection confirming no plaintext key (M6).
