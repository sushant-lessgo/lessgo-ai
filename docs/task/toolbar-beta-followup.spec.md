---
tier: standard
tier-why: editor-lane, bounded — surfaces Regen in the t2 shell + a consolidation of Button Settings' destination. Touches the just-rewritten regen client path (verify) + the fragile followGoal/GOAL_REF goal-CTA (preserve) — two risk points → one impl-review + a load-bearing e2e. Auto-escalate if scout finds editStore-internals depth. Edit-side only (zero published files, like the parent toolbar work).
---

# toolbar-beta-followup — spec

The buildable-NOW remainder of `toolbar-standard-beta` (merged `349ec689`) — the parts that do **not** need the atelier-skeleton-cutover. Two items: Regen accommodation, and the LinkPicker→ButtonSettings consolidation.

## Problem / why
`toolbar-standard-beta` shipped the t2 shell + consolidation spine but explicitly left three follow-ups (handoff §REMAINING + Final-spec ticket). Two are buildable now:
1. **Regen is unverified + under-surfaced.** The one-click Regen (text sparkle, Button/CTA Regenerate) predates the t2 shell. Meanwhile `regen-modernization` **rewrote the routes it calls** (`/api/regenerate-element`, `/api/regenerate-section`, `aiActions.ts`, `actions.ts`) — it compiles and unit-tests pass, but **nothing exercises Regen behaviorally through the toolbar.** That's a potential live regression sitting in the unpushed bundle. And Regen should be present on the **section** toolbar, not just element-level.
2. **LinkPicker sits *beside* Button Settings' destination section instead of replacing it** — a half-consolidation (the whole point of unifying 15 link UIs into one LinkPicker). Two destination editors on one control is confusing and duplicative.

(The third — Form/Menu toolbar hosts — is deferred to build with the real action sets post-cutover; the curated per-element action sets are blocked on the cutover; the 3 🔴 defects are a separate fix.)

## Goal
Regen is reliably present and **proven working end-to-end** through the t2 shell on the **text toolbar (element regen)** and the **section toolbar (section regen)** against `regen-modernization`'s rewritten routes; the dead "Ask AI" slot is gone. And Button Settings has **one** destination editor — LinkPicker replaces its old destination section — with the goal-following CTA (`followGoal`/GOAL_REF) fully preserved.

## Scope OUT (non-goals)
- **The real per-element curated action sets** — BLOCKED on the skeleton cutover; separate future spec (they un-defer there).
- **Form + Menu toolbar hosts** — deferred to build *with* their real actions post-cutover (a hollow host now = greyed placeholders for their own sake).
- **The 3 toolbar-found 🔴 defects** (dead sanitize layer / double-mounted `GlobalButtonConfigModal` / `convertCTAToForm` crash) — separate fix (QA §D).
- **"Ask AI" free-text chat** — CUT (its route auth-hole already closed by regen-modernization); only the dead trailing slot is removed here.
- **Expanding element-regen to Image** — not requested; un-defers with the action sets.
- **Rewriting the regen routes** — done (`regen-modernization`); this verifies + surfaces, doesn't re-touch them.

## Constraints
- **Builds on the merged t2 shell** — `ToolbarButton` primitive + `LinkPicker` (already across 15 mounts). Don't fork the shell.
- **Regen surfacing:** text toolbar (element regen — exists) + **section toolbar (section regen — wire the section toolbar's Regen → `/api/regenerate-section`)**. Keep the existing Button/CTA Regenerate (element regen) — removing it would regress. No expansion to Image/other.
- **Behavioral verification is load-bearing:** an **e2e that drives Regen through the toolbar** and asserts real regenerated content lands — for **both** element regen (text) **and** section regen (section), against the rewritten routes. Green units are NOT sufficient (documented "green-but-false" risk this cycle). Fix anything the e2e exposes.
- **Reuse existing credit events** — `ELEMENT_REGEN=1`, `SECTION_REGEN=2`; no new cost, no new event.
- **LinkPicker replaces** Button Settings' destination section (not beside); decide where `Link.source` lives at plan time.
- **HARD: preserve `followGoal`/GOAL_REF.** A CTA set to follow the page goal must still resolve correctly after the consolidation. Goal resolution is already fragile (open F23 on vestria/granth CTAs) — do not regress a goal-following CTA.
- **Remove** the hidden "Ask AI" trailing slot (cut, not deferred → remove, don't grey).
- **Edit-side only** — no published-renderer/`.published.tsx` changes (the parent proved zero published files across the whole toolbar branch; keep that).
- No CI gate — `tsc` + `test:run` + build + lint green + the Regen e2e.

## References
- `docs/task/toolbar-standard-beta.{spec,audit}.md` + its mailbox handoff (§REMAINING: Regen accommodation, the Ask AI slot; Final-spec ticket: LinkPicker→ButtonSettings).
- `regen-modernization` audit — the rewritten `/api/regenerate-{element,section}` + `aiClient.ts` + `actions.ts`, and the "no behavioral test / high-risk collision" note this spec closes.
- `src/hooks/editStore/aiActions.ts` — the regen actions the sparkle/Regenerate/section-Regen call into.
- The t2 shell + `ToolbarButton` + `LinkPicker` (from `toolbar-standard-beta`) — the surface to extend.
- Button Settings' destination section + `followGoal`/GOAL_REF goal-resolution — the consolidation target + the behavior to preserve.
- `docs/tracks/toolbarPlan.md` — the action contract.

## Open exploration questions (feeds scout)
- Where is the **section toolbar** and does it have any Regen affordance today, or is wiring its Regen → `/api/regenerate-section` net-new there?
- The exact client path for element + section regen **post-rewrite** (to author the behavioral e2e that actually exercises them).
- Where does Button Settings render its **destination section**, how does `LinkPicker` currently mount beside it, and where does `Link.source` live (store? props?)?
- How does `followGoal`/GOAL_REF flow through the current destination section, so the consolidation preserves the goal-following CTA?
- Is the "Ask AI" trailing slot referenced anywhere beyond the shell (safe removal)?

## Candidate human gates
- **Regen e2e green (element + section)** — the load-bearing proof it survives the rewrite.
- **Founder eyeball:** Regen works live on text + section toolbars; after the LinkPicker consolidation a **goal-following CTA still follows the goal** (not just a static link).

## Acceptance criteria
- [ ] Regen surfaced in the t2 shell on the **text toolbar** (element regen) + **section toolbar** (section regen); existing Button/CTA Regenerate retained.
- [ ] An **e2e drives Regen through the toolbar** and asserts regenerated content lands — for **both** element regen (text) and section regen (section) — against `regen-modernization`'s routes. Any breakage found is fixed.
- [ ] The hidden "Ask AI" trailing slot is **removed**.
- [ ] `LinkPicker` **replaces** Button Settings' destination section (one destination editor, not two).
- [ ] A CTA set to **follow the page goal** (`followGoal`/GOAL_REF) still resolves correctly after the consolidation — covered by a test.
- [ ] No new credit cost/event; **zero published-side files** changed.
- [ ] `tsc` + `test:run` + build + lint green.

## Pilot / smallest slice
Two-item slice, no phasing needed beyond order. **Do the Regen verify first** (it's the potential live regression — fail-fast): wire section Regen + author the element+section e2e + fix anything it exposes. Then the LinkPicker→ButtonSettings consolidation with the goal-CTA preservation test. Decision gate = Regen e2e green **and** a goal-following CTA still follows its goal post-consolidation.
