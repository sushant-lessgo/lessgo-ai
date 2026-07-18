# Bug round `qa-0718`

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\qa-0718`
- **Branch:** `fix/qa-0718` (off `main`, the frozen beta RC)
- **Source:** `docs/qaTest/bugs18July.md` (founder QA, work-engine onboarding + auth + dashboard + pricing)
- **Audit:** `docs/task/bugs-qa-0718.audit.md`

## Scope decisions (founder, 2026-07-18)
- Pricing **P1 ("Founding")** + **P2 (price numbers)** → **OUT of round** (reconcile with pricing-v2 spec separately).
- **O1 engine-divider** + **O12 page/section mgmt in preview** → **OUT** (features → /discuss+/feature).
- Round scale → **all BUG + HOTFIX** (16 items).
- **CONFIG (founder-owned, no code):** D2 free-plan display; O13 kill-switch (`NEXT_PUBLIC_WORK_COPY_ENGINE`).
- **NOT A BUG:** O6 (Wedding edit auto-syncs "what you sell" — working as intended).
- ⚠️ Overlap risk: auth (S*) / dashboard (D*) / onboarding (O*) all have active POST-beta feature branches (`auth-redesign`, `dashboard-*`, `work-onboarding-*`). This round patches `main` for beta; flag reconciliation at merge/next-integration.

## Progress log (resume anchor — one line per bug)
- B1 O9 photos vanish: FIXED+REVIEWED(ship)+COMMITTED 905ef900 (w/ B14,B16-O8) — board+continue repointed to `committedGroups`; ShowWorkStep.test.tsx 4 cases green.
- B14 O5 hide merge/tidy: COMMITTED 905ef900 — BETA-HIDDEN (also hides in dashboard WorkLibraryClient CorrectionBoard; confirmed non-breaking).
- B16-O8 dual buttons: COMMITTED 905ef900 — single committedGroups-gated CTA.
- B2 D4 dashboard input disabled: OUT OF ROUND (founder: leave it; engineDecider feature will route dashboard entry → work onboarding). No tooltip/copy change this round.
- B3 S4 GitHub SSO shown: CONFIG (no code) — founder disables GitHub in Clerk Dashboard → SSO Connections; Google stays. Diagnosed hi-conf: sign-up uses stock <SignUp/>, no code provider list anywhere.
- B4 P3 Account settings → persona: OUT OF ROUND (founder: requires feature). Real account-settings page never built; track as feature.
- B5 O3+O4 uploads leak to "what you sell": FIXED+REVIEWED(ship, loop1: caught+fixed chip-edit data-loss)+COMMITTED 1c95aea8 — display filter + preserve uploads at commitGroupChips gate + round-trip test.
- B6 O10 charge: COMMITTED 1c95aea8 — WHAT YOU CHARGE rail row.
- B7 O2 price position: COMMITTED 1c95aea8 — null unless genuine signal.
- B8 S1 / B9 S2 auth: COMMITTED f6fe284e (B8 verify visually on preview).
- B6 O10 charge not in rail: FIXED (standard, IN REVIEW) — new read-only "WHAT YOU CHARGE" rail row + representative `priceLabel`, skeleton until amount-bearing. Deviation: test uses applyRailEdit door (commitGroupPrice unexported/drops currency) — faithful. audit.rail.md.

### Implementation waves (all diagnoses in)
- **Wave 1 (parallel, disjoint, decision-independent):** A=rail cluster B5+B6+B7 (`rail.ts`,`work.ts`,`proposeGroups.ts`,`workFacts.schema.ts`,tests) · B=show-work UI B1+B14+B16-O8 (`ShowWorkStep.tsx`,`CorrectionBoard.tsx`,test) · C=auth CSS B8+B9 (sign-up page/layout).
- **Decisions gating Wave 2:** B2 (tooltip vs feature), B4 (minimal reframe vs feature).
- **Wave 2 (after W1+decisions):** dashboard B11+B12+B13 (+B2/B4 if in-round) · group E B15+B16-O11.
- **Wave 3 (last, alone):** B10 "Lessgo"→"Lessgo AI" sweep.
- Audit split per group to avoid concurrent-write races: `bugs-qa-0718.audit.{rail,showwork,auth,dashboard,journeyE,naming}.md`.
- B7 O2 premature "Mid-range": FIXED (standard, IN REVIEW) — `deriveRailPricePosition` returns null unless genuine signal (stated amount OR premium/friendly keyword via canonical rubric w/ prices neutralized); rubric untouched; rail.test.ts:182 flipped. audit.rail.md.
- B8 S1 sign-up photo overflow: FIXED (hotfix) — `overflow-x-hidden` on FounderAuthLayout shell root. CONSERVATIVE guard (image panel already contained); VERIFY visually on preview.
- B9 S2 heading left-cut: FIXED (hotfix) — `overflow-visible` on Clerk cardBox+card (bold headerTitle neg-tracking ink was clipped by Clerk's overflow:hidden). `clerkAppearance.ts`.
- B10 S3 "Lessgo" → "Lessgo AI" (auth + sweep): pending
- B11 D1 dashboard logo: COMMITTED f14b7d42 — transparent lessgo-logo.png wordmark (no box, ~30px) in AppSidebar; next/image 152×40.
- B12 D3 welcome block bigger: COMMITTED f14b7d42 — heading 34→46px etc; disabled input (R17b) untouched.
- B13 D5 CTA copy: COMMITTED f14b7d42 — "New site with AI"→"Create my new website" (single source) + e2e guards.
- B14 O5: COMMITTED 905ef900 (see above).
- B15 O7 "Something wrong?" remove: COMMITTED 52c1c8a0 — NoteBox render BETA-HIDDEN in UnderstoodRail; test skipped; remount test re-pointed via seam.
- B16-O8: COMMITTED 905ef900. B16-O11: COMMITTED 6be4db35+REVIEWED(ship, no stranding) — hide footer Continue on STEPS_OWNING_ADVANCE {2,4}; closes plan persistence-skip hazard; footerNextVisible helper+test.
- B10 S3 "Lessgo"→"Lessgo AI" sweep: COMMITTED 9a650ed3 — 20 files, product-name prose+titles+meta+legal+blog+badges+editor strings; domains/URLs/identifiers untouched (verified). Memory rule already recorded. OPEN: external confirmation-email subject should match; OG/title snippet changes intended.

## Founder follow-ups (2026-07-19)
- B17 (O13 escalated): COMMITTED 8ccf83e5+REVIEWED(ship, risky-tier) — `workCopyEngineEnabled` delegates to allow-list only; env flag removed (only runtime reader); allow-list ['atelier'] preserved; skeleton path intact. Founder: delete Vercel prod `NEXT_PUBLIC_WORK_COPY_ENGINE` after deploy. ⚠️ makes atelier work journey run real LLM gen (credit spend) → merge/deploy gate needs real-LLM atelier smoke.
- B18: COMMITTED 034ec4bc — resolveSidebarPlan helper defaults display to FREE; findUnique unchanged (side-effect-free); +test. Was: DIAGNOSED CODE bug — `dashboard/layout.tsx:54-64` no-UserPlan-row → `config=undefined` → `plan=undefined` → AppSidebar renders "— plan / — of — sites used". Fix: default display tier to FREE (`PLAN_CONFIGS[userPlan?.tier ?? PlanTier.FREE]`), keep findUnique (no get-or-create side effect). Extract `resolveSidebarPlan` helper + test. Files: `dashboard/layout.tsx` (+ helper+test). Read-only, no entitlement change. Was "config you own" → now real fix.
- B3: browser-confirm blocked — founder signed in, /sign-up→/dashboard redirect; can't view SSO buttons in authed session. Config-only, GitHub already disabled per founder.

## GREEN GATE (step 2): PASS x2 (after B17/B18 too) — tests 4050 pass/15 skip, lint clean, build ok, tsc clean. 9 commits: 905ef900 f14b7d42 1c95aea8 f6fe284e 52c1c8a0 6be4db35 9a650ed3 034ec4bc(B18) 8ccf83e5(B17). → preview re-test gate (founder).
## Merge/deploy gate TODO: real-LLM atelier work-generation smoke (B17 makes it prod-reachable); founder delete Vercel `NEXT_PUBLIC_WORK_COPY_ENGINE`; reconcile overlap w/ post-beta feature branches (auth-redesign, dashboard-*, work-onboarding-*).

---

## BUG tier (investigate → fix → test)

### B1 — Photos vanish after clicking "Looks right" (O9) — P0
- **Symptom:** In work onboarding, after uploading photos and clicking "Looks right", user returns to "show your work" step and ALL uploaded photos are gone.
- **Repro:** Work onboarding → upload photos → advance → click "Looks right" → lands back on show-your-work with empty state.
- **Expected:** Photos persist across the step transition.
- **Actual:** Data loss — photos cleared.
- **Env:** preview/dev, work engine (photographer).
- **Suspected area:** `src/components/onboarding/journey/engines/work*` step state / persistence; possibly briefFacts/group state reset on back-nav.
- **Tier:** standard (escalate if editStore/state factory involved).

### B2 — Dashboard new-site input disabled (D4) — P0
- **Symptom:** On /dashboard, the "describe what you're launching" input shows a not-allowed cursor (red circle w/ diagonal) and won't accept typing.
- **Repro:** Load /dashboard as signed-in user → click center input → cannot type.
- **Expected:** Can type a one-liner to start a site.
- **Actual:** Input disabled.
- **Env:** dashboard, signed-in.
- **Suspected area:** `src/components/dashboard/NewSiteButton.tsx` / new-site input; possibly gated on plan/serve-flag/config → but manifests as unusable input.
- **Tier:** standard.

### B3 — GitHub shown as SSO option (S4) — P1
- **Symptom:** Sign-up page shows GitHub as an SSO option, but only Google is configured in Clerk.
- **Repro:** Visit /sign-up → GitHub button present.
- **Expected:** Only Google.
- **Actual:** GitHub also shown.
- **Env:** /sign-up (custom "Claim your founding seat" page).
- **Suspected area:** custom sign-up UI provider list OR Clerk appearance/config. If code → auth surface (risky).
- **Tier:** standard → escalate to risky if fix touches Clerk/auth config.

### B4 — Account settings routes to persona selection (P3) — P1
- **Symptom:** "Account settings" link goes to persona selection instead of real account settings (per design `Lessgo Dashboard.dc.html`).
- **Repro:** Pricing/dashboard → Account settings → lands on persona selection.
- **Expected:** Real account settings page.
- **Actual:** Persona selection.
- **Env:** pricing/dashboard nav.
- **Suspected area:** account-settings link href / route mapping.
- **Tier:** standard.

### B5 — Photo uploads mislabeled into "what you sell" rail + odd auto-grouping (O3+O4) — P1
- **Symptom (O3):** Upload from a folder named "asset" → creates an "asset" group (ok) BUT the group also appears under "what you sell" in the left rail (wrong).
- **Symptom (O4):** Upload a single photo → creates a new group dated "Mar 10 2025" AND it also lands in "what you sell" rail.
- **Repro:** Work onboarding → upload folder / single photo → observe rail "what you sell" gets a wrong entry.
- **Expected:** Uploads populate work groups only; "what you sell" rail reflects the offer, not raw upload groups.
- **Actual:** Upload groups leak into "what you sell"; single photo gets an arbitrary date-named group.
- **Env:** work onboarding upload/curation.
- **Suspected area:** auto-curation / group→rail sync (`CorrectionBoard.tsx`, work engine facts writeback).
- **Tier:** standard.

### B6 — "Roughly what do you charge" not syncing to rail (O10) — P1
- **Symptom:** Answering "Roughly what do you charge" does not reflect in the left rail (contrast with O6 where editing "Wedding" DID sync).
- **Repro:** Work onboarding → answer charge question → rail unchanged.
- **Expected:** Charge/price answer appears in rail like other facts.
- **Actual:** Missing from rail.
- **Env:** work onboarding.
- **Suspected area:** rail fact mapping — charge field not wired to rail projection.
- **Tier:** standard.

### B7 — Rail shows "Price position Mid-range" prematurely (O2) — P2
- **Symptom:** After only "I am a photographer in Amsterdam", rail already asserts "Price position: Mid-range" — an unfounded (possibly offensive) inference.
- **Repro:** Work onboarding → minimal one-liner → rail shows Mid-range price position.
- **Expected:** No price-position claim until user provides pricing signal (blank/unset).
- **Actual:** Defaults to "Mid-range" with no basis.
- **Env:** work onboarding rail.
- **Suspected area:** default fact inference / rail projection defaulting price position.
- **Tier:** standard.

---

## HOTFIX tier (skip impl-review; orchestrator diff-checks)

### B8 — Sign-up photo overflowing (S1) — CSS
- Sign-up page image overflows its container. Fix layout/overflow.

### B9 — "Claim your founding seat" heading left-cut (S2) — CSS
- Heading "C" and entire left side slightly clipped. Fix padding/overflow/negative margin on heading container.

### B10 — "Lessgo" → "Lessgo AI" (S3) — copy — P1
- Auth page metadata "Invite-only access to Lessgo" → "…to Lessgo AI" (`src/app/layout.tsx`). **Sweep** all user-facing "Lessgo" (not "Lessgo AI") occurrences; fix all. (Product name is ALWAYS "Lessgo AI".)

### B11 — Dashboard logo white-bg + too small (D1) — asset
- Replace with logo from design folder (`docs/Design/Lessgo AI Logo.png` / `.../assets/lessgo-logo.png`); remove white background box; size up appropriately.

### B12 — Dashboard welcome/center block bigger (D3) — CSS
- "rocket_launch / Welcome to Lessgo AI / Let's build your first site…" block — increase size/prominence.

### B13 — "New site with AI" → better copy (D5) — copy
- Rename CTA to "Create my new website" (`src/components/dashboard/NewSiteButton.tsx` + e2e specs reference it → update tests too).

### B14 — Grey "Tidy up your groups / merge selected" confusing (O5) — UX
- Greyed merge/tidy controls with no function confuse users → hide in beta (comment out w/ note; keep for later per greyed-placeholder pattern but not here).

### B15 — "Something wrong?" input non-functional → remove for beta (O7) — UX — P1
- The "Something wrong?" free-text input does nothing on submit. Comment out for beta with a note (not needed in beta).

### B16 — Duplicate action buttons confusing (O8+O11) — UX
- Steps show TWO action buttons ("Looks right" + "continue"; "Build my site" + "continue"). Consolidate to one clear primary per step.

---

## OUT of round (tracked, not fixed here)
- **P1** "Founding" — unusable note; **P2** price numbers ($699/$349/$69-code) → conflict with pricing-v2 spec; founder to reconcile.
- **O1** engine divider (double onboarding) → engineDecider.md feature.
- **O12** remove/reorder pages & sections in "Here is your site" preview → editor capability feature.
- **CONFIG:** D2 (free-plan display), O13 (`NEXT_PUBLIC_WORK_COPY_ENGINE` kill-switch) → founder flips.
- **O6** not a bug (positive).
