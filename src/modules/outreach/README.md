# outreach module

PURE generation core for **cold outreach** — platform-correct outreach copy grounded
in a specific prospect (their scraped/pasted facts) tied to the sender's Brief.
Clones the email-sequences rail (`src/modules/email/`): plain modules a server
route imports; the route owns all AI calls, Prisma, and next/* concerns.

## Purpose

The user pastes a prospect URL (or raw text). The Phase 4 route scrapes the URL
with the existing SSRF-safe crawler (`@/lib/scrape/fetchSite`), extracts prospect
facts with THIS module's schema + prompt, then generates messages that reference
the prospect's real business. Raw pasted text is used verbatim (never fetched —
LinkedIn ToS). Scrape/extract failure degrades to a generic message, never an error.

## Key files

- `prospectExtraction.ts` — the prospect-grounding core (Phase 2):
  - `ProspectExtractSchema` / `type ProspectExtract` — `{ name, whatTheyDo, whoFor, specifics[] }`.
  - `buildProspectExtractionPrompt(combinedText)` — proof-truth extraction prompt.
  - `summarizeProspect(grounding)` — renders an extract OR `{rawText}` into a prompt fragment.
  - `mockProspectExtract` — demo/mock fixture.
- `platforms.ts` — platform defs (labels, caps, prompt instructions). **Planned — Phase 3.**
- `outreachEngine.ts` — prompt builders, shape-only output schemas, cap validators,
  mock outputs (clone of `sequenceEngine.ts`). **Planned — Phase 3.**

Companion (outside this dir): `src/lib/prospectScrape.ts` — project-scoped
`ProspectScrape` cache (urlKey normalization + 7-day TTL + upsert). Prisma-backed;
NO fetching (callers use `scrapeSite`).

## Invariants

- **Pure module.** No Prisma, no `next/*`, no AI-SDK call, no `'use client'` imports
  in this dir — a server route makes the `generateWithSchema` / `generateRawJson` calls.
- **Constraint-light extract schema.** `ProspectExtractSchema` feeds OpenAI STRICT
  structured outputs: NO zod `.min()`/`.max()` (no minItems/maxItems/minLength), and
  `name` is `.nullable()` (NOT bare-optional). Count/length guidance ("2–6 specifics")
  lives in the PROMPT TEXT, not the schema.
- **Caps outside schemas** (Phase 3): message char/word caps are enforced only in the
  validators, never in the output schemas — keeps `too_long` distinct from
  `invalid_shape` for the retry/trim contract (email decision #10).
- **Proof-truth, both sides.** Sender claims come only from the Brief (reuse
  `buildBrandContext` / `PROOF_TRUTH_FRAGMENT` from `src/modules/email/`). Prospect
  facts come only from the scrape or pasted text — the extraction prompt forbids any
  inference or invention about the prospect.
- **Crawler reused, not forked.** The route imports `scrapeSite`/`ScrapeError` from
  `@/lib/scrape/fetchSite`; SSRF guards are inherited from that lib. No file under
  `src/lib/scrape/` or `src/app/api/v2/` is touched by this feature.

## Pitfalls

- **Demo-first route ordering (Phase 4):** the demo/mock short-circuit runs FIRST in
  every handler — before intake load, scrape, or any spend. A demo bearer never
  enters the grounding ladder and never scrapes/charges/persists.
- **Cache-charge contract (Phase 4):** `OUTREACH_SCRAPE` credit is charged ONLY on a
  cache miss/stale scrape, checked BEFORE the network call. Cache hits, pasted text,
  and scrape failures charge nothing. Generation itself is credits-free (ledger row is
  the gating source-of-truth).
- **Never re-scrape on regenerate:** regenerate rebuilds grounding from the message's
  stored `grounding` snapshot, so it stays self-contained after cache expiry.
