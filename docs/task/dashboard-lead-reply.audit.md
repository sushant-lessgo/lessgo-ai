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
