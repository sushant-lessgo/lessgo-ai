# Audit — qa-0718 auth CSS (B8, B9)

## Files changed
- `src/components/auth/FounderAuthLayout.tsx`
- `src/lib/clerkAppearance.ts`

(No `.published.tsx` counterpart — these are app-chrome/auth files, not dual-rendered landing blocks; parity rule N/A.)

---

## B8 — Sign-up founder/side photo overflowing (S1)

**File:** `src/components/auth/FounderAuthLayout.tsx`

**Change:** root shell wrapper
- before: `class="app-chrome flex min-h-screen w-full bg-app-surface"`
- after: `class="app-chrome flex min-h-screen w-full overflow-x-hidden bg-app-surface"`
(added `overflow-x-hidden`)

**Reasoning (before→after):** The founder photo lives in the right panel, which already
has textbook containment — `relative` + `overflow-hidden` + Next `<Image fill>` +
`object-cover`. With that combination the image is absolutely positioned to 100% of the
panel and cropped, so it *cannot* overflow the panel itself. The residual exposure is a
horizontal bleed at the shell boundary (e.g. the Clerk widget's intrinsic min-width, or
any wide flex child, producing horizontal scroll that reads as the photo panel spilling
past the viewport's right edge). Adding `overflow-x-hidden` to the shell guarantees no
child can produce horizontal overflow/bleed at desktop or mobile. `overflow-x-hidden`
(not `overflow-hidden`) is deliberate: it clips only the horizontal axis, so a tall Clerk
form is never vertically clipped and the embedding is not broken.

**Why no unit test:** pure CSS/layout containment; no logic branch to assert. Vitest/jsdom
does not compute layout box geometry (no real overflow), so any assertion would be inert
(see MEMORY "Inert test assertions"). Verified by box-model reasoning + reading the JSX.

---

## B9 — "Claim your founding seat" heading clipped on the left (S2)

**File:** `src/lib/clerkAppearance.ts` (owns the heading's styling)

**Ownership note:** the heading text is a Clerk localization string
(`layout.tsx` › `authLocalization.signUp.start.title = 'Claim your founding seat'`) rendered
by Clerk's `headerTitle` element. Its styling is owned by `clerkAppearance.ts`
(`headerTitle: '... text-[28px] font-extrabold ... tracking-[-0.8px] ...'`). The clipping
container is Clerk's `card`/`cardBox`, also owned here. `layout.tsx` was NOT touched (only
supplies the copy string, not visual layout).

**Change:** `elements.cardBox` and `elements.card` — added `overflow-visible`.
- cardBox before: `w-full max-w-none rounded-none border-0 bg-transparent shadow-none`
- cardBox after: `w-full max-w-none overflow-visible rounded-none border-0 bg-transparent shadow-none`
- card before: `w-full gap-0 rounded-none border-0 bg-transparent p-0 shadow-none`
- card after: `w-full gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none`

**Reasoning (before→after):** Clerk's default card chrome ships `overflow: hidden` (to clip
its rounded corners). We render the card rounded-none / transparent / borderless with `p-0`,
so the header title box begins at the card's left edge (x=0). The title is `font-extrabold`
with tight negative letter-spacing (`tracking-[-0.8px]`); the leading glyph's ink extends a
hair left of the pen origin (x<0), which the card's hidden overflow was clipping — the
reported cut-off "C" / left edge. Setting the card containers to `overflow-visible` lets that
sub-pixel ink render outside the box, un-clipping the heading. This preserves left alignment
(all fields/subtitle stay at x=0) — unlike a left-padding fix, which would indent the title
relative to the rest of the form. Safe because the card has no rounded corners / background /
shadow that relied on the clip.

**Why no unit test:** pure CSS token change in an appearance map; nothing executes. jsdom
does not render glyph ink overflow, so any test would be inert. Verified by reasoning about
the Clerk element hierarchy + box model.

---

## Constraints honored
- Clerk `<SignUp>` embedding untouched (only presentational tokens / a containment class).
- OAuth/provider config NOT touched (B3 is separate/config-only).
- No files edited outside the auth-layout surface.

## Test results
- `npx tsc --noEmit`: my two files produce **zero** errors. Two pre-existing/concurrent
  errors remain on this shared `fix/qa-0718` branch, both OUTSIDE my scope:
  - `src/app/page.tsx(6,26)` — missing module `@/assets/images/founder.jpg` (pre-existing).
  - `src/modules/wizard/work/rail.ts(217,3)` — mid-flight rail-cluster fix (B5/B6/B7,
    another implementer).
- No unit tests added — both bugs are pure CSS/layout (rationale per bug above).

## Deviations
- **B8:** The right-panel image already had correct containment in the pre-existing code
  (`overflow-hidden`+`fill`+`object-cover`), so a literal "image overflows its own panel"
  defect could not be reproduced by box-model reasoning. Conservative choice: harden the
  shell with `overflow-x-hidden` to eliminate any horizontal bleed (the only remaining path
  by which the photo could appear to overflow), rather than altering the already-correct
  image classes or guessing at `object-position` cropping. Logged here per the in-scope
  ambiguity rule.

## Open risks
- B8: if the true QA symptom was subject *cropping* (founder's face/body framed poorly) rather
  than a CSS overflow, the fix here won't reframe it — that would need an `object-position`
  tweak on the `<Image>` (still within `FounderAuthLayout.tsx`). Needs a visual re-check on the
  preview deploy to confirm the overflow is gone.
- B9: fix assumes Clerk's card is the clipping ancestor (its default `overflow:hidden`). If a
  Clerk version change drops that default, the fix is a harmless no-op; confirm on preview.
