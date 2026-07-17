---
tier: standard
tier-why: Reuses existing (flag-gated) work generation + E1 reveal — does NOT modify credit/generation logic; new surface = the plan-editor UI + a Brief.structure write on the journey seam (loadStep? reuse, no widening). Auto-escalates to full if scout finds it must modify the generation/credit path.
---

# work-onboarding-plan (E4) — spec

## Problem / why
The work-vertical onboarding journey (`docs/tracks/workEndtoEnd.md`) has E1 (shell+rail), E2 (photo
ingestion), E3 (questions) merged — but after the questions the journey **dead-ends**: there's no
step that shows the user their site before it's built, and nothing wires the collected inputs to
an actual generated site. E4 is workEndtoEnd **step 4**: the visual site-plan gate + the
approve→build handoff. It's also the step that turns the E1–E3 pilot from "collects inputs" into
"produces a real site."

## Goal
Add the plan step: a visual site-plan screen that shows the user their proposed site — what pages,
what's on each, what each page asks visitors to do — using their **real ingested content**, lets
them make a few high-level edits, and on approval writes `Brief.structure` and **fires the existing
work generation**, landing them on **E1's existing reveal**. E4 builds the **plan screen only** — it
reuses the generator and the reveal.

## Scope OUT (non-goals)
- **Look-picker-during-wait** — deferred. Only the Atelier skin exists (no Kontur/Pulse, no designed
  spacing/type/palette coordinates yet), so a picker today would have nothing to pick. The wait
  shows **honest progress only**. The picker lands as its own step once the look system
  (skeleton/atelier-cutover/Kontur spike) is ready. (Not even an empty placeholder slot — founder ruling.)
- **New generation logic** — reuse the existing flag-gated work copy-engine fan-out (Phase C). Do
  not modify it.
- **New reveal** — reuse E1's shipped reveal (iframe + SAMEORIGIN, P6).
- **Section-level editing** (rearranging sections within a page) — that's the editor's job.
- **Modifying credit / generation code** — E4 *invokes* the existing gated path. If it turns out it
  must modify that path, `/feature` auto-escalates to full.
- **A third journey-seam mechanism** — E4 is a rich interactive step → reuses E2's `loadStep?`
  component-injection; never a new seam widening.
- Non-Kundius fixtures / other professions / other engines — later.

## Constraints
- **Seam rule (non-negotiable, from the E2/E3 incident):** reuse E2's `loadStep?` component-injection
  for this rich interactive step. E3's `questions()` data method is for Q&A steps only. No third
  widening of the founder-signed journey seam (`engines/journey/engines/types.ts`).
- **Brief.structure written BEFORE copy** (scalePlan invariant): plan edits land in
  `Brief.structure.pages` *before* generation fires ⇒ a removed page = no copy generated for it. The
  approved plan **is** the generation input.
- **Zero internal vocabulary in the UI** — plain-word section rows + one-line descriptions;
  plain-language goal badge per page (the buyer-words list). Never Hero/Testimonial/CTA/Collection.
- **Real ingested content in the plan** — the user's E2 photos + E3 facts appear where they'll go
  (the "MY site, not a demo" moment).
- **Tap-powers deliberately few:** add/remove page (from a designed set), rename, reorder, change a
  page's goal, swap which work leads. NOT section-level rearranging.
- **Approve = fire the build** (workEndtoEnd ordering). Firing spends credits + fans out N AI calls
  (known FREE-tier 429 fan-out risk — backlog #32/#33 / bugs table; not E4's to fix, but be aware).
- **Dev-only + flag-gated**, not prod-reachable until atelier-cutover + flag-on (same posture as
  E2/E3, D7b — merges zero prod-reachable behavior).
- Rides the big-bang batch (unpushed). Re-green = tsc + test:run + build + lint.

## References
- `docs/tracks/workEndtoEnd.md` **step 4** — acceptance source, incl. the layout sketch — and the
  buyer-words table (§ "The words users see").
- **E2 `loadStep?` seam** — the component-injection pattern to reuse. `work-onboarding-ingestion`
  merged `40e990e1`; plan/audit in `docs/task/completed/`.
- **E1 shell + rail + reveal** (P6 iframe+SAMEORIGIN) — `work-onboarding-shell` `cd324f42`.
- Work page/section vocabulary + designed page-set: `engines/workSections.ts`, page archetypes
  (`pageArchetypes.ts`), structure on `Brief.structure` — **scout to confirm exact paths.**
- Work generation to trigger: `src/modules/audience/work/` (strategy + generate-copy) + the
  multi-page fan-out; flag `NEXT_PUBLIC_WORK_COPY_ENGINE`.
- Kundius fixture (the E2/E3 pilot fixture).

## Open exploration questions (scout)
- The exact `loadStep?` seam contract as E2 left it — the shape to reuse for E4's rich step.
- The "designed set" of work pages a user can add/remove — where defined (work-engine page
  archetypes)? Is it a fixed set?
- How the approved plan maps to `Brief.structure.pages`, and how the existing work generation reads
  it (the structure→generation contract).
- Where E1's reveal is triggered from — the handoff point E4 lands on after generation completes.
- Does firing generation from onboarding already have a trigger, or does E4 wire it fresh? Which
  credit-check / rate-limit path does it go through?
- How E2's ingested photos are addressed for display in the plan (group references, per skeleton rule).

## Candidate human gates
- **Founder pilot gate:** see Kundius's plan rendered from real content → edit it → approve → get a
  real generated site in the reveal. Taste + correctness sign-off.
- Any point where E4 would need to **modify** (not just call) the generation/credit path → stop +
  escalate to full.
- Firing a real generation spends credits — run the pilot on a **funded dev account**.

## Acceptance criteria
- [ ] The plan step renders after E3, via the reused `loadStep?` seam (no new seam mechanism).
- [ ] Kundius's plan shows real pages + real ingested photos + plain-word section rows w/
      descriptions + a plain-language goal badge per page. Zero internal vocabulary visible.
- [ ] The "What we understood" rail stays present (journey-wide rule).
- [ ] Tap-powers work: add/remove page (designed set), rename, reorder, change page goal, swap lead
      work. Section-level editing is NOT offered.
- [ ] Approving writes the edited plan to `Brief.structure.pages` (removed page ⇒ not generated).
- [ ] Approve fires the existing work generation and lands on E1's reveal showing a real generated
      Kundius site.
- [ ] Wait shows honest progress (no fake spinner; no look-picker).
- [ ] Dev-only + flag-gated; merges zero prod-reachable behavior.
- [ ] tsc + test:run + build + lint green.

## Pilot / smallest slice
One fixture, end to end: **Kundius plan → edit → approve → `Brief.structure` → fire existing
generation → E1 reveal**, dev-only + flag-gated. **Decision gate = founder sees Kundius's plan,
tweaks it, approves, and gets a real site back in the reveal.** One fixture proves the whole chain;
other professions/engines and the look-picker come after.
