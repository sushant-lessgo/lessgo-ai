---
tier: standard
tier-why: bounded bug-fix (get `facts.work` to where the regen route reads it); brushes editor store `aiActions` + the work regen route → one impl-review. Auto-escalates to full if scout finds it needs real store surgery.
---

# facts-work-writeback — spec

## Problem / why
A **live in-editor work story-interview submit 400s** — `"brief.facts.work is required for work
story regeneration"` (`src/app/api/audience/work/regenerate-story/route.ts:165`). Kundius (and any
work customer) opens the editor to improve her **"About / your story"** section, runs the
answer-a-few-questions rewrite tool, submits → the app errors and she can't regenerate her story.
Dead end. This **blocks editing a generated work site**, so it's a work-beta blocker.

Root cause (work-copy-engine audit + this session's blindspot pass): the regen route reads the
facts from the **stored** brief — `getWorkFacts(storedBrief?.facts)` (`route.ts:159`) — and 400s
when `Project.brief.facts.work` is missing/empty at the point the editor calls it. The onboarding
wizard carries `facts.work` in a transient store snapshot (`useWizardStore.briefFacts`), but the
editor path (`StoryInterviewPanel.tsx` → `regenerateStoryFromInterview` in
`src/hooks/editStore/aiActions.ts`) doesn't get `facts.work` to where the route reads it.

(Already fixed since the audit: `regenerateStoryFromInterview` **is** now typed on
`src/types/store/actions.ts:504` — the old "untyped action" half is done. Scope here is the
`facts.work` availability only.)

## Goal
Make the in-editor story-interview regeneration **succeed** (no 400) — ensure `facts.work` is
present where the regen route reads it for a generated work project. Narrow: fix the broken tool so
a work customer can regenerate their About/story from the editor.

## Scope OUT (non-goals)
- **Full editor ↔ work-facts writeback** (the "wide" option) — per-field editor edits (price,
  services, establishment…) flowing back into `facts.work` so *all* regens see live edits. That's a
  separate, bigger feature; not this bug-fix. Backlog it if not already tracked.
- Changing the work copy prompt / story generation quality.
- Any onboarding-side (wizard) `facts.work` behavior — that path works; this is the editor path.
- Other regen routes (section/element/content) — only the work story regen.

## Constraints
- The fix must make `facts.work` available for an **existing/generated** work project opened in the
  editor — not only freshly-onboarded in-memory ones. (Kundius's project already exists.)
- Do NOT weaken the route's guard — `facts.work` genuinely required for a work story regen; the fix
  supplies it, it does not bypass the check.
- Editor↔published parity + the work generation contract untouched (this is data availability, not a
  content-shape change).
- Rides the big-bang batch. Re-green = tsc + test:run + build + lint.

## References
- `src/app/api/audience/work/regenerate-story/route.ts:159,165` — reads `getWorkFacts(storedBrief?.facts)`; the 400.
- `src/hooks/editStore/aiActions.ts:312` — `regenerateStoryFromInterview` (the editor caller; `fetch` at :344).
- `src/app/edit/[token]/components/StoryInterviewPanel.tsx` — the UI that triggers it.
- `useWizardStore` (`briefFacts` snapshot) — how the wizard path carries `facts.work`; the pattern the editor path lacks.
- `getWorkFacts` + `commitRail` (`components/onboarding/journey/engines/work.ts`) — how onboarding builds/writes work facts.
- `src/app/api/audience/work/generate-copy/route.ts:140` + `strategy/route.ts:75` — same `getWorkFacts(brief.facts)` requirement at first-gen (confirm where `facts.work` gets persisted).

## Open exploration questions (scout)
- **Does it still repro?** Confirm a generated work project's in-editor story-interview 400s today.
- Is `facts.work` **persisted to `Project.brief`** at onboarding/first-gen, or only ever transient
  in the wizard store? (This decides fix shape: read-and-send from the loaded project vs.
  persist-then-read.)
- Where does the editor hydrate the project's `brief` — does `brief.facts.work` survive the load?
- Does `regenerateStoryFromInterview` send a brief in its request, or does the route load the stored
  brief itself (so the fix is persistence, not payload)?
- Kundius's actual project — does its stored `Project.brief.facts.work` exist? (informs backfill need)

## Candidate human gates
- **Founder verify (the pilot):** on a Kundius work project, editor → story-interview → submit → About regenerates, no 400.
- If the fix needs **modifying stored `Project.brief`** for existing projects (backfill) → confirm before touching persisted customer data.

## Acceptance criteria
- [ ] Repro confirmed, then fixed: a generated work project's in-editor story-interview submit
      **succeeds** (no `brief.facts.work is required` 400); the About regenerates.
- [ ] Works for an **existing** work project opened in the editor, not just a fresh in-memory one.
- [ ] The route's `facts.work` guard is still intact (supplied, not bypassed).
- [ ] No regression to the onboarding-wizard story path or first-gen.
- [ ] tsc + test:run + build + lint green; a test covers the editor story-regen path succeeding.

## Pilot / smallest slice
Single phase: a Kundius work project → open editor → run the story-interview → submit → the About
regenerates with no 400. That IS the fix. Standard tier: scout (confirm repro + where `facts.work`
lives) → plan → implement → one impl-review.
