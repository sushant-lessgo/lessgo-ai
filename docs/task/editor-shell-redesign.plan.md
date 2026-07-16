# editor-shell-redesign — implementation plan (rev 2, post plan-review)

WORKDIR: `C:\Users\susha\lessgo-ai\.claude\worktrees\editor-shell-redesign`
Branch: `feature/editor-shell-redesign` (hard-stop on mismatch)
Tier: full
Merge posture: **merge to main LOCAL only, NO push** — big-bang deploy pending auth + dashboard + editor-shell.
Green gates before merge: `tsc`, `npm run test:run`, `npm run lint`, `npm run build`, `npm run test:e2e`.

## Overview
Reskin the complete non-canvas editor shell (top bar, pills, left rail, Design menu, SEO/settings modals, publish flow, page switcher) to the handoff look (t1/t14/t16/t17/t18), built on ui-foundation tokens/primitives. Presentation only: zero changes to edit-store internals, selection, canvas renderer, publish-path logic, or any `.published.tsx` — published output stays byte-identical. Handoff COPY is in scope (copy = presentation). Not-yet-wired controls render greyed/"coming", never omitted — and nothing that works today gets greyed.

## Progress log
- phase 1 foundation (popover/tooltip/spinner/divider, coming variant, tokens, icons): **done** (commit 6c62bdb8, review loops 0 — gates green: tsc clean, 3331 tests, lint 0)
- phase 2 status pills (SaveStateChip/ReviewPill) + dirty-guard e2e: **done** (commit c335a75a, impl-review loops 1 → `ship`; gates green: tsc 0, 3331 tests, lint 0, e2e authed 9 passed + spec EXECUTION confirmed; red-capability proven by neutering the guard)
- phase 3 left rail frame + .app-chrome attach (EditLayout structure moved to phase 4): **built** (commit 2a749fb9, impl-review loops 1 → `ship`; gates green: tsc 0, 3331 tests, lint 0, e2e public 13 + authed 9) — **AWAITING FOUNDER HUMAN GATE (canvas-bleed)**
  - ⚠️ **The automated specs CANNOT see this attach** — `ui-isolation.spec.ts`/`parity.spec.ts` hit `/dev/blocks/*`, which never mounts `EditLayout`. Founder eyes are the ONLY real check. Structural verification (impl-review traced the JSX tree): 4 attach points (GlobalAppHeader wrapper L158, rail wrapper L165-181, EditHeader wrapper L198, modal-roots `display:contents` L218); `MainContent` L203 is a TRUE SIBLING of wrapper #3; shell root L150 carries NO `.app-chrome`; no `.app-chrome` ancestor exists above the canvas.
- phase 4 single-bar collapse (GlobalAppHeader + EditHeader merge) + ALL EditLayout structure + right cluster: **built** (commit 4462a93e, impl-review loops 3 → `ship`; gates: tsc 0, 3337 tests incl. 6 new menu cases, lint 0, e2e authed dirty-guard ×4 green + live Chromium click-through) — **COLLAPSE taken, fallback NOT needed** — **AWAITING FOUNDER HUMAN GATE** (sign off 2 t1 deviations: UserButton kept / breadcrumb+firstName removed)
  - Loop 1 `fix first`: wired popover rows never dismissed (Radix Popover ≠ DropdownMenu). Loop 2 `fix first`: the fix broke `Logo → Help` (FocusScope AUTOFOCUS_ON_UNMOUNT → trigger focus → help focusin → dismiss) — caught by reviewer's empirical repro, NOT inspection. Loop 3 `ship`.
  - **PHASE 8 CARRIES:** UndoRedo/Reset old grey-box styling · 4 missing icons (`menu_book`/`smart_display`/`keyboard`/`warning`) + weak substitutes (`subtitles`→Video Tutorials, `smart_button`→Kbd Shortcuts) → amend `icons.txt` + regenerate per NOTICE · device segmented off-centre (two `ml-auto` split free space) · narrow-width bar overflow (both groups `flex-none` → clip not wrap) · double Publish/Preview spinner (shared `isNavigating`, correct per lift) · **~1s menu self-close** (menu opened <1s after editor load closes itself once; pre-existing — `showHelpMenu` was local `useState` pre-diff; needs `EditLayout`/`EditProvider` diagnosis) · audit fix-pass-I body lacks an inline CORRECTION marker.
  - **PHASE 7 NOTE:** `publish.spec.ts` is flaky under full-suite load (passes alone: 4 passed — orchestrator verified). Dev server logs an SSR error at `useEditStoreBootstrap.ts:238` (dev-only `window` debug block on the preview page's server render) — pre-existing, from the editor-perf track; plausible cause of the flake since the assertion is `isPublishReady`.
- phase 5 Design menu (t14 theme popovers): **done** (commit 0037cfca, impl-review loops 2 → `ship`; gates: tsc 0, 3337 tests, lint 0; dispatch+palette+swap+menus called out green 6 files/59) — Style→Design rename landed; firewall intact
  - Two bugs neither tsc/tests/lint could see: **ACCENT swatches unclickable** on service/hearth (viewport overflow vs `AppPopoverPanel overflow-hidden`) — caught ONLY by live Chromium; **current template rendered 2×** (`TemplateSwapList` always emits it) — caught by READING `TemplateSwapList:145-148`, and the implementer's own live probe had recorded the duplicate as CORRECT. Lesson: verification only counts against an EXTERNAL reference (t14 as drawn), never against the implementer's own expectation.
  - `ThemePopover` remains **browser-unverified** (no seedable non-template product project exists) → founder-eyes item for phase-8 QA.
  - **PHASE 8 CARRIES (added):** `TemplateSwapList`'s legacy blue-ring/amber row styling inside the t14 group (file out of scope) · `DESIGN_TRIGGER_CLASS` duplicates `GlobalAppHeader`'s private `BAR_BTN` byte-for-byte → de-dupe.
- phase 6 site settings + SEO (t16/t18): **done** (commit 17c54e29, impl-review loops 1 → `ship`; gates: tsc 0, 3337 tests, lint 0; live-verified headless Chromium — 912×552 measured, 3 nav rows, meters+preview live, per-page override reaches store, no "Maximum update depth exceeded")
  - Both silent-bug risks verified at the PERSISTED-VALUE level, not the label: **`noindex`→"indexing" switch inversion correct in both directions** (ON→`undefined`, OFF→`true`, identical to old); **Pro gate fail-closed on BOTH loading and fetch-failure paths**.
  - **`nav-item activeBar` IS consumed** (`SeoSettingsModal.tsx:386`) → phase 5's "delete if still unused in phase 8" note is DROPPED.
  - `GlobalModals.tsx` imports `SeoSettingsModal` → importing `showSocialModal` back = **require cycle**. Social row wired via the existing `lessgo:manage-social` window event, mirroring the documented `lessgo:manage-products` firewall pattern (`GlobalModals.tsx:44-47`). `GlobalModals` needed NO change.
  - **PHASE 8 CARRIES (added):** missing `DialogDescription`/`aria-describedby` → Radix logs a warning on every open (a11y + console noise; note the phase-6 probes grepped for the update-depth string, NOT for a clean console) · `aria-label="…index this page"` hardcoded while the visible root label says "site" (`:275-278` vs `:283`) · dropped amber "won't appear in search results after next publish" confirmation copy (founder call) · behavior deltas from Radix `modal` Dialog the hand-rolled overlay lacked: focus trap + body scroll lock (benign, but real).
  - **PHASE 7/8:** wiring the sitemap row needs `publishing.publishedUrl` actually assigned (declared `types/store/state.ts:407`, never written) — the preview page's fetch is the source.
- phase 7 publish flow (t17) + publish.spec selector repair: pending
- phase 8 PageSwitcher + final sweep + gates: pending

## Decisions (orchestrator rulings + plan-review — DO NOT re-litigate)
1. **One bar, not two.** Today: `GlobalAppHeader` = full-width row (`EditLayout.tsx:138`); `EditHeader` = a SECOND `h-16` row nested inside the right content column (`EditLayout.tsx:171-177`), not spanning the rail. Ruling: **collapse into ONE t1 56px full-width bar** above the 266px rail, composed from BOTH files' content. Handlers move VERBATIM with their markup (presentation line holds). Phase 4 owns this; fallback if it turns structural = stacked-but-restyled (founder call at the phase-4 gate).
2. **Disabled/"coming" variant: WE name it** — name = **`coming`** (utility `.app-coming`). Don't block on dashboard S1; post the name to the **`dashboard-workspace-ia`** mailbox file for S1 to adopt.
3. **Unmapped hexes: additive `app-*` keys only, do NOT snap** — snapping silently changes the designer's palette.
4. **t17 target = preview page's publish MARKUP** (`src/app/preview/[token]/page.tsx`), not the editor header. NO-TOUCH: `handlePublish` (~L362), slug normalization (~L300), `src/app/api/publish/route.ts`, `src/lib/staticExport/*`, `src/lib/routing/kvRoutes.ts`.
5. **Handoff copy IS in scope** — adopt t17 strings ("Publish now", "You're live!"). Consequence: `e2e/publish.spec.ts` selectors coupled to old strings/classes MUST be repaired in phase 7 (see phase 7 — not append-only).
6. **Top bar is ours** — reskin in place; NO shared `AppTopBar` extraction. Dashboard matches via tokens.
7. **Do NOT unify the two modal systems** (`GlobalModals` singleton vs `useModalManager`).
8. ~~**`UserButton` (Clerk) STAYS** in the right cluster — it is the ONLY sign-out path.~~ **REVERSED BY FOUNDER at the phase-4 gate (2026-07-16): REMOVE the avatar/`UserButton`** — "logout etc. happens from the dashboard". This is an authorized BEHAVIOR change (removes the editor's only sign-out path) overriding the spec's presentation-only line. t1 draws no avatar → the bar now matches t1 exactly. Founder also confirmed breadcrumb + firstName removal.
8b. **FOUNDER RULINGS 2026-07-16 (new, override the spec's presentation-only line — all authorized BEHAVIOR removals):**
   - **Languages GONE** — delete `LanguageToggle` + `LocaleSettings` mounts from `EditHeader` (they were invisible until a 2nd locale is declared). ⚠️ **Open risk logged in `docs/product/orchestrator.md`**: no known way to edit the non-default locale of a bilingual project afterwards (Lumen EN/NL for Kundius; naayom→Hindi). Components stay on disk — only the mounts go, so re-mounting elsewhere is cheap. The i18n track owns the answer; founder ruled "note it and continue".
   - **"+ Add page" GONE** — remove from `PageSwitcher` (phase 8; `PageSwitcher.tsx:229-231`). `addPage`/`addArchetypePage` store actions stay untouched — only the chrome affordance goes.
   - **"Style" → "Design"** — phase 5. Today's trigger says `Style` (`ServiceThemePopover.tsx:159`, `VestriaThemePopover.tsx:163`); t1 draws a `Design` palette-icon button. The rename IS the reskin, not a deviation.
   - **"Home" → page-select dropdown** — phase 8. Today `PageSwitcher` renders tabs (home first); t1 wants the bordered pill + `expand_more` dropdown. Already planned.
9. **Help control stays functional + reskinned**; grey its individual dead rows only.
10. **`Social & sharing` is WIRED TODAY** (`showSocialModal` — `GlobalAppHeader.tsx:10,68`). **Wire the row, never grey it.** Scout §I's grey-candidate list is WRONG on this point — recorded here so nobody re-greys it later.
11. Menu rows: **`Back to dashboard` + `Help & support` work today → reskin, keep working.** **`My sites`** (no distinct target), **`Rename site`**, **`Duplicate`** → greyed.
12. **Device control → GREYED slot.** `ui/DeviceToggle.tsx` exists but is mounted NOWHERE (verified dead code); wiring it = new behavior (Lane-3).
13. **"N edits since last publish" row → OMIT entirely.** No data source (`published-slug` fetch at `preview/[token]/page.tsx:145` carries no edit count), no new fetches allowed, and there is no control to grey.
14. **`EditLayout.tsx:166`** mobile-overlay `storeState?.toggleLeftPanel?.()` mutation (overlay L163-168, fed by the L35-40 stale-closure `storeState`) is on the preserve list — the overlay + its handler SURVIVE the phase-3 frame rewrite.
15. Grey-out treatment (defined once, phase 1): `opacity:.5` + `#8a8a94` + `cursor:not-allowed` + `aria-disabled` + tooltip naming what's coming. **Consume `src/components/ui/coming.tsx` (phase 2) — the component, NEVER the bare `.app-coming` class** (the class alone can't carry `aria-disabled`/tooltip; the component makes the 3-part recipe inseparable and requires a `what` prop).
16. **`#e6e6ec` gets its OWN token key — do NOT snap it to `app-border` (#ececf1) or `border-input` (#e2e4ea).** Impl-review found drift: scout §G groups it under `border-input`, the phase-1 audit claims `app-border`, and `.app-divider` hard-codes the literal. All three disagree. Decision 3 (additive, no snapping) governs → add `colors.app['border-hairline'] = '#e6e6ec'` and re-point `AppPopover*` borders + `.app-divider` to it. Phase 3 fixes this (small); phases 4+ consume it. This matters because phase 4 puts a bar border directly next to a menu border.
17. **`<Coming>` geometry vs menu rows** (impl-review note): `Coming` renders its own `inline-flex items-center gap-1.5` span, so a greyed popover row cannot be an `AppPopoverItem`. Phase 4 (first menu consumer) either passes row padding/typography via `className` or adds a row-shaped variant — decide there and document it, don't improvise per-site.

## Global invariants (every phase)
- **Presentation-only line.** ZERO edits to: edit store internals/actions, `SelectionSystem`/`ElementDetector`/`HoverOverlay`, `LandingPageRenderer`/`EditablePageRenderer`, `api/publish`, `staticExport/*`, `kvRoutes.ts`, any `.published.tsx`, both component registries, templates. Moving a handler VERBATIM with its markup is allowed; changing what it does is not.
- **`.app-chrome` NEVER wraps the editor canvas** — outer shell / rail / top bar / modals only. The hazard is editor-canvas FONT BLEED (editor-side divergence), not published contamination.
- Selector-first store reads only (bare `useEditStore()` is lint-banned). Reskins may READ store; may not change store logic.
- **Preserve as-is, do not "clean up":** `GlobalAppHeader.tsx:157` `useEditStore.getState().toggleLeftPanel?.()`; `EditLayout.tsx:163-168` mobile overlay + its L166 mutation; `SaveStateChip` `beforeunload` guard (L58-78) incl. contenteditable mid-edit check; `SaveStateChip` `chipStyle` `minWidth:150px` (deliberate anti-layout-shift reservation — keep the reservation, whatever the new geometry); `ReviewPill` double gating (self-hide L12 + `EditHeader.tsx:70` guard); `store?.getState()`-during-render pattern (`LeftPanel.tsx:112-114`, `EditLayout.tsx:35-40`); `SeoSettingsModal.tsx:36-38` `useMemo`-outside-selector shape.
- Token/hex/size specs from scout §H; token mapping from scout §G. `font-app-mono` resolves to `'JetBrains Mono App'` — never the raw family name.
- Slots, not behavior: styled shells accept behavior via props/children so Lane-2/3 wire in later without layout redo.
- Per-phase verification baseline: `tsc --noEmit` + `npm run test:run` + `npm run lint` green; manual `npm run dev` visual check of the touched surface; editor still edits + autosaves.

---

## Phase 1 — Foundation: popover primitive, coming variant, tokens, icons
**Goal:** everything later phases consume, built ONCE. The popover/menu gap is the biggest blocker (t1 app menu, t1 Settings menu, t14, t18 ⋯, t17 confirm, 3 theme popovers). No second popover gets improvised later.

**Steps:**
1. `src/components/ui/popover.tsx` (new): Radix-based popover/menu primitive (reuse `select.tsx`'s popover shell internals). Two surfaces: menu list (w~216-224, radius 12, border `#e6e6ec`→`app-border`, shadow `0 18px 40px -12px rgba(20,20,40,.28)`, pad 6, rows 500/13, hover `#f4f4f7`, active `bg #f5f9ff` + `#003E80`, eyebrow 700/10.5 `.09em` `#a6a6b0`, divider `#f0f0f3`) and panel (radius 14, deeper shadow) for t14/t17/t18.
2. `src/components/ui/tooltip.tsx` (new): Radix tooltip, app-chrome styled.
3. `src/components/ui/spinner.tsx` (new): ring spinner (3px `#e6eefc` track, `app-primary` top, `lg-spin .8s linear infinite`) — t17 state B.
4. **`coming` variant** (decision 2/15): one shared implementation — `.app-coming` in `src/styles/app-chrome.css`: `opacity:.5`, text/icon `#8a8a94`, `cursor:not-allowed`, `aria-disabled="true"`, no hover state, wrapped in tooltip ("Coming soon — <what>"). Post the name to mailbox `$(git rev-parse --git-common-dir)/../.claude/mailbox/dashboard-workspace-ia.md` for S1 adoption (informational, not blocking).
5. **Divider primitive:** `.app-divider` utility in `src/styles/app-chrome.css` — 1×22 vertical hairline (`#e6e6ec`), used ×3 in the t1 bar. Built here so phase 4 doesn't improvise it.
6. **Split-button: explicit decision — NOT a phase-1 primitive.** Single consumer (Publish, phase 4); building it inline in phase 4 is the ruled disposition. Recorded here so phase 4 is improvising by design, not by omission.
7. **Token additions** (`tailwind.config.js`, ADDITIVE ONLY — decision 3, no snapping) for unmapped hexes (scout §G): frame `#ececee`, surfaces `#f6f7fb`/`#fafafb`/`#f1f1f5`, tint-soft `#f5f9ff`/`#e6eefc`, score-pill `#f0f4ff`/`#dbe6ff`, review/nudge coral family `#fff2ec`/`#ffd9c7`/`#fff8f5`/`#ffe1d3`/`#8a5a44`/`#d9531f`, border shades `#cdcdd4`/`#c7c7cf`, Google-preview `#1a3fb8`/`#5f7d5f`. Name under `colors.app.*`; every hex gets its own key. Document names in `src/components/ui/README.md`.
8. **Icon subset:** verify every icon in scout §G list exists in `public/fonts/material-symbols-rounded/icons.txt`; add missing + regenerate **per the NOTICE (add-then-regenerate, NEVER from full font)**.
9. Gap G.6: extend `nav-item` with optional `inset 2px 0 0 #006CFF` active-bar variant (rail + t16 nav).

**Files touched:**
- `src/components/ui/popover.tsx` (new)
- `src/components/ui/tooltip.tsx` (new)
- `src/components/ui/spinner.tsx` (new)
- `src/components/ui/nav-item.tsx` (active-bar variant)
- `src/styles/app-chrome.css`
- `tailwind.config.js`
- `src/components/ui/README.md`
- `public/fonts/material-symbols-rounded/icons.txt` + regenerated subset font files in same dir
- mailbox note in `dashboard-workspace-ia.md` (untracked, not committed)

**Verification:** baseline gates + `npm run build` (tailwind config + font assets changed). Dev-page smoke: popover/tooltip/spinner/`.app-divider`/`.app-coming` render inside `.app-chrome`.

---

## Phase 2 — Status pills (SaveStateChip / ReviewPill) + dirty-guard e2e
**Goal:** the Playwright guard lands and RUNS before anyone touches `SaveStateChip`. Pills/chips restyle ONLY — **no bar-layout work in this phase** (single-bar composition = phase 4; `EditHeader.tsx` is untouched here).

**Steps:**
1. **e2e first — `e2e/editor-dirty-guard.spec.ts` (new), registered so it actually executes.** `playwright.config.ts` `projects[].testMatch` is an explicit allowlist — a new spec matching no project silently never runs. **Add `/editor-dirty-guard\.spec\.ts/` to the `authed` project's `testMatch`** (alongside `/publish\.spec\.ts/, /edit-persistence\.spec\.ts/`). Spec shape mirrors `e2e/edit-persistence.spec.ts` (the exact precedent — read it first): authed Clerk session + self-skip guard, persona POST → `/api/start` → `seedDraft(api, token, cfg)` (meridian) → `goto /edit/<token>` → type a marker into `[data-element-key="headline"]`. Cases:
   - **Positive (mid-edit branch, deterministic):** click headline, type, do NOT blur — element is `[contenteditable="true"][data-editing="true"]`, so the guard's mid-edit check fires regardless of the autosave debounce (no `isDirty` race). Register `page.on('dialog')` FIRST, then **`page.close({ runBeforeUnload: true })`** — a plain `goto`/navigation will NOT fire beforeunload (Chromium requires sticky user activation; a naive nav test silently no-ops). Assert a `beforeunload` dialog fired; dismiss it.
   - **Positive (dirty-window, best-effort):** blur to commit, then close within the dirty window before the autosave debounce flips `isDirty` false — assert dialog. If flaky under dev-server timing, keep the mid-edit case as the mandatory one and mark this variant `fixme`-with-reason rather than deleting it.
   - **Negative (proves the test can go RED):** fresh page on the seeded token, ZERO edits → `page.close({ runBeforeUnload: true })` → assert NO dialog and close resolves. If the guard were deleted, the positive case fails; if the guard fired always, the negative fails.
   - ReviewPill assertion: pill hidden when `allComplete`; visible + opens left panel on click otherwise.
   Run the spec green against CURRENT code before any restyle in this phase.
2. `SaveStateChip.tsx`: restyle `STATUS_VIEW` (L100-128) **and `chipStyle` (L131-143)** to t1. t1 only specifies the *saved* state (7px `#16a34a` dot + 500/12 `#8a8a94`); explicitly defined here: **saving** = same chip geometry, pulsing `#8a8a94` dot + "Saving…" text; **error** = `app-danger` dot + `app-danger` text, same geometry. **Keep a min-width reservation equivalent to the current `minWidth:150px`** — it exists deliberately to prevent layout shift as states swap; restyle the value if t1 geometry demands, never remove the reservation. **Do not touch L47-78** (state derivation + beforeunload guard).
3. `ReviewPill.tsx`: restyle inline styles L39-62 to t1 review pill (bg `#fff2ec`, border `#ffd9c7`, text `#d9531f`, `flag` icon). Keep `useReviewState`, self-hide, click handlers exactly.

**Files touched:**
- `e2e/editor-dirty-guard.spec.ts` (new)
- `playwright.config.ts` (register spec in `authed` project)
- `src/app/edit/[token]/components/ui/SaveStateChip.tsx`
- `src/app/edit/[token]/components/ui/ReviewPill.tsx`

**Verification:** baseline gates + `npm run test:e2e` — confirm in the runner output that `editor-dirty-guard.spec.ts` EXECUTED under `authed` (not just "suite green"), green pre- AND post-restyle. Manual: dirty-edit → close tab prompts; clean → no prompt; review pill behavior unchanged.

---

## Phase 3 — EditLayout shell + LeftPanel frame + `.app-chrome` attach
**Goal:** outer shell reads as t1 frame; left rail container reskinned; `.app-chrome` attached to chrome regions ONLY. Keeps today's two mount points (`GlobalAppHeader` L138, `EditHeader` L173) — the single-bar collapse is phase 4's; do not finalize the rail's top edge as if the nested header were permanent.

**Steps:**
1. `EditLayout.tsx`: edit shell JSX **L129-199 ONLY** — frame bg `#ececee`, chrome region wrappers get `.app-chrome`. **DO NOT touch L64-127** (resize listener, keyboard shortcuts, autosave, modal reset) **or L202-231** (ThemeInjector/backgroundSystem). Keep `store?.getState()` L35-40 byte-identical. **The mobile overlay L163-168 and its L166 `storeState?.toggleLeftPanel?.()` mutation SURVIVE the rewrite** (decision 14) — restyle the overlay's classes at most; there is no responsive/mobile pass in this track, so the frame rewrite must not quietly drop it. Structure: `.app-chrome` on top-bar wrapper + rail wrapper + modal roots; canvas/`MainContent` subtree stays OUTSIDE it.
2. `LeftPanel.tsx`: rail per t1 — w 266, bg white, right border; outer div L176-180 + collapsed variant L155-174 + header L183-196 (`PAGE SECTIONS` eyebrow + `add` icon slot) + resize-handle visuals L226-232. Section rows (L206-218): className-only — `drag_indicator` + type icon + label + `visibility` slot, hover `#f6f6f9`, active `#e6f0ff` + inset bar + `#003E80`. Handlers untouched. `GettingStartedChecklist` (L26-100): className-only. Keep `store?.getState()` L112-114 as-is.
3. Rail top: 4-tab segmented `Sections | Pages | CMS | Theme` (`segmented-control`); `Pages`/`CMS`/`Theme` greyed (`.app-coming`). `Sections` = existing behavior.
4. `add` icon = styled slot only (add-section behavior lives in `AddSectionButton`/`EnhancedAddSection` — greyed if no existing handler at this mount).

**Files touched:**
- `src/app/edit/[token]/components/layout/EditLayout.tsx`
- `src/app/edit/[token]/components/layout/LeftPanel.tsx`

**Verification:** baseline gates. **Canvas-bleed check (the real `.app-chrome` hazard):** an **editor↔published canvas VISUAL comparison**, not an HTML diff — scout §A already proves edit chrome can't reach published output structurally; the risk is editor-side font/color bleed into the canvas, which a published-HTML diff cannot catch. Open the same seeded page in `/edit/[token]` and its published render side-by-side; canvas typography/colors must match pre-phase screenshots and each other. Also: resize/collapse/scroll-to-section work; mobile overlay still toggles the panel (narrow window check).

**HUMAN GATE:** founder eyeballs canvas untouched (editor vs published visual comparison clean) before phase 4.

---

## Phase 4 — Single-bar collapse: GlobalAppHeader + EditHeader merge + right cluster
**Goal:** ONE t1 56px full-width bar above the rail (decision 1), composed from content currently split across `GlobalAppHeader` and `EditHeader`. Handlers move VERBATIM with their markup — composition, not behavior change. Re-mounting `EditHeader`'s content out of the right column changes the rail's vertical extent → `EditLayout.tsx` mounts adjusted here (coordinated with phase 3's frame).

**Steps:**
1. **Bar composition** (`EditLayout.tsx` mounts + the two header files): single full-width 56px bar renders left cluster (logo/app-menu), center (page-switcher slot + status pills — moved verbatim from `EditHeader`), right cluster (`EditHeaderRightPanel` content + `UserButton`). `EditHeader`'s popover-dispatch logic (L24-52) and the `!allComplete` ReviewPill guard (L70) move UNCHANGED with their markup. `LanguageToggle`/`LocaleSettings` mounts (L64-65) stay mounted (t1 shows no toggle; removing = behavior change). Greyed **score pill** (`insights 7.4` — no scoring system exists) lands next to ReviewPill.
2. `GlobalAppHeader.tsx` content dispositions — every element accounted for:
   - Logo button (h22 logo + `expand_more`) opens **app-menu popover**: `Back to dashboard` (works — keep working, decision 11) · `My sites` **greyed** · `Rename site` / `Duplicate` **greyed** · `Help & support` (works — keep working).
   - **"/ Editor" breadcrumb (L46-49): REMOVED** — pure text with no handler; superseded by the bar's page-switcher slot. Logged deviation, flag at gate.
   - **Help dropdown (L84-134): stays functional + reskinned** (decision 9); its four dead rows individually greyed (`.app-coming`).
   - **`Social` button (L68-78): WIRED — keep working** (decision 10). Its `showSocialModal` handler moves verbatim to the Settings popover's `Social & sharing` row. NEVER greyed.
   - **`UserButton` (L143-150): STAYS in right cluster** (decision 8 — only sign-out path). The `user.firstName` text label (L139) is dropped (pure presentation; avatar/sign-out preserved). Deviation from t1's no-avatar bar — flag at gate.
   - **Settings popover**: eyebrow `SITE SETTINGS` → `Domain` / `SEO` / `Social & sharing` / `Languages` (+ mono count) — all four wired to EXISTING `GlobalModals` singleton callers (`showSeoModal`/`showSocialModal`/…, L56/69).
   - **Preserve L157 store mutation exactly.**
3. `EditHeaderRightPanel.tsx`: restyle button markup L121-142, `RegenCopyConfirmModal` L15-66 (dialog primitive), toast L155-163 (toast primitive) — **do not touch** regen orchestration (L111), toast effect (L95-106), locale regen-lock (L86-87). Right cluster per t1: undo/redo (19px, disabled `#c7c7cf`) → Edit/Preview segmented (`segmented-control`; Preview = existing `PreviewButton` navigation) → **Publish split-button, built INLINE here** (per phase-1 decision 6): blue, `rocket_launch`, `.app-divider` hairline, `expand_more`; main button = existing Preview→publish entry navigation; **dropdown half greyed** (handoff never defines it).
4. `PreviewButton.tsx`: restyle to fit segmented shell; navigation logic unchanged.
5. **Device segmented (desktop/tablet/phone): GREYED slot** (decision 12 — `DeviceToggle.tsx` is unmounted dead code; wiring = Lane-3).

**Files touched:**
- `src/app/edit/[token]/components/layout/EditLayout.tsx` (bar/rail mount re-composition only — invariants from phase 3 still apply)
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
- `src/app/edit/[token]/components/layout/EditHeader.tsx`
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx`
- `src/app/edit/[token]/components/ui/PreviewButton.tsx`

**Verification:** baseline gates + `npm run test:e2e` (dirty-guard spec must stay green — SaveStateChip/ReviewPill re-mounted). Manual: left-panel toggle (L157 + mobile overlay), regen flow + toast + locale lock, Preview navigates, Settings rows open the same modals (incl. Social), undo/redo, sign-out via UserButton. Diff review: no new store writes; moved handlers byte-identical.

**HUMAN GATE:** founder eyeballs the composed single bar; explicitly signs off the two logged t1 deviations (UserButton kept, breadcrumb removed). **Fallback if collapse turns structural: stacked-but-restyled** — both rows reskinned in place, collapse deferred.

---

## Phase 5 — Design menu (t14): theme popovers
**Goal:** t14 look for the three theme popovers; behavior + dispatch-firewall untouched.

**Steps:**
1. New shared styled shell `src/app/edit/[token]/components/ui/DesignMenuShell.tsx`: t14 chrome (w 288, header `palette`+Design+close, TEMPLATE row with mini-thumb + "Browse all" link slot, STYLE segmented, ACCENT 26px swatches with double-ring selection, footer lock strip). Pure presentation; sections passed as children/props.
2. `ServiceThemePopover.tsx` + `VestriaThemePopover.tsx` (near-twins) adopt the shell. **`TemplateSwapList` and the swap-commit handler (`ServiceThemePopover.tsx:127`) untouched** — registry-preload = dispatch-firewall-sensitive.
3. `ThemePopover.tsx` (legacy product): standalone restyle to the same visual vocabulary; NOT folded into the shell.
4. Accent swatches render REAL template palettes (handoff hexes illustrative). "Browse all" = greyed link unless an existing picker route is already wired.

**Files touched:**
- `src/app/edit/[token]/components/ui/DesignMenuShell.tsx` (new)
- `src/app/edit/[token]/components/ui/ThemePopover.tsx`
- `src/app/edit/[token]/components/ui/ServiceThemePopover.tsx`
- `src/app/edit/[token]/components/ui/VestriaThemePopover.tsx`

**Verification:** baseline gates + template dispatch regression tests in `test:run`. Manual per audience: service → Service popover, product+module → Vestria, legacy product → ThemePopover; variant + accent swap applies; template swap preloads + commits.

---

## Phase 6 — Site settings + SEO (t16) + per-page SEO (t18)
**Goal:** `SeoSettingsModal` reskinned to t16 window (left-nav model) with the EXISTING per-page override tabs restyled per t18. Reskin, not rebuild.

**Steps:**
1. `SeoSettingsModal.tsx`: t16 chrome — 912×552 dialog, header (`tune` + title + Saved pill + close), left nav (`nav-item` active-bar variant: Domain / SEO / Social & sharing / Languages + mono count), SEO pane (title input, meta textarea + mono counter, Google preview card styling — keep it rendering from real `buildPageMetadata` —, indexing `switch`, favicon + social `image-placeholder` + sitemap row). Per-page section → t18 styling: `tabs` `General | SEO | Social`, tighter fields, override/fallback caption. **Preserve:** L36-38 `useMemo` shape, `store.updatePageSeo` wiring, char-meters, pixel regexes + Pro gate fetch (L66-80, fail-closed), noindex.
2. **`Social & sharing` nav row: WIRED, not greyed** (decision 10) — if no in-modal pane exists, the row invokes the existing `showSocialModal` flow; greying it is forbidden (it works today). Sitemap `open_in_new` row greyed only if no sitemap route exists.
3. `LocaleSettings.tsx` / `LanguageToggle.tsx`: restyle to app-chrome; self-hide + declare-locale behavior unchanged.
4. **No `GlobalModals.tsx` restructuring** (decision 7) — wrapper className tweak is the ceiling.

**Files touched:**
- `src/app/edit/[token]/components/ui/SeoSettingsModal.tsx`
- `src/components/editor/LocaleSettings.tsx`
- `src/components/editor/LanguageToggle.tsx`
- (`src/app/edit/[token]/components/ui/GlobalModals.tsx` — wrapper className ONLY, if required)

**Verification:** baseline gates. Manual: open via Settings popover; title/description meters + preview update; per-page override saves via `updatePageSeo`; Pro gate still gates pixels (free plan test); Social row still opens the social modal; no "Maximum update depth exceeded" console error.

---

## Phase 7 — Publish flow (t17) + publish.spec selector repair
**Goal:** confirm → publishing → live states reskinned in `src/app/preview/[token]/page.tsx` + `SlugModal`, WITH t17 copy (decision 5). This phase **WILL break `e2e/publish.spec.ts`** — selector repair is budgeted work here, not append-only drift.

**Steps:**
1. `src/app/preview/[token]/page.tsx`: reskin JSX for the three t17 states driven by the EXISTING local state (`publishing`/`publishSuccess`/`publishError`/…):
   - A confirm (SlugModal context): live-target row + "Change" (→ existing slug/domain modal), soft Review nudge (coral family; **"Publish now" ALWAYS enabled**), Cancel/"Publish now" footer. **"N edits since last publish" row is OMITTED** (decision 13 — no data source, no new fetches, nothing to grey).
   - B publishing: spinner card (phase-1 spinner).
   - C live: "You're live!" success card — check circle, URL row (mono + copy), `View site` (works) + `Share` **greyed**, version-saved footer, domain upsell row → opens settings/domain.
   - Error state: `app-danger` styling of existing error rendering.
   **NO-TOUCH: `handlePublish` body (~L362), slug normalization (~L300), status fetch (~L145), all state transitions.** Reskin what each state renders (incl. strings), not when.
2. `src/components/SlugModal.tsx`: restyle to t17-A card language, adopt t17 copy; validation/submit logic unchanged.
3. **`e2e/publish.spec.ts` selector repair** — every selector coupled to replaced strings/classes gets re-pointed in the SAME phase:
   - `page.locator('div.shadow-lg')` → stable hook (add `data-testid` on the new card wrapper; prefer testids over class coupling going forward),
   - heading `/Choose your page URL|Republish Your Page/` (`SlugModal.tsx:62`) → new t17 heading (or testid),
   - `getByRole('button', { name: /Confirm & Publish|Update Published Page/ })` (`SlugModal.tsx:171`) → `/Publish now/` (or testid),
   - `getByPlaceholder('e.g., Design Tools for Social Media Marketers')` → new placeholder/testid,
   - `getByText(/Page Published/i)` (`preview/[token]/page.tsx:571`) → `/You're live!/` (or testid).
   Then extend with UI-state assertions: confirm card pre-publish, publishing indicator during, live card + URL after.

**Files touched:**
- `src/app/preview/[token]/page.tsx`
- `src/components/SlugModal.tsx`
- `e2e/publish.spec.ts`

**Verification:** baseline gates + `npm run test:e2e` — publish spec green WITH the new selectors (a run that skips it doesn't count; confirm execution in runner output). Manual full loop: edit → preview → publish → `/p/[slug]` live; re-publish existing slug; error path (bad slug) surfaces.

**HUMAN GATE (MANDATORY — published-parity):** founder publishes a real page before/after the branch (or diffs exported HTML) — byte-identical output; live page renders identical. Behavior check: publish end-to-end works, Review nudge never blocks.

---

## Phase 8 — PageSwitcher + final sweep + merge gates
**Goal:** highest-entanglement file last, in isolation; then the full-shell QA pass.

**Steps:**
1. `PageSwitcher.tsx`: reskin tab markup INSIDE the gating map (L152-233) to t1 page-switcher pill (bordered pill, `description` icon, name 600/13, mono route chip, `expand_more`; dropdown via phase-1 popover if a page list exists today). **Mutations at L125/136/142/158/208/218 and `BlogButton` self-fetch (L26-37) untouched** — className/JSX-wrapper edits only, handler-by-handler diff review. t18's ⋯ page-row menu belongs to the (greyed) rail Pages tab — do NOT build it here.
2. Grey-out sweep — two directions:
   - Everything greyed uses THE shared `.app-coming` variant + tooltip: score pill, rail Pages/CMS/Theme tabs, My sites, Rename/Duplicate, Help dead rows, Publish dropdown half, device segmented, Share, Sitemap (if unrouted).
   - **Nothing that works today is greyed:** Design, SEO, Languages, Domain, **Social & sharing (decision 10 — wired, protected)**, undo/redo, Edit/Preview, Publish, Back to dashboard, Help & support, page switcher, mobile panel toggle, UserButton/sign-out.
3. Visual consistency pass across all phases (spacing/dividers/hover per §H).
4. Merge gates: `tsc` + `npm run test:run` + `npm run lint` + `npm run build` + `npm run test:e2e` all green (dirty-guard + publish specs confirmed EXECUTED).

**Files touched:**
- `src/app/edit/[token]/components/layout/PageSwitcher.tsx`
- (sweep: className-only touch-ups WITHIN files already listed in phases 2-7; no new files)

**Verification:** all gates green. Manual: page switching, page CRUD paths reached via switcher unchanged, blog button unchanged.

**HUMAN GATE (MANDATORY — final):** founder presentation/behavior QA — full editor session (edit, autosave, undo/redo, theme swap, SEO save, social modal, publish) + parity re-check + sign-off. Then merge to main **local only, NO push**.

---

## Unresolved questions
None. The six prior questions are closed as Decisions 1/2/3/11/12/13 above — do not re-raise.
