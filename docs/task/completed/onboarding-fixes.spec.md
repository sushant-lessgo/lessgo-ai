# onboarding-fixes — spec

> Source: `docs/reports/app-ui-ux-assessment.md` §1.3, §3 P1, §3 P0 (style step). Onboarding is the strongest surface — these are targeted fixes, not a rebuild.

## Problem / why
The 8-step onboarding is the best surface in the app but has seed/step defects that plant bad content and dead clicks:
- **Step 6 (Style): stub — zero controls**, just "we'll use a clean default theme". Dead click.
- Step 4 (Offer): prefilled with the **product name**, not an offer-shaped phrase.
- Step 5 (Proof): "Concrete numbers you can claim?" prefilled with **non-numeric fluff** ("Improved invoice tracking efficiency") — contradicts its own label, plants unverifiable claims.
- Step 3 (Goal): Continue stays disabled until destination link filled or "Skip for now" clicked — skip link easy to miss; users stall.
- Step 7 (Structure): sections all REQUIRED/none togglable while copy promises "Turn off anything you don't need"; "Collections › Products · 0 items" meaningless for SaaS persona; Continue clickable mid-"Drafting…" spinner.
- Step 8 (Building): all-green then ~5–10s stall before auto-redirect with Continue disabled — "is it stuck?" feeling.
- Understanding step: condenses niche one-liner into generic classification ("your Accounting software") — loses the niche on first AI impression.

## Goal
Every onboarding step either does something real or is removed, and prefilled seeds match their field's shape (offer looks like an offer, proof is numeric-or-empty) so users don't publish planted junk.

## Scope IN
- Step 6 Style: real picker (typeface trio + palettes — already exists in editor Style popover) **or** remove the step (8 → 7).
- Step 4 Offer: seed an offer-shaped phrase (or leave empty w/ placeholder), not the product name.
- Step 5 Proof: prefill only actual numbers, else empty with a clear placeholder.
- Step 3 Goal: make "Skip for now" prominent, or make Continue always active with link optional.
- Step 7 Structure: make optional sections actually togglable; hide "Products · 0 items" for non-ecom personas; disable Continue during "Drafting…".
- Step 8 Building: remove the post-green stall / clarify the wait (skeleton or honest "finalizing…"); don't show a disabled Continue.
- Understanding step: keep the niche words (less aggressive generic classification).

## Scope OUT (non-goals)
- Rebuilding onboarding structure/microcopy (it's good — keep).
- Generation pipeline / element schema changes (template-is-a-skin invariant).
- New template/palette systems (reuse existing editor Style controls).
- Service-persona onboarding rework (audit was product flow; apply analogous fixes only where trivially shared).

## Constraints
- Style picker must reuse existing controls (editor Style popover: typeface trio + 9 accent palettes) — do not invent a new picker.
- Seed changes are prompt/prefill-shaped; must not change the copy-generation contract.

## References
- `/onboarding/product/[token]`; wizard under `src/components/onboarding/wizard/` (`WizardShell.tsx`).
- `useProductGenerationStore`.
- Editor Style popover (source of the picker to reuse).
- Report §1.3.

## Open exploration questions
- Where are per-step prefill seeds computed (offer, proof, understanding condensation)?
- Where is the Style-step component and what would wiring the existing picker require?
- Where does the page-plan (Step 7) decide required vs optional, and where is "Products · 0 items" gated by persona?
- What causes the Step-8 post-green stall before redirect?

## Candidate human gates
- None obvious (no schema/auth/publish/prod-data). Confirm if Style-picker reuse touches shared editor state.

## Acceptance criteria
- [ ] Step 6 either has working controls or is gone (no dead-click step).
- [ ] Offer seed reads like an offer; Proof seed is numeric or empty-with-placeholder.
- [ ] Goal step: user can't stall — skip is obvious or Continue always active.
- [ ] Step 7: optional sections toggle; no "Products · 0 items" for SaaS; Continue disabled mid-draft.
- [ ] Step 8: no confusing post-green stall / disabled Continue.
- [ ] Understanding step keeps the niche, not just a generic category.

## Pilot / smallest slice
Batch the P0-ish + cheap seed fixes first (Style step decision, offer/proof seeds, goal skip, page-plan toggles). Building-step stall + understanding specificity as a second pass. Gate: a first-time user completes onboarding without a dead click and without planted fake proof.
