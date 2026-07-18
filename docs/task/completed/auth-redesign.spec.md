---
tier: light
tier-why: Clerk `appearance` wrap + custom two-column page JSX; auth flows/middleware untouched (Clerk still owns validation/OAuth/security). ~3-5 files, no risky logic surface.
---

# auth-redesign — spec

## Problem / why
Sign-up/sign-in today are the default Clerk `<SignUp/>`/`<SignIn/>` card in minimal chrome
(`src/app/sign-up/[[...sign-up]]/page.tsx`, `sign-in/[[...sign-in]]/page.tsx`). The designer
handoff (Auth `1b`) redesigns this into a branded, invite-only "founding cohort" experience.
Lane-1 redesign spec #2 (after `ui-foundation`).

## Goal
Reskin auth into the handoff's two-column founder layout: custom form (left) + full-bleed
founder photo panel (right, scrim + chip + promise + attribution). Same layout for both
sign-up and sign-in; only copy differs. Clerk keeps owning the actual auth logic — we wrap
and restyle, we do not rebuild the flow.

## Approach (decided)
- **Clerk `appearance` API + custom page wrapper.** Mount Clerk's `<SignUp/>`/`<SignIn/>`
  inside our own two-column layout; restyle the form widget via Clerk's `appearance` token
  map. The two-column shell, founder photo, scrim, chip, promise, and attribution are our
  own JSX. Clerk continues to own validation, error states, Google OAuth redirects, bot
  protection. (Elements/headless was rejected — the handoff form maps 1:1 to Clerk's default
  card field set, so `appearance` suffices. If, during build, a single element genuinely
  can't be matched via `appearance`, upgrade ONLY that element — do not rebuild the form.)

## Scope IN
- One shared **two-column auth layout** component: form column (left) + founder panel (right).
- Restyle Clerk `<SignUp/>` and `<SignIn/>` via `appearance` to match handoff: Google SSO
  button, email + password fields, primary CTA, terms line, focus/hover states
  (focus border `#006CFF`, bg→white per handoff).
- Founder panel: real founder photo, dark scrim, status chip, promise copy, attribution.
- **Final copy (locked):**
  - **Sign-up** — chip: `invite-only · founding cohort`; CTA: `Claim my seat`;
    footer: `Already have an account? Log in`; promise paragraph + `Sushant Jain · Founder & CEO`
    (use handoff `1b` promise copy as final).
  - **Sign-in** — heading: `Welcome back`; subline: `Pick up where you left off.`;
    Google button: `Continue with Google`; CTA: `Log in`;
    footer: `New here? Claim your seat` → sign-up; chip: `founding cohort`;
    promise line: `Glad you're back. Let's ship something today.`;
    attribution: `Sushant Jain · Founder & CEO`.
- Use `ui-foundation` tokens + primitives (Onest, colors, radius, buttons/inputs/chips).
- Optional Caveat handwritten accent (handoff notes it for Auth) — include if it matches
  the mock cleanly; skip if fiddly.

## Scope OUT (non-goals)
- No changes to auth **logic/flow/middleware** — no `src/middleware.ts`, no Clerk config,
  no session/redirect behavior. Pure presentation.
- No new auth methods (no magic-link/passkey additions).
- No `welcome` page redesign (`src/app/welcome/page.tsx`) — separate/out of this spec.
- No waitlist/invite-gating logic changes (persona gate lives in `/api/start`, untouched).
- No responsive/mobile design pass (desktop-first; ensure it doesn't break, don't design
  breakpoints).

## Constraints
- Depends on **`ui-foundation` merged first** — consumes its tokens/primitives. Do not
  start implementation until foundation lands.
- Founder photo asset: `docs/Design/founder-image.png` → copy into `public/` and reference.
- Match handoff `1b` closely (two-column 1140×724 card framing is presentational; real
  screen is full-viewport per handoff README).
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Auth.dc.html` (`1b`)
  — exact structure/spacing/color/copy of the two-column layout; read markup directly.
- Handoff README §Auth + §Interactions (focus/hover states, Caveat accent).
- `src/app/sign-up/[[...sign-up]]/page.tsx`, `src/app/sign-in/[[...sign-in]]/page.tsx`
  — current pages to replace.
- `docs/Design/founder-image.png` — production founder photo.
- `docs/task/ui-foundation.spec.md` — token/primitive source this consumes.
- Clerk `appearance` prop docs — the styling mechanism.

## Open exploration questions (feeds scout)
- Current Clerk theme/appearance config (if any) in `src/app/layout.tsx` / provider — where
  to centralize the `appearance` token map.
- Does Clerk's default card expose all needed slots for the handoff form via `appearance`
  (Google button, CTA label, terms line), or is one element resistant → single-element upgrade?
- How the shared two-column layout is best factored so both routes reuse it with copy props.

## Candidate human gates
- Copy is locked in this spec — no gate needed.
- (Founder QA is manual: eyeball sign-up + sign-in against handoff `1b`, confirm Google
  OAuth + email/password flows still work end-to-end after the wrap.)

## Acceptance criteria
- [ ] Both `/sign-up` and `/sign-in` render the two-column founder layout, copy per route
      as locked above.
- [ ] Form widget (Clerk) restyled via `appearance` to match handoff — fields, Google button,
      CTA, focus/hover states.
- [ ] Founder photo panel: real photo, scrim, chip, promise, attribution.
- [ ] Auth flows unchanged and working: Google OAuth + email/password sign-up and sign-in.
- [ ] Built on `ui-foundation` tokens/primitives (no ad-hoc colors/fonts).
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
Single atomic reskin (not phased). Layout is one shared component; the two routes differ
only by copy props + which Clerk component they mount.
