# dashboard-lead-reply — audit

## Phase 1 — Pure helpers (message extraction, brand grounding, prompt)

### Files changed
- `src/lib/leadReply/messageExtraction.ts` (new)
- `src/lib/leadReply/brandGrounding.ts` (new)
- `src/lib/leadReply/prompt.ts` (new)
- `src/lib/leadReply/README.md` (new)
- `src/lib/leadReply/messageExtraction.test.ts` (new)
- `src/lib/leadReply/brandGrounding.test.ts` (new)

### What was built
- **messageExtraction.ts** — `extractLeadMessage(data)` (heuristic a→b→c) + `hasReplyableMessage(data)` thin wrapper (the single shared gate for UI + route). (a) explicit message-named key (message/comment/note/enquiry/inquiry); (b) longest substantive free-text value from a key that is NOT a contact field and NOT on the non-message denylist (company/organization/subject/budget/website/url/city/address/role/title + variants) and whose value doesn't look like email/phone/URL; (c) null. Trim + substance floor (≥2 words OR ≥8 chars). Null/undefined/non-object data → null. In-file note documents the inverse relationship with `previewOf` in `LeadsInbox.tsx`.
- **brandGrounding.ts** — `resolveReplyGrounding(brief, siteName)`. B1: `mode='brief'` IFF `buildBrandContext` yielded ≥1 real fact (`ctx.offer || ctx.offerings.length || ctx.audiences.length || ctx.testimonials.length || ctx.proofAvailable.length` — field names verified against `EmailBrandContext` in `src/modules/email/brandContext.ts`). Otherwise (zero facts, parse failure, null/undefined/non-object/garbage) → `mode='light'`, summary = site name only. Never ships the "No specific brand facts…" fallback sentence. Wrapped in try/catch; never throws.
- **prompt.ts** — `buildLeadReplyPrompt(grounding, leadMessage, leadName?)` (business voice, addresses lead's question, concise, email/WhatsApp-sendable, no invented facts beyond grounding, plain text, simple sign-off, no bracketed placeholders) + `LeadReplyOutputSchema = z.object({ reply: z.string().min(1) })`.
- **README.md** — purpose, key files, B1 mode-from-facts rationale, boundary invariant (only `messageExtraction.ts` is client-safe; grounding/prompt are server-side; nothing enters a published renderer).

### Deviations from the plan
None material. Conservative in-scope choices logged:
- messageExtraction denylist/contact-hint lists were expanded with obvious variants (organization/organisation/business, e-mail/mobile/tel/whatsapp/contact, link/state/country/zip/postcode/position/occupation) to make the intent robust; the plan's named examples are all covered.
- Phone/URL/email "looks like a contact value" detection is a small regex guard on the fallback branch, as the plan requires ("value doesn't itself look like an email/phone/URL").

### Verification
- `npx tsc --noEmit` (from WORKDIR): the ONLY error is `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'` — a PRE-EXISTING image-module typing gap in an untouched file. Confirmed by stashing the six new files and re-running tsc: the same (and only) error persists. My files introduce zero type errors. `.next` was wiped to rule out the stale-`.next/types` phantom; error unchanged → genuinely pre-existing, not the phantom.
- Scoped tests: `npx vitest run src/lib/leadReply` → `Test Files 2 passed (2)`, `Tests 21 passed (21)`.
- Full suite: `npm run test:run` → `Test Files 226 passed | 1 skipped (227)`, `Tests 3849 passed | 18 skipped (3867)`. No regressions.

### Open risks / follow-ups for later phases
- The pre-existing `founder.jpg` TS2307 error is not mine but WILL surface in phase 4's `npx tsc --noEmit` gate — needs an image-module `.d.ts` declaration or a page fix outside this feature's scope. Flag at the gate.
- Phase 2 route must import ONLY `messageExtraction` from client-shared surface; `brandGrounding`/`prompt` are server-only (README documents this).
- Model/credit config (`'lead-reply'` endpoint in BOTH tier maps, `LEAD_REPLY=1`) is phase 2 — not touched here.

---

## Phase 2 — Draft-reply API route + credit/model config

### Files changed
- `src/lib/creditSystem.ts` (edit, additive) — `CREDIT_COSTS.LEAD_REPLY = 1`; `UsageEventType.LEAD_REPLY_GENERATION = 'lead_reply_generation'`.
- `src/lib/modelConfig.ts` (edit, additive) — `'lead-reply'` added to the `Endpoint` union + an entry in BOTH `cheap` and `production` tier maps (reuses cold-outreach: GPT_4O_MINI primary, no backup).
- `src/app/api/leads/[id]/draft-reply/route.ts` (new) — POST route.
- `src/app/api/leads/[id]/draft-reply/route.test.ts` (new) — 13 Vitest cases.

### What was built
Account-level `POST /api/leads/[id]/draft-reply`, mirroring the outreach regenerate route shape (kill-switch, Clerk auth, `withAIRateLimit` wrap, `createSecureResponse`, `generateRawJson`, retry-once). Flow exactly per plan lines 73-83:
1. Kill-switch `NEXT_PUBLIC_LEAD_REPLY_DISABLED === 'true'` → 404 `not_found` (checked in both `POST` and the inner handler, matching outreach).
2. Clerk `auth()` → 401 `unauthorized` if no userId.
3. Ownership select first — `formSubmission.findUnique` selecting ONLY `publishedPageId`; `data` fetched in a SECOND select after ownership passes.
4. `getAccountScope(clerkId)` → 404 `not_found` when submission missing OR `publishedPageId` null OR not in `scope.pageIds` (before any `data`/brief read).
5. `extractLeadMessage(data)` null → 400 `no_replyable_message` (no AI, no charge).
6. Grounding: scoped `publishedPage.findUnique` (projectId, title) → `project.findUnique` (brief, title) → `resolveReplyGrounding`; wrapped so any failure degrades to light, never errors.
7. `checkCredits(clerkId, CREDIT_COSTS.LEAD_REPLY)` not allowed → 402 `insufficient_credits` + `remaining`.
8. `generateRawJson('lead-reply', prompt, LeadReplyOutputSchema)` retry once, then 500 `generation_failed` (no charge).
9. `consumeCredits(clerkId, LEAD_REPLY_GENERATION, 1, { metadata: { submissionId, grounding: mode } })`. **B2 split.**
10. Success → `{ success, reply, grounding, remaining }`.

### B2 branch split — keyed off the real creditSystem error shape
Verified against `deductCredits`/`consumeCredits` (creditSystem.ts): on retry exhaustion `deductCredits` returns `{ success: false, remaining: lastKnownBalance, error: 'charge_conflict' }` (L356-360), propagated UNMANGLED by `consumeCredits` (L491 `return deduction`); genuine insufficiency surfaces as `error: 'Insufficient credits. Required: X, Available: Y'` (checkCredits path, L463) or `'Insufficient credits'` (deduct path, L252). The route keys on `consumed.error?.startsWith('Insufficient credits')` → 402 `insufficient_credits`; ANYTHING else non-success (incl. `'charge_conflict'`, tx errors) → recoverable 500 `charge_failed` — distinct from `generation_failed`, never a buy-wall on a solvent-user race.

### Deviations
- Grounding failure wrapped in a local `resolveGroundingSafely` helper (degrades to light on any DB/resolve error) — the plan's "any resolution failure degrades to light, never errors" made explicit; conservative, in-scope.
- Consume-failure 500 uses `error: 'charge_failed'` (not `generation_failed`) so the client can distinguish the two 500s per plan line 92. No other status branch added.
- `leadName` not passed to `buildLeadReplyPrompt` (prompt's optional arg) — omitted to avoid a second extraction heuristic not required by the route contract (lines 73-83). Conservative.

### Verification
- `npx tsc --noEmit` (from WORKDIR): clean, 0 errors (the `Record<Endpoint, …>` exhaustiveness confirms both tier entries present).
- Scoped: `npx vitest run 'src/app/api/leads/[id]/draft-reply/route.test.ts'` → Test Files 1 passed; Tests 13 passed.
- Full: `npm run test:run` → Test Files 227 passed | 1 skipped (228); Tests 3862 passed | 18 skipped (3880). No regressions.
- Grep of all 10 imported modules' first line: none carry `'use client'`.

### Open risks / follow-ups
- Founder-confirm at gate (non-blocking): `LEAD_REPLY = 1` price; the two additive `creditSystem.ts` inserts vs in-flight billing-beta merge ordering (second-merger reconciles).
- Phase 3 (UI pane) consumes this route; the 402 `insufficient_credits` + `remaining` and the distinct 500 `charge_failed`/`generation_failed` codes are the contract the pane must branch on.

---

## Phase 3 — Lead-detail pane UI: DraftReplyPanel

### Files changed
- `src/app/dashboard/leads/DraftReplyPanel.tsx` (new, `'use client'`)
- `src/app/dashboard/leads/DraftReplyPanel.test.tsx` (new, Vitest/jsdom)
- `src/app/dashboard/leads/LeadsInbox.tsx` (edit — mount panel + import only)

### What was built
- **DraftReplyPanel.tsx** — self-contained `{ submissionId, data }` panel. Gate: renders `null` when `!hasReplyableMessage(data)` (imports ONLY `messageExtraction`, the boundary-safe leadReply module) or when `NEXT_PUBLIC_LEAD_REPLY_DISABLED === 'true'`. State machine `idle → loading → draft | error | nocredits`:
  - **idle:** "Draft reply" primary pill (AppIcon `auto_awesome`), app-chrome tokens matching the pane.
  - **loading:** disabled pill, "Drafting…", spinning `progress_activity` icon.
  - **draft:** controlled `<textarea>` seeded with `reply` (founder edits preserved); one-line "less on-brand" hint when `grounding === 'light'`; **Copy** button reusing the exact FieldRow clipboard idiom (`navigator.clipboard.writeText`, `content_copy`→`check`, 1.2s "Copied"); **Regenerate (1 credit)** button (re-POST).
  - **402:** greyed/disabled pill + `title` why-tooltip AND a visible muted line, both = server `message` + "Upgrade or top up to draft replies." (greyed-placeholder rule; no invented UX, no dead billing links).
  - **other errors (400/404/500/network):** inline `text-app-danger` line, button re-enabled to retry; idle-path copy notes "You were not charged."
  - State resets to idle via `useEffect` on `submissionId` (selecting another lead).
- **LeadsInbox.tsx** — added `import DraftReplyPanel` and rendered `<DraftReplyPanel submissionId={selected.id} data={selected.data} />` between the field-row list and the meta `<dl>`. No change to `InboxLead`, the list, or any S4a aggregation/route.
- **DraftReplyPanel.test.tsx** — react-dom/client + `act` idiom (no @testing-library in repo). 7 cases: no-message → renders nothing + no fetch; kill-switch env → renders nothing; click → POSTs `/api/leads/{id}/draft-reply` + editable textarea shows reply; light-grounding hint; 402 → disabled button + asserts upgrade/top-up + "Insufficient credits" TEXT (content, not presence); 500 regenerate → error shown, hand-edited textarea value preserved, retry possible; submissionId change → resets to idle.

### Deviations
- **402 while a draft already exists (regenerate):** plan's 402 UX is the greyed idle state, but wiping an existing (possibly hand-edited) draft to show it would lose founder edits. Conservative choice: on 402 *from a draft* keep the draft and surface the wall as an inline line (`{message} Upgrade or top up…`); the greyed `nocredits` state is used only for a 402 from idle. Logged here per the in-scope-ambiguity rule.
- **Reset mechanism:** used an internal `useEffect` on `submissionId` (not a `key` in LeadsInbox) so the panel is self-contained and the reset is unit-testable on the same instance. Plan explicitly allowed either.
- **Danger/spinner tokens:** reused existing `text-app-danger` + Tailwind `animate-spin` (no new tokens).

### Verification
- `npx tsc --noEmit` (WORKDIR) → exit 0, 0 errors.
- `npx vitest run src/app/dashboard/leads/DraftReplyPanel.test.tsx` → 7 passed.
- `npm run test:run` (WORKDIR) → 228 files passed / 1 skipped; 3869 tests passed / 18 skipped. No regressions.
- `npx eslint` on the 3 touched files → exit 0 (clean; no bare-store or restricted patterns — dashboard code, no edit-store import).

### Open risks / follow-ups
- Live-UI eyeball + draft-quality founder gate is Phase 4 (HUMAN GATE); not covered here.
- `npm run build` not run in this phase (Phase 4 runs the full build gate).
