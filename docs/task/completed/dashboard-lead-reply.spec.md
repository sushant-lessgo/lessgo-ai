---
tier: full
tier-why: net-new LLM op + new credit cost in creditSystem/UsageEventType (billing surface, coordinates with in-flight billing-beta) + cross-tenant lead/brand data read (ownership) + dashboard cross-surface. Risky surfaces → full pipeline.
---

# dashboard-lead-reply — spec  (Dashboard S4b · Lane 1)

The AI reply-draft S4a deferred. Builds on the merged S4a leads-as-inbox (`dashboard-rollups-inbox`).

## Problem / why
S4a shipped a cross-site All-Leads inbox (master-detail, read-only): you can *see* every form submission across your sites, but there's **no way to act on one**. Answering a lead means leaving the app, re-reading their message, and writing a reply from scratch — and the founder is the bottleneck. A good first draft, grounded in the business's own brand, turns "a lead sat in an inbox" into "a reply sent in one edit."

## Goal
In the S4a lead-detail pane, for a lead that contains a real message, a **"Draft reply"** action generates an **on-brand, editable** reply — grounded in the lead's message + the business's existing Brief — that the founder tweaks and **copies to clipboard** to send from their own email/WhatsApp. No sending infra, no CRM. Costs 1 credit, charged only on a successful draft.

## Scope OUT (non-goals)
- **Sending the reply from the app** (Resend-to-lead). Deferred post-beta — it needs the founder's *verified domain* as from/reply-to (sending as `onboarding@resend.dev` reads as spam) + reliable email extraction + bounce/deliverability handling. This slice is **draft + copy-to-clipboard** only.
- **A new brand-context store.** Brand grounding reuses the **existing `Project.brief`** (the canonical source all copy engines already read). If a dedicated lighter "brand summary" is ever wanted, that's a **separate** Brief-layer spec — do not couple it here.
- **Lead enrichment / domain scraping** (backlog #25 — that's email-side enrichment; distinct).
- **CRM, lead status/assignment/labels, threading** — inbox stays read/view + draft for beta.
- **Tone/persona pickers, multi-variant drafts, bulk reply** — one draft, editable, regenerate allowed; tone options post-beta.
- No changes to the S4a aggregation/routes beyond adding the draft affordance.

## Constraints
- **Reuse `Project.brief` as brand grounding**, resolved `FormSubmission.publishedPageId → PublishedPage → Project.brief` — the same Brief the work/social/email/outreach engines consume. Never a parallel brand blob.
- **Graceful degradation:** a project with a thin/absent Brief (older/manual projects, or a null-`publishedPageId` submission) falls back to **light context** (business/site name + the lead's message). The draft still works, just less on-brand — never errors out.
- **Only offer "Draft reply" when the submission has a reply-able message.** Subscribe/WhatsApp-only submissions (no message field in `data`) show no draft affordance — don't spend a credit drafting a reply to nothing.
- **New credit cost `LEAD_REPLY = 1`** in `creditSystem.ts` + a `UsageEventType`. **Coordinate with in-flight `billing-beta`** — both edit `creditSystem.ts` (additive; whoever merges second reconciles) and billing-beta's "what costs what" + block→upgrade gating should ideally surface `LEAD_REPLY` too. Reuse billing-beta's **gating message** (0 credits → clear message + upgrade/top-up link), don't invent a second block UX.
- **Charge model = check-then-charge-on-success** (the pattern `billing-correctness` landed): verify balance up front → generate → charge 1 credit only on a successful draft; a failed generation costs nothing.
- **Auth + ownership:** the requesting user must own the submission (`FormSubmission.userId`); assert before reading the lead's `data` or the project's Brief — no cross-tenant lead/brand leak.
- **Reuse the modern single-call copy pattern** — the `social`/`outreach`/`email-sequences` routes (one gated, Zod-validated AI copy call) are the best-code reference per the regen-modernization audit; do **not** touch the legacy stack (deleted) or the audience generation routes.
- Build on the **S4a lead-detail pane** + `ui-foundation` primitives. Presentation-only in the editor sense — no editor store/selection touch.
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `docs/task/dashboard-rollups-inbox.spec.md` — S4a inbox master-detail + lead-detail pane this extends (its line 43 already scoped S4b as "LLM + credits + copy-to-clipboard").
- `prisma/schema.prisma` `FormSubmission` — `data` (freeform JSON: the message + contact live here), `publishedPageId`, `userId` (owner, ownership key).
- `Project.brief` (JSON) + `src/modules/brief/` (`buildBriefDraft`, `classify`) — the canonical brand context; the copy engines' grounding source to imitate.
- `src/lib/creditSystem.ts` (add `LEAD_REPLY = 1`), `UsageEventType`, `checkCredits`/check-then-charge (billing-correctness pattern, merged).
- The copy-rails routes (`social` / `outreach` / `email-sequences`) — the modern gated single-AI-call + Zod-parse pattern to mirror.
- `docs/task/billing-beta.spec.md` — coordinate the gating-message reuse + `creditSystem.ts` edit; both in flight.
- Handoff `Lessgo Dashboard.dc.html` 2c (reply) — visuals only.
- `assertProjectOwner` / the S4a own-data scoping — ownership pattern.

## Open exploration questions (feeds scout)
- Where does S4a's lead-detail pane live (component) to hang the "Draft reply" UI + copy affordance?
- How is the lead's **message** identified inside the freeform `data` JSON (vs name/email/other fields)? A heuristic is needed to (a) decide the "has a message" gate and (b) feed the prompt.
- Existing helper to resolve `publishedPageId → Project.brief`? What shape is `brief` (fields useful for reply grounding: offer, what they sell, voice)?
- The exact modern copy-rails route to mirror (which AI client, Zod schema, gating helper) — reuse, not re-derive.
- Where is `UsageEventType` defined + how does `billing-beta` read costs (to avoid a `creditSystem.ts` collision)?
- Ownership: confirm `FormSubmission.userId` is the right gate and how to assert it in an account-level (non-token) route.

## Candidate human gates
- **Draft quality on a REAL lead** (founder eyeball) — is the on-brand draft actually worth sending with light edits? If it's generic/off-voice, the Brief grounding needs work before it's worth a credit. This is the pilot gate.
- **`LEAD_REPLY = 1` credit cost** (money/config) — confirm.
- **`creditSystem.ts` edit** — coordinate ordering with `billing-beta`.

## Acceptance criteria
- [ ] In the S4a lead-detail pane, a lead **with a message** shows "Draft reply"; generating produces an **on-brand, editable** draft grounded in `Project.brief` + the lead's message; **copy-to-clipboard** works.
- [ ] A lead with **no reply-able message** shows **no** draft affordance.
- [ ] A project with a **thin/absent Brief** (or null `publishedPageId`) degrades to light context and still drafts (no error).
- [ ] Costs **1 credit** (`LEAD_REPLY`), **charged on success only**; a failed generation charges nothing; a 0-credit user is blocked with the **billing-beta gating message** (upgrade/top-up path), not a silent fail.
- [ ] **Ownership enforced** — a user can only draft replies for their own submissions (`FormSubmission.userId`); no cross-tenant lead/brand read.
- [ ] **No send path, no CRM, no new brand store** — reuses `Project.brief`.
- [ ] `tsc` + `test:run` + `npm run build` green.

## Pilot / smallest slice
It's a single self-contained slice (one route + one detail-pane affordance + one credit cost). **Decision gate = the draft-quality eyeball on a real lead:** an on-brand reply worth sending after light edits. If drafts read generic/off-voice, fix the Brief grounding before shipping — a mediocre draft isn't worth a credit or the trust. Send-from-app + tone options are the post-beta follow-ups this proves the ground for.
