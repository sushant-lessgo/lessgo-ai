# Bug round: qa-0719b (founder QA batch 1, 19 Jul — Atelier/work engine)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\qa-0719b`
- **Branch:** `fix/qa-0719b` (off `main`)
- **Source:** `docs/qaTest/bugs19thJuly1.md` (founder QA of Atelier / work copy-engine site).
- **Sibling round:** `qa-0719` (separate batch, all 10 fixed, awaiting preview re-test on `fix/qa-0719`). **Coordination watch:** both branches touch work onboarding journey (`work.ts`, StepQuestions, questionGating) — expect merge reconciliation; qa-0719 merges first.

## Progress log (resume anchor)
- B1 Dream-client vanish: FIXED (commit 316f0c7d, review loops 1, ship) — engagement-aware question cap
- B2 Language English→Dutch: FIXED (commit 328a128d, review loops 1, ship) — translate-don't-echo directive (prompt-adherence; real-LLM golden = true check)
- B3 Duplicate preview toggle: FIXED (commit 77e8a8d8, review loops 1, ship) — removed dead "coming soon" device stub
- B4 Preview leaks editing: FIXED (commit 6f45f582, review loops 1, ship) — gate affordances on .edit-mode. NIT: regression test could assert the user-select-only block too (test-hardening follow-up)
- B5 Atelier header cluster: FIXED (commit ef1e1ebb, review loops 1, ship) — headerOverlay dark band interim (true transparent-over-hero overlay still deferred)
- B6 Testimonials missing: FIXED (commit 7d32cc11, review loops 1, ship) — editable-prop empty-state (editor greyed placeholder / published omit)

**ALL 6 FIXED — pending green gate + preview re-test.**

## Fast-follow / deferred (recorded, NOT in this round)
- **B6-FF (cosmetic):** when published proof renders null, the section renderer's outer `data-surface="paper-2"` wrapper still emits → faint ~2px hairline where the band was. Clean fix (skip surface wrapper on null block, or drop proof from section list when quotes empty) touches SHARED published renderer / section assembly (all blocks) — deferred to avoid broad blast radius.
- **B4-FF (test hardening):** `previewModeAffordances.test.ts` asserts only the `cursor:pointer` block; add an assertion for the `user-select`-only block, and tighten the capture group so a comment containing `.edit-mode` can't false-pass.
- **B2-FF (true check):** prompt-adherence is only provable via opt-in real-LLM golden (`captureGoldenWork.test.ts` CAPTURE=1) with English + Dutch-facts input asserting no Dutch in output. Unit test proves directive presence only.
- **B5-FF:** true transparent-over-hero geometric header overlay still deferred (cross-track); this round ships the legible dark-band interim.
- **B6-feature:** manual (non-import) atelier onboarding never ASKS for testimonials (praise slot is import/confirm-only) → collecting them is a feature for /feature.

## Feature-scope items (ROUTED OUT — not fixed in this round)
Recorded for founder / `/feature` + `work-library-board` track:
- **F1** Language option in editor Settings — no Settings panel exists (NOT-BUILT).
- **F2** Hero full-bleed bg image auto-populate + upload UX — support built, auto-populate NOT-BUILT (placeholder by design).
- **F3** About summary-on-home → dedicated page (CMS model) — work-library-board track.
- **F4** Work-packages summary-on-home → dedicated page (CMS model) — work-library-board track.
- **F5** About photographer image placeholder — not in frozen `aboutContract` (contract addition).
- **F6** Work "see all photos" / group expansion — **is** the work-library-board (last beta build-blocker).

---

## Triage table

| id | severity | tier | suspected area |
|----|----------|------|----------------|
| B1 | P2 | standard | `src/modules/wizard/work/questionGating.ts` MAX_QUESTIONS cap-recompute; `work.ts` dreamClient rank-6 slot |
| B2 | P1 | standard | `src/modules/audience/work/slimStrategy.ts` languages[0]→primaryLanguage; `copyPrompt.ts`/`storyInterview.ts` language rule |
| B3 | P2 | standard | editor header device toggle (`EditHeaderRightPanel.tsx`, `DeviceToggle.tsx`); Publish-options "Coming" stub |
| B4 | P1 | standard | preview-mode gating (`MainContent.tsx`, mode=preview), contentEditable/toolbar leak |
| B5 | P1 | **risky** (dual-renderer) | `src/modules/templates/atelier/skin.ts` headerOverlay:true vs `src/modules/skeletons/work/blocks/Header/WorkHeader.{core,tsx,published}.tsx` (no overlay wiring); logo/nav visibility + shell toolbars |
| B6 | P1 | standard→ | `src/modules/engines/workSections.ts` proof MUST section; `WorkProofTestimonials.*`; data-gating vs render |

Tiers escalate only after investigator returns Files-touched.

---

## Bugs

### B1 — Dream-client option appears then disappears in onboarding  [P2]
- **Symptom:** In work onboarding, the "dream client" option "came and gone back" (appeared, then reverted/disappeared).
- **Suspected area:** `questionGating.ts` — dreamClient is rank-6, the lowest slot under the hard cap of 5 visible questions (`MAX_QUESTIONS`). `questions()` recomputes after every commit, so answering other slots can push dream-client in/out of the visible set.
- **Expected:** once shown/answered, the dream-client question stays; visible-question set shouldn't thrash as other answers commit.
- **Env:** preview (work/photographer onboarding).

### B2 — Picked English, site generated in Dutch  [P1]
- **Symptom:** User selected English as the language in onboarding; generated site came out in Dutch.
- **Suspected area:** language field IS built (STEP-03 `languages`, EN+NL) → `facts.work.languages` → `languages[0]` → `primaryLanguage` (`slimStrategy.ts`) → "Write EVERY string in ${language}" (`copyPrompt.ts`, `storyInterview.ts`). Bug is either (a) answer ordering doesn't put English at `[0]`, or (b) LLM ignored the directive.
- **Expected:** selected language is honored in generated copy.
- **Env:** preview (work).

### B3 — Duplicated desktop/mobile preview toggle in header (one "coming soon")  [P2]
- **Symptom:** Header shows two desktop/mobile preview controls; one works, the other says "coming soon".
- **Suspected area:** editor header — scout found only ONE real `DeviceToggle` (both modes real) and a separate Publish-options dropdown "Coming" stub. Needs repro dig: possibly a second toggle appears in preview-mode header, or the "coming soon" control sits adjacent to the working one.
- **Expected:** one working desktop/mobile toggle; no dead "coming soon" duplicate.
- **Env:** preview/editor.

### B4 — Preview mode still shows editing options  [P1]
- **Symptom:** In preview, a few editing affordances remain.
- **Suspected area:** preview-vs-edit gating (store `mode`); `setMode('preview')` clears selection/toolbar but some contentEditable/toolbar affordances may leak (`MainContent.tsx`).
- **Expected:** preview mode is fully read-only — no editing chrome.
- **Env:** preview/editor.

### B5 — Atelier header: white background + no visible logo/logo-toolbar + no menu toolbar  [P1] (CLUSTER)
- **Symptom:** (1) header renders a white background, not per the Atelier template; (2) no logo and no logo toolbar; (3) no menu/nav toolbar.
- **Suspected area:** `atelier/skin.ts` declares `headerOverlay: true` (transparent on-dark nav over hero cover) but `WorkHeader` skeleton only implements `headerMode` static/fixed — no overlay wiring → solid/light band. Logo (text wordmark) + Nav primitives exist and emit `data-element-key` so shell toolbars should auto-consume; likely invisible/unattached because of the same header-render defect. Investigate whether logo/nav-toolbar failure shares the overlay root cause or is separate.
- **Expected:** Atelier header = transparent on-dark overlay per skin; logo + nav visible with their toolbars.
- **Env:** preview (Atelier home).
- **DUAL-RENDERER:** WorkHeader has `.tsx` + `.published.tsx` — both must be updated; reviewer blocks on parity.

### B6 — Atelier testimonials section didn't render  [P1]
- **Symptom:** No testimonials appeared on the generated Atelier home.
- **Suspected area:** `proof` is a MUST section, default shape = testimonials (`workSections.ts`), block `WorkProofTestimonials.*` exists. Investigate: was the section dropped for lack of testimonial data (by-design gating), or is it a render/generation bug?
- **Expected:** testimonials render (or a clear placeholder if no data — per greyed-placeholder policy).
- **Env:** preview (Atelier home).
