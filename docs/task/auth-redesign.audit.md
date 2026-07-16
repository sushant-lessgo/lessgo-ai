# auth-redesign — audit (tier: light, single spawn)

## Inline plan (3 lines)
1. Copy `docs/Design/founder-image.png` → `public/`; add a shared Clerk `appearance` token map (`src/lib/clerkAppearance.ts`) restyling the default card onto handoff `1b` using `app-*` tokens only.
2. Add one shared two-column shell (`src/components/auth/FounderAuthLayout.tsx`): logo + Clerk widget + terms (left), founder photo + scrim + chip + promise + attribution (right); attach `.app-chrome` here.
3. Point `/sign-up` + `/sign-in` at the shell with copy props; add flow-scoped `localization` to the existing `ClerkProvider` (purely additive) for locked headings/sublines/footer links.

## Files changed
- `public/founder-image.png` **(new)** — copied asset
- `src/lib/clerkAppearance.ts` **(new)**
- `src/components/auth/FounderAuthLayout.tsx` **(new)**
- `src/app/sign-up/[[...sign-up]]/page.tsx` **(modified)**
- `src/app/sign-in/[[...sign-in]]/page.tsx` **(modified)**
- `src/app/layout.tsx` **(modified — additive only)**

## What changed, per file

### `public/founder-image.png` (new)
Straight copy of `docs/Design/founder-image.png` (189 KB) so the photo is servable. Referenced via `next/image` with `fill` + `priority`.

### `src/lib/clerkAppearance.ts` (new)
`authAppearance: Appearance` — the shared Clerk token map, exported once and consumed by both routes.
- `layout`: `logoPlacement:'none'` (our column renders the logo — prevents duplication), block social buttons on top (matches handoff order).
- `variables`: brand primary/text/danger/success, Onest, 12px radius.
- `elements`: card chrome stripped (`rootBox`/`cardBox`/`card` → no border/shadow/radius/padding/bg) so our column is the only frame; header/social/divider/fields/CTA/footer styled to handoff. Field + CTA styling deliberately mirrors the ui-foundation `input.tsx` / `button.tsx` primitives so the Clerk widget is indistinguishable from our own controls. Focus = border→`app-primary`, bg→white (handoff §Interactions).
- All `app-*` tokens — no ad-hoc hexes. Every handoff hex was already tokenised (`#006CFF`=`app-primary`, `#191922`=`app-ink`, `#7b7b86`=`app-muted`, `#e2e4ea`=`app-border-input`, `#ececf1`=`app-border`, `#b0b0ba`=`app-placeholder`).
- Element keys verified against the installed `@clerk/types` `ElementsConfig` (they are type-checked — an invalid key fails `tsc`).

### `src/components/auth/FounderAuthLayout.tsx` (new)
The one shared shell both routes reuse; differs only by props (`chipLabel`, `promiseTitle`, optional `promiseBody`) + the Clerk component passed as `children`. Server component (no `'use client'`). Full-viewport per handoff README (the 1140×724 card is presentational framing only). `.app-chrome` attached **here**, on a shell wrapper we own — never `<body>`, `/p/*`, `/preview/*`, or the editor canvas. Icons via `AppIcon` (`key`, `bolt`) — both already in the committed Material Symbols subset, so `icons.txt` needed no regeneration.

### `src/app/sign-up/[[...sign-up]]/page.tsx` / `sign-in/[[...sign-in]]/page.tsx` (modified)
Replaced the centered default-Clerk chrome with the shell + `authAppearance`. Copy per the locked spec. No auth logic, redirect, or Clerk prop touched.

### `src/app/layout.tsx` (modified — additive only)
Added **only** a `localization={authLocalization}` prop to the existing `ClerkProvider`. The `ui-foundation` font imports, `.app-chrome` scope import, preloads and all existing Clerk props are untouched.

## Decisions I made (spec ambiguity / judgment)

1. **CTA label is the one element `appearance` cannot match — left at Clerk's default. NEEDS FOUNDER DECISION.**
   Locked copy wants `Claim my seat` (sign-up) and `Log in` (sign-in). I verified in the installed `@clerk/types` that the primary-button label is a **single global localization key** (`formButtonPrimary`, index.d.ts:6070) — the only flow-scoped variant is `resetPassword`. `localization` is **provider-level only** (`ClerkOptions`, :8146); there is no per-component `localization` in v6. So the two routes cannot carry different CTA labels, and setting it globally would leak into `UserButton`/`UserProfile` save buttons.
   The spec's escape hatch ("upgrade ONLY that element to Clerk Elements") is not mechanically available: `@clerk/elements` is **not installed** (adding a dep + rebuilding the form is out of scope), and Elements replaces the whole form rather than one button.
   Per the conservative rule I did **not** ship a CSS `::before`/`content` text swap — it breaks the loading/spinner state and the button's accessible name, and I cannot visually verify it here. Both CTAs therefore read Clerk's default (**"Continue"**). Everything else in the locked copy is verbatim. Options if the founder wants the exact labels: (a) accept "Continue"; (b) approve `@clerk/elements` as a follow-up; (c) approve the CSS swap knowingly.

2. **Used flow-scoped `localization` rather than hiding Clerk's header/footer.** Rendering our own heading in JSX would have required hiding Clerk's `header`, which also removes the headings on Clerk's *later* steps (e.g. "Verify your email"), leaving a bare code input — a real UX regression. `signUp.start.*` and `signIn.start.*` are distinct namespaces, so both can be set with zero collision, multi-step headings survive, and no shared key is touched.

3. **Chip copy taken verbatim from the spec** (`invite-only · founding cohort`, `founding cohort`) even though handoff `1b` capitalises it ("Invite-only · …"). Spec is the locked source of truth; lowercase is self-consistent across both routes. Trivially flippable.

4. **Attribution kept as the handoff's two-line block** ("Sushant Jain" / "Founder & CEO, Lessgo.ai" + the `bolt` "Founder on speed-dial" pill) rather than the spec's shorthand `Sushant Jain · Founder & CEO` — read the "·" as shorthand for the same content, and the spec defers to handoff `1b` for this panel.

5. **Caveat accent: SKIPPED.** The README lists it as optional; handoff `1b`'s markup uses no Caveat anywhere, so there was no clean mock-matching placement to copy. Spec explicitly allows skipping.

6. **Terms line sits below Clerk's footer link, not above it.** Handoff order is CTA → terms → "Log in". Clerk renders its footer action inside its own card, so our terms line (outside the widget) lands after it. Interleaving would require hiding Clerk's footer (see #2). Minor visual ordering deviation.

7. **Ad-hoc values retained only where no token exists**: the photo scrim gradient, the two text-shadows, and the on-photo text tints `#dbe3f5` / `#c6d2ee`. These are photographic-legibility values unique to this panel with no `app-*` equivalent; taken verbatim from the handoff. All *chrome* colours are tokens.

8. **Responsive:** below `lg` the photo panel is hidden and the form column goes full-width. A no-break fallback, not a designed breakpoint (spec scopes mobile out).

## Gate results (all run in the worktree)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **GREEN** — exit 0, no output |
| `npm run test:run` | **GREEN** — 193 files passed / 1 skipped; 3331 tests passed / 18 skipped |
| `npm run lint` | **GREEN** — no errors (warnings only, all pre-existing repo-wide) |
| `npm run build` | **GREEN** — compiled; `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]` both 416 B / 244 kB |

**Note on the first tsc run:** it initially failed with `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — a file I never touched. I verified it was **pre-existing** by stashing all my changes and reproducing it on the clean tree. Cause: `next-env.d.ts` (gitignored, generated by `next build`) did not exist yet in this fresh worktree, so Next's image-module type declarations were absent. `npm run build` generated it and tsc has been clean since. Not caused by, and not masked by, this change.

The ui-foundation isolation guards stayed green: the `published-css.sha256` and tailwind config-freeze tests are part of the passing suite, and the hash was checked against the **fresh** build artifact — generated pages are byte-identical.

## Left for the founder's manual pass
- **Decide the CTA label question (decision #1)** — the only locked-copy item not shipped verbatim.
- Eyeball `/sign-up` + `/sign-in` against handoff `1b` on a real viewport: photo crop/focal point at various widths (`object-cover` may crop the face on short/wide screens), scrim strength over the real photo, and Clerk's field spacing vs the mock.
- Confirm auth flows end-to-end post-wrap (unchanged by design, but worth one pass): Google OAuth, email+password sign-up incl. the **email-verification step** (styled via `formHeaderTitle`/`otpCodeFieldInput` — not visually verified here), sign-in, and forgot-password.
- Clerk's "Secured by Clerk" / development-mode notices still render inside the widget footer (removal is a Clerk plan setting, not an `appearance` option).

## Open risks
- Clerk owns the widget's internal DOM; a future `@clerk/nextjs` major could shift element keys and silently drop styles. Keys are type-checked, so `tsc` will catch renames of typed keys, not restructures.
- `next/image` with `fill` on the founder photo requires the parent to stay `relative` — it is; noted for future edits.

## Founder ruling — CTA label (2026-07-16)

**Decision: ACCEPT Clerk's default "Continue" on both routes.** Spec's locked copy
("Claim my seat" / "Log in") is NOT met, knowingly.

**Why it's not achievable as specced:** Clerk exposes `formButtonPrimary` as a single
top-level localization key (verified in `@clerk/types` dist — there is no
`signUp.start.formButtonPrimary`). Sign-up and sign-in therefore physically cannot carry
different primary-button labels via `localization`.

**Options considered and rejected:**
- `@clerk/elements` — not installed; replaces the whole form, out of scope for tier=light.
  May be revisited as a separate spec if the label matters commercially.
- CSS `::before` text swap — rejected: breaks the loading-spinner state and the button's
  accessible name (screen readers would announce the wrong action).

All other locked copy is verbatim. Acceptance criterion "copy per route as locked" is
partially unmet by this ruling — recorded here so it is not re-litigated.
