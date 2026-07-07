# src/modules/goals

Frozen goal vocabulary for the scale track (self-serve architecture).

## Purpose

`vocabulary.ts` is the single source of truth for the closed goal vocabulary:
**18 intents** (`goalIntents` + `goalIntentMeta`) × **5 mechanisms M1–M5**
(`goalMechanisms` + `goalMechanismMeta`). Every downstream reader — the Brief
record (`@/types/brief` / `@/lib/schemas/brief.schema`), wizard pre-filtering,
serve gate, copy-prompt guidance, CTA machinery — keys on these enums.

## Invariants

- **FROZEN, coder-maintained** (scalePlan §11.2). Adding/renaming an intent or
  mechanism is a deliberate vocabulary decision, not a feature tweak.
  `vocabulary.test.ts` pins the exact sets — a red test means the vocabulary
  changed, not that the test needs fixing.
- **Legacy goal enums are intentionally untouched.** Today's routing enums
  (`serviceGoals` in `src/types/service.ts`, product goal strings) still drive
  generation. Renames here (`demo`→`request-demo`, `signup`→`signup-free`,
  `download`→`download-app`, `buy`→`buy-via-link`) exist only in this NEW
  vocabulary; migrating legacy readers is spec 02+ scope. Do not "clean up"
  the old enums to match.
- Typo trap: it is `pay-via-link` (not `pay-via-line`) — asserted in the test.

## Key files

- `vocabulary.ts` — intents, mechanisms, per-intent allowed-mechanism table
  (scalePlan §6).
- `vocabulary.test.ts` — frozen-set regression + BriefSchema smoke tests.

Source of decisions: `docs/tracks/scalePlan.md` §6, §11.2, §11.8.
