# Data Capture — Manual QA (final human gate)

Covers everything the audit deferred to "the final human gate": live EditDelta rows, regen re-freeze, PostHog event props. Run against `npm run dev` (real LLM, not mock — `USE_OPENAI=true`). Already merged to `main`; this branch (`feature/atelier-template`) has it too.

## Setup

1. `npm run dev`.
2. DB access to check `EditDelta`/`Project.aiBaseline` rows. Use `npx prisma studio` (easiest — visual tables) or `npx prisma db execute --stdin --schema prisma/schema.prisma` for raw SQL. Point at the **dev** DB (`.env` `DATABASE_URL`), not prod.
3. PostHog: open the site in a normal tab (not the extension), open DevTools console. Two ways to see events fire:
   - PostHog toolbar (if enabled on your account) — shows event capture in real time.
   - `posthog.capture` calls go out as network requests — Network tab, filter `posthog` or `i.posthog.com`, inspect the request payload's `properties`.
   - Simpler: temporarily add `posthog.debug()` in devtools console (or check `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` events live in the PostHog dashboard, ~seconds of lag).
4. Know your Clerk `userId` and whether it's in `ADMIN_CLERK_IDS` (check `.env.local`) — you need ONE admin account and ONE non-admin account to test `isFounderEdit`.

---

## 1. Baseline freeze + zero-row parity (Phase 2 — the core dataset-integrity check)

This is the check the audit explicitly skipped and flagged as pending.

1. Start a fresh project, go through onboarding, generate a full page (real LLM).
2. Let autosave fire (wait ~1s after generation completes, or trigger a save).
3. Query: `SELECT * FROM "EditDelta" WHERE "projectToken" = '<token>';`
   - **Expect: zero rows.** Unedited AI output vs baseline must diff to nothing.
   - If you see rows here, the freeze/diff parity is broken (extractElementText mismatch between wizard finalContent shape and editor export shape) — this is the dataset-corruption risk flagged in the plan.
4. Query: `SELECT "aiBaseline" FROM "Project" WHERE "tokenId" = '<token>';`
   - Expect a populated JSON: `{ [sectionId]: { [elementKey]: "text" } }` matching the generated copy.

## 2. Edit-delta capture on real edits

1. On the same project, edit a headline text element in the editor (change a few words).
2. Wait for autosave (or force save).
3. Query `EditDelta` again — expect exactly ONE row for that `(sectionId, elementKey)`:
   - `aiText` = original AI text, `userText` = your edited text, `editDistance` > 0.
   - `templateId`/`audienceType` populated (denormalized, non-null).
   - `isFounderEdit` = `true` if your Clerk ID is in `ADMIN_CLERK_IDS`, else `false`.
4. Edit the SAME element again (different text) → save → still exactly ONE row for that element, values updated (UPSERT on `(projectToken, sectionId, elementKey)` — not a new row).
5. Revert the element back to the exact original AI text → save → the row should be **deleted** (back-to-baseline cleanup).
6. Add a brand-new section/element not in the AI baseline, edit it → save → **no EditDelta row** (no AI baseline for it, correctly excluded per plan).

## 3. Regen re-freeze (Phase 3)

1. Regenerate a whole section (not element). Confirm the section content changes.
2. Immediately (before editing anything) let autosave fire → query `EditDelta` → expect **zero rows** for that section's elements (regen output re-frozen as new baseline, matches itself).
3. Now edit an element in that just-regenerated section → save → expect a row where `aiText` = the **regenerated** text (not the original pre-regen text).
4. Element-level regen: use "regenerate element" (variations), accept a variation (not index 0/"keep current") → save → same check: no delta if unedited after, `aiText` = accepted variation if you then edit it.
5. Edge case from the audit's flagged open risk: accept variation **index 0** ("keep current") on an element that already has an EditDelta row (previously edited) → save → confirm the EditDelta row for that element gets **deleted** (baseline re-frozen to current = zeroes the delta). This is documented as accepted/by-design, not a bug — just confirm it behaves as described, don't file it as a defect.

## 4. Regen PostHog events (Phase 3)

Trigger a section regen, then an element regen, watching the PostHog network payload / toolbar:

- `section_regenerated` fires with props: `sectionType`, `attemptNumber` (starts at 1, increments per section per session), `templateId`, `audienceType`.
- `element_regenerated` fires with props: `sectionType`, `elementKey`, `attemptNumber`, `templateId`, `audienceType`. Fires on the variations *request*, not on accept.
- Regen the same section/element twice in one session → `attemptNumber` increments (2, 3, ...). Reload the page → counter resets to 1 (in-memory, expected per plan).

## 5. Failure telemetry (Phase 4)

Each must fire with a `reason` prop carrying the real server error code.

1. **`scrape_failed`**: on the onboarding entry step, submit a bogus/unreachable URL (e.g. `https://this-domain-does-not-exist-xyz123.com`). Expect `scrape_failed` with `reason`, `provider` (likely null), `sourceUrl_host` (hostname only — verify no full URL/path leaks), `audienceType: null`.
2. **`scrape_failed` network path**: kill your network mid-request (devtools offline throttle) during a scrape → expect `scrape_failed` with `reason: 'network_error'`.
3. **`generation_failed` / `parse_failed`**: harder to force live without breaking the AI provider. Options:
   - Temporarily set an invalid `OPENAI_API_KEY` in `.env.local` → trigger generation → should surface a generic AI error → expect `generation_failed` (not `parse_failed`, since the message won't match JSON/parse markers). Revert the key after.
   - If you want to specifically prove `parse_failed`, you'd need to force a malformed-JSON response from the provider — not easily reproducible live; acceptable to rely on the audit's static code-path trace (`failureEventName` regex match on "no json found"/"unexpected token"/leading `[`) instead of a live repro for this one branch.
4. Confirm NO event fires when a generation fails due to **insufficient credits** (credit-fail path is explicitly excluded per plan) — e.g. exhaust credits on a test account, try to generate, confirm no `generation_failed` event.

## 6. Regression check

- `npm run test:run` — should still be green (per audit: 141 files, only the known `i18nHonesty` env-flake may intermittently fail — pre-existing, unrelated).
- `npx tsc --noEmit` — only the known pre-existing `src/app/page.tsx` `founder.jpg` error should appear.

---

## Sign-off checklist

- [ ] §1 zero-row parity holds on fresh unedited generation
- [ ] §2 edit → 1 row, re-edit → upsert not duplicate, revert → row deleted, new element → excluded
- [ ] §3 regen re-freezes baseline (no false-positive deltas post-regen)
- [ ] §3 index-0 variation-accept zeroing behavior confirmed (by design)
- [ ] §4 `section_regenerated` / `element_regenerated` props correct, attemptNumber increments
- [ ] §5 `scrape_failed` (both paths) fires, hostname-only (no full URL leak)
- [ ] §5 `generation_failed` fires on generic AI failure; credit-fails emit nothing
- [ ] §6 tests/tsc green

## Known accepted non-blockers (don't re-file as bugs)
- Legacy projects with no `aiBaseline`: first post-deploy save freezes current (possibly already-edited) text as baseline.
- Revert `deleteMany` uses an OR-fan-out per autosave (bounded ~tens of elements, minor perf only).
- `attemptNumber` resets on page reload (in-memory).
- `parse_failed` vs `generation_failed` split is message-signature based, not a server error code (documented risk if AI client wording changes later).
