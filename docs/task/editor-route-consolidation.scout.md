# editor-route-consolidation — SCOUT BRIEF (pre-`/discuss`)

**Status:** warm-up scouting only — NOT specced, NO branch. Produced 2026-07-18 (orchestrator, read-only). Feeds a future `/discuss` → `/feature` (editor track, POST-beta). Committed decisions: `memory/project_editor_route_consolidation` + `project_preview_consolidates_into_editor`. Every claim below is `file:line`-cited in the scout run; re-verify before building (code moves).

## The decision (recap)
`/edit/[token]` becomes the single home for **generate + reveal + preview**. `/preview` and `/generate` retire. Preview = an in-editor mode toggle (read-mode + mobile-view). Onboarding inputs LOCKED post-gen. Reveal/preview mobile-view = iframe + `X-Frame-Options: SAMEORIGIN` (true viewport), scoped narrowly.

## Current route reality
| Route | File | Renderer / store | Notes |
|---|---|---|---|
| `/edit/[token]` | `src/app/edit/[token]/page.tsx:16` | `LandingPageRenderer` + `EditProvider`, `mode='edit'` | full baseline, `resetOnTokenChange:true` |
| `/preview/[token]` | `src/app/preview/[token]/page.tsx:23` | `LandingPageRenderer` **inline** (`:543`), `setMode('preview')` | chromeless `?chrome=0` branch (`:106-136`); skips baseline (`:66-71`); **publish action bar lives here** |
| `/generate/[token]` | `src/app/generate/[token]/page.tsx:11` | `LandingPageRenderer` + `PageRevealAnimation` | serves the **generic wizard** reveal, via `continueRouting.ts:63` |
| `/onboarding/[token]` | `src/app/onboarding/[token]/page.tsx:101` | wizard **or** journey dispatch, `useWizardStore` | journey when `isJourneyEligible` |
| `/p/[slug]` | `src/app/p/[slug]/page.tsx:122` | `LandingPagePublishedRenderer` | published (untouched) |

- **No `/reveal` route exists** — reveal is a journey STEP body (`StepReveal.tsx`), which embeds `/preview/{token}?chrome=0` in an **iframe** (`StepReveal.tsx:120`) with a desktop/phone toggle, forward = `router.push('/edit/{token}')`.
- **Store concepts already present:** `setMode('preview'|'edit')` (`coreActions.ts:196`), inert Edit/Preview segmented control (`EditHeaderRightPanel.tsx:167-181`), a **dead** `DeviceToggle` (`DeviceToggle.tsx:23`, mounted nowhere) + unused `setDeviceMode` (`layoutActions.ts:698`). So "preview = mode flag" is partly pre-wired; mobile-view is not.

## XFO — already split correctly (verbatim `next.config.js`)
```
{ source: '/preview/:token+',      headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }
{ source: '/((?!preview/).*)',     headers: [{ key: 'X-Frame-Options', value: 'DENY' }] }
```
Mutually exclusive by construction (`:token+` vs negative-lookahead). **SAMEORIGIN sits on `/preview` today** (E1 interim). Config carries an explicit "MUST MOVE WITH THE REVEAL" note — retiring `/preview` must re-point this source in the **same change**, never delete it. XFO is runtime — `npm run build` can't catch a mistake, only `curl -I`.

## Retirement blast radius
- **`/preview/{token}` refs:** `StepReveal.tsx:120` (iframe, XFO-coupled) · `usePreviewNavigation.ts:33,41` · `EditLayoutErrorBoundary.tsx:84` · `admin/page.tsx:287` · `WorkLibraryClient.tsx:246` (+test) · `preview/[token]/privacy/page.tsx:62,92` · `next.config.js` · ~7 READMEs + `app-chrome.css:15`.
- **`/generate/{token}` refs:** `continueRouting.ts:14,63` · `app/README.md:51` · route dir `app/generate/[token]/**`.
- **Route-split registry:** `lib/domains/appSplit.ts:62-73` lists both `/preview` + `/generate` — update on retire.
- **Exclude (false positives):** `/api/**/generate-copy`, `/api/generate-privacy-policy`, `@/modules/generatedLanding/**`, `(blog-preview)` route group.

## Seams & risks
1. **`.app-chrome` bleed** — journey wraps in `.app-chrome` (`JourneyShell.tsx:178`); template output must never live under it → why reveal is an iframe. Read-mode inline is OK (import-guarded), mobile-view needs the iframe (separate document).
2. **Dual-renderer** — preview+edit share `LandingPageRenderer` (decision confirmed); published is separate. Mode-flag vs viewport are separable concerns.
3. **`EditProvider` baseline-split** — preview skips the ~68KB baseline (`preview/page.tsx:66-71`); edit loads it. One consolidated provider must serve both without losing the optimization.
4. **`continueRouting` is verbatim-ported, load-bearing** (`continueRouting.ts:9-26`, "Do NOT simplify") — branch 2 = `/generate`; retiring collapses it into the `/edit` branches.
5. **Two stores** — onboarding=`useWizardStore`, editor=`useEditStore`; handoff is DB + `router.push`. Moving reveal onto `/edit` means `EditProvider` bootstraps from a just-generated draft as first-load state (+ preserve `StepBuilding.tsx:66-90` one-drive-per-mount guard or generation double-fires).
6. **`tabManager` singleton** (`PreviewButton.tsx:8-14`) — new-tab preview lifecycle changes if preview folds into the same tab.

## Open questions for `/discuss` (⭐ = founder call)
1. ⭐ **Publish flow home** — publish currently lives ONLY on `/preview` (admin + work-dashboard "Update site" deep-link there). Does publish move INTO the editor? **This blocks `/preview` deletion** — out of the stated scope but a hard dependency.
2. ⭐ **Generic wizard vs journey** — `/generate` serves the wizard reveal; journey already bypasses it. Retiring `/generate` forces a wizard-path reveal answer, not only a journey change. Both consolidate, or journey-first?
3. **Hybrid preview?** read-mode = inline `setMode('preview')`; mobile-view = iframe. Or always iframe?
4. **Where does XFO SAMEORIGIN re-point** — `/edit/:token+` (widens the whole editor to framable) or a narrow `/edit/[token]/preview` sub-route?
5. **Onboarding lock (decision 4) is NOT implemented today** — no lock flag; `/onboarding/{token}` load-detection will re-enter a confirmed brief (`onboarding/[token]/page.tsx:136-155`). Needs a guard. In scope?
6. `/preview/[token]/privacy` legal-page preview + `EditLayoutErrorBoundary.tsx:84` fallback — new homes?

## Proposed phasing (6, each small-ish; refine at plan)
1. **Preview-as-editor-mode (read-mode inline)** — real Edit/Preview flip driving `setMode`; kill new-tab `usePreviewNavigation`. *(`EditHeaderRightPanel`, `PreviewButton`, `usePreviewNavigation`, canvas mode branch)*
2. **Mobile-view toggle (iframe viewport)** — wire dead `DeviceToggle`/`setDeviceMode` through a narrow iframe. *(`DeviceToggle`, `layoutActions`, new editor-preview iframe surface, `GlobalAppHeader`)*
3. **Move XFO SAMEORIGIN** onto the editor preview surface; keep sources exclusive; `curl -I` verify. *(`next.config.js`)*
4. **Fold reveal onto edit route** — STEP 06 → editor first-load reveal; STEP 05 completion lands in editor; drop journey→`/preview?chrome=0`. *(`StepReveal`, `StepBuilding`, `JourneyShell`, `edit/page.tsx`+`EditProvider` bootstrap)*
5. **Retire `/generate`** — delete route, collapse `continueRouting` branch 2, drop from `appSplit`. *(`continueRouting`, `appSplit`, delete `app/generate/**`)*
6. **Retire `/preview`** — delete route+privacy, re-point admin/work-dashboard/error-boundary, **relocate publish (Q1)**, drop from `appSplit`, update READMEs. *(blocked on Q1)*

⚠️ **Decision-vs-reality deltas** (resolve at `/discuss`): no `/reveal` route (only `/generate`); `/generate` serves the wizard not just onboarding; XFO split correct but SAMEORIGIN still on `/preview` (must move); onboarding "LOCKED" guarantee unimplemented; publish-on-`/preview` is an unscoped hard blocker.
