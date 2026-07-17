# toolbar-beta-followup — audit

## Phase 1 — Regen surface + section wire + load-bearing e2e

### Files changed
- `src/hooks/editStore/aiActions.ts` (applyVariation guard — authorized out-of-scope fix)
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx`
- `src/app/edit/[token]/components/toolbars/actionSets.tsx`
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`
- `e2e/toolbar-regen.spec.ts` (new)
- `playwright.config.ts`

### Per-file changes

**SectionToolbar.tsx**
- Added `'regen'` to `CHROME_HIDDEN_ACTIONS` (header/footer chrome isn't a copy-contract section → hide, per ruling 1).
- Added `regenerateSection: s.regenerateSection` to the `useShallow` selector (stable action ref).
- Inserted a new `regen` action into `primaryActions` **after `add-element`, before `move-up`**: id `regen`, label `Regen`, icon `refresh` (the already-present unused SVG in the local `ActionIcon` iconMap), `disabled: aiGeneration.isGenerating`, handler `() => regenerateSection(sectionId)`. Purely additive; `aiActions.ts` untouched. The existing render loop already honours `disabled` + the `disabledTitle ?? label` fallback, so no shell change needed.

**ToolbarShell.tsx** — deleted only the dead "Ask AI slot — intentionally NOT rendered…" comment (~281-282). The `'hidden'` `TrailingSlotState` arm / `entry.designMenu !== 'hidden'` check left intact (ruling 4).

**actionSets.tsx** — removed the `· [Ask AI]` token from the t2-anatomy comment (~32-33). `TrailingSlotState` type + `'hidden'` arm untouched (ruling 4).

**TextToolbarMVP.tsx** — collapsed the dead Ask-AI comment (~776-778) to `{/* Divider + AI Sparkle — the existing sparkle → variations flow. */}`. No functional change.

**playwright.config.ts** — registered `/toolbar-regen\.spec\.ts/` in the `authed` project allowlist.

**e2e/toolbar-regen.spec.ts (new)** — mirrors the toolbar-dispatch harness (authed Clerk storageState → persona → `/api/start` → `seedDraft` meridian → `/edit/<token>`), serial. Three tests:
1. **element regen** — click hero `headline` (→ text toolbar), capture original text, click `[data-action="ai-variations"]` (→ `regenerateElementWithVariations` → `POST /api/regenerate-element`), assert the "Choose Variation" panel opens with >1 option (`Current` + variations), pick **Variation 1** (index 1, non-zero), click **Apply Variation**, then assert the element's DOM text `toContainText(' - Enhanced version')` **and** differs from the original. This asserts real content lands, not a 200.
2. **section regen** — `page.route('**/api/regenerate-section')` adds a 1200 ms delay so in-flight is deterministic; select the hero **section** (corner {x:4,y:4} → section toolbar), assert `regen` is present and not `aria-disabled`, click it, assert the always-mounted header Regen-Copy control shows `/Regenerating/i` (in-flight), then assert the hero headline DOM `toContainText('Transform Your Business with AI-Powered Solutions')` and differs from the original.
3. **button/CTA affordance** — select `[data-element-key="cta_text"]` (→ element toolbar), assert `[data-action="regenerate-copy"]` present (the existing Button/CTA Regenerate, same `regenerateElementWithVariations` call — presence assertion, no second flow).

**Pinned mock substrings (read from the route files, not guessed):**
- Section: `generateMockSectionContent` (`regenerate-section/route.ts:112-160`) → hero `headline` = `'Transform Your Business with AI-Powered Solutions'`.
- Element: `generateMockVariations` (`regenerate-element/route.ts:126-136`) → variation[0] = `` `${content} - Enhanced version` ``; the store prepends current copy at index 0, so panel index 1 = `` `${current} - Enhanced version` `` → substring `' - Enhanced version'`.

### Deviations from the plan
- **In-flight affordance for section regen.** The plan expected SectionToolbar's fixed "Regenerating section content…" progress card. In the e2e that card never mounts: on regen the section re-renders and the floating shell detaches (`[data-toolbar-chrome]` gone, `.fixed` regen card absent — confirmed by store+DOM diagnostics), so SectionToolbar unmounts before painting the card. I asserted the **always-mounted header Regen-Copy control** (`EditHeaderRightPanel.tsx:154-158`, shows "Regenerating…" off the same `aiGeneration.isGenerating`) as the stable in-flight signal instead. Store state during the delay was verified correct (`isGenerating:true`, `context.type:'section'`, matching `sectionId`). Conservative, in-scope call; logged here.
- No other deviations. Zero `.published.tsx` / published-renderer files touched. `aiActions.ts` + route files untouched.

### Verification (gates)
- `npx tsc --noEmit` — **PASS** (clean). NOTE: a bare worktree with no prior `next dev`/`build` has no generated `next-env.d.ts`, so tsc first reported a phantom `TS2307` on `@/assets/images/founder.jpg` (image-module types come from `next-env.d.ts`). Running `npm run build` regenerated it; tsc then clean. Documented env artifact, not a code error.
- `npm run test:run` — **PASS** (224 files, 3828 passed / 18 skipped).
- `npm run lint` — **PASS** (warnings only, all pre-existing `<img>`/exhaustive-deps; no errors).
- `npm run build` — **PASS**.
- `npm run test:e2e` (mock mode, `E2E_PORT=3199` fresh server):
  - `toolbar-regen.spec.ts` › **section regen** — PASS (in-flight + mock content lands).
  - `toolbar-regen.spec.ts` › **button/CTA affordance** — PASS.
  - `toolbar-regen.spec.ts` › **element regen** — **FAIL** on a real app bug (see Blocked). The test is correct and will pass once the bug is fixed.
  - `toolbar-dispatch.spec.ts` — PASS (all cases, incl. the section-subset + footer/header chrome gating — adding `regen` didn't disturb them).
  - `link-picker.spec.ts` — PASS.

### Blocked — RESOLVED (authorized fix applied)

The out-of-scope fix was authorized and `src/hooks/editStore/aiActions.ts` added to Phase 1 Files-touched.

**Guard applied** in `applyVariation` (`aiActions.ts`, inside the metadata-update `set()` recipe, ~704-716, unchanged truthy check `if (section.elements && section.elements[elementKey])`):
```ts
const elVal: any = section.elements[elementKey];
if (elVal !== null && typeof elVal === 'object' && !Array.isArray(elVal)) {
  elVal.aiMetadata = {
    ...elVal.aiMetadata,
    lastGenerated: Date.now(),
    isCustomized: variationIndex === 0, // First option is original content
  };
}
```
Bare-string elements (meridian's common case) now no-op instead of throwing `Cannot create property 'aiMetadata' on string …`. `isCustomized`/`lastGenerated` semantics preserved exactly; section-level `editMetadata` untouched; only this one function edited. No `.published.tsx` / published-renderer touched.

**Re-run gate — all green:**
- `npx tsc --noEmit` — **PASS** (clean; `npm run build` first regenerated `next-env.d.ts`, then tsc clean).
- `npm run test:run` — **PASS** (224 files, 3828 passed / 18 skipped).
- `npm run lint` — **PASS** (warnings only, no new errors).
- `npm run build` — **PASS**.
- `npm run test:e2e` (`E2E_PORT=3199`, fresh dev server): **19 passed**.
  - `toolbar-regen.spec.ts` › **element regen** — **PASS** (picked variation now lands in the DOM; bug fixed).
  - `toolbar-regen.spec.ts` › **section regen** — PASS.
  - `toolbar-regen.spec.ts` › **button/CTA affordance** — PASS.
  - `toolbar-dispatch.spec.ts` — PASS. `link-picker.spec.ts` — PASS.
  - Note: e2e setup flaked twice against a stale/broken reused dev server (persona 500, then Clerk sign-in timeout); killing the stale PID on 3199 so playwright spun a fresh `npm run dev` resolved it. Harmless `window is not defined` SSR warnings from the dev-only `__useEditStoreDebug` hook print but do not fail any test.

---

### (Original block, for history) Blocked — element-regen apply path throws (out-of-scope fix)

The load-bearing element-regen e2e exposed a **real regression** in the accept-variation path, exactly the risk this phase existed to catch.

**(a) Exact failure.** After picking a non-zero variation and clicking **Apply Variation**, the picked copy does **not** land in the DOM. Diagnostics (via `window.__useEditStoreDebug`) proved:
- selection is correct — `elementVariations.selectedIndex === 1`, `variations[1]` = `"Ship on Friday. Sleep on <em>Saturday</em>. - Enhanced version"`.
- the store **content** IS updated to the suffix value (so `updateElementContent` ran), **but** `elementVariations.visible` stays `true` and a pageerror fires:
  `Cannot create property 'aiMetadata' on string 'Ship on Friday. Sleep on <em>Saturday</em>. - Enhanced version'`.

Root cause: in `applyVariation`, after `updateElementContent` replaces the element with a **plain string**, the follow-up `set()` does `(section.elements[elementKey] as any).aiMetadata = { ... }` — assigning a property onto a **string primitive** throws (immer/strict mode). This aborts the recipe (panel never hides) and, because `handleApplyVariation` calls `applyVariation(...)` before its DOM force-sync, the force-set `innerHTML`/`textContent` never runs → the DOM keeps the original. Meridian stores text elements as bare strings, so this breaks element-regen accept for the common case.

**(b) File(s) I'd need to edit (NOT in my Files-touched):** `src/hooks/editStore/aiActions.ts` — `applyVariation` (~lines 700-711).

**(c) Proposed fix (minimal, single function):** guard the metadata write so it only runs for object-valued elements:
```ts
const elVal: any = section.elements?.[elementKey];
if (elVal !== null && typeof elVal === 'object' && !Array.isArray(elVal)) {
  elVal.aiMetadata = {
    ...elVal.aiMetadata,
    lastGenerated: Date.now(),
    isCustomized: variationIndex === 0,
  };
}
```
String-valued elements carry no per-element `aiMetadata` (section-level metadata is unaffected), so the no-op is correct. Blast radius = one function; the e2e's element-regen test is the ready-made proof.

**Requested action:** amend Phase 1's Files-touched to add `src/hooks/editStore/aiActions.ts`, then I (or the next impl pass) apply the guard and re-run — the element-regen e2e should go green, completing the phase's gate.

### Open risks
- The section-regen SectionToolbar progress card is effectively unreachable in the selected-section→regen flow (shell detaches). Not in scope here; the header control covers in-flight feedback. Flag for a future toolbar polish pass if the card is meant to be the primary signal.

---

## Phase 2 — LinkPicker replaces Button Settings destination + goal-CTA preservation

### Files changed
- `src/components/toolbars/buttonCtaAdapter.ts` — **NEW** (pure module, no 'use client')
- `src/components/toolbars/buttonCtaAdapter.test.ts` — **NEW** (vitest)
- `src/components/toolbars/ButtonConfigurationModal.tsx` — swapped destination fields for LinkPicker; imports adapter

### Per-file changes

**`buttonCtaAdapter.ts` (new).** Pure adapter. Landed API (real type names):
- `interface ButtonConfig { type: 'link'|'form'|'link-with-input'|'page'; text; url?; pageId?; pathSlug?; formId?; behavior?; ctaType?; inputConfig?; leadingIcon?; trailingIcon?; iconConfig? }` — moved verbatim from the modal.
- `configFromCta(cta: CTAButton, text: string, role: 'primary'|'secondary', legacy: any): ButtonConfig` — moved verbatim (byte-identical body).
- `buildCtaButton(config: ButtonConfig, role: 'primary'|'secondary', followGoal: boolean): CTAButton | undefined` — moved verbatim. GOAL_REF branch is `if (role === 'primary' && followGoal) return { role:'primary', dest:'GOAL_REF' }` — the FIRST statement, so any picker-set url/pathSlug in `config` is unreachable.
- `configToPickerValue(config: ButtonConfig): string` — `type==='page'`→`pathSlug ?? ''`; `'link'`→`url ?? ''`; else `''`.
- `applyPickerLink(config: ButtonConfig, link: Link): ButtonConfig` — `link.dest.kind==='page'`→`{...config, type:'page', pathSlug: link.dest.pathSlug}`; else→`{...config, type:'link', url: resolveDestination(link.dest)}`. `link.source` is never read → dropped. `resolveDestination` (from `@/utils/resolveCtaHref`) is the codebase's Destination→href helper (used identically by `configFromCta`, `normalizeCtas`).

**`ButtonConfigurationModal.tsx`.** Imports `ButtonConfig`, `buildCtaButton`, `configFromCta`, `configToPickerValue`, `applyPickerLink` from `./buttonCtaAdapter`; deleted the local copies of the interface + two functions (behavior byte-identical — same functions, now imported). Added `buildSectionLinkOptions` + `LinkPicker` imports. Dropped now-unused `toDestination`/`resolveDestination`/`Destination` imports.
- Computes `sectionOptions = buildSectionLinkOptions(sections || [])` and `pickerPageOptions = pageOptions.length > 1 ? pageOptions : []`.
- RadioGroup: "External Link" + "Link to Page" collapsed into ONE "Link" option (value `'link'`). Radio value binds `config.type==='page' ? 'link' : config.type`, so the Link radio owns both `'link'` and `'page'`. "Native Form" + "Link with Input" options unchanged.
- Deleted the page `Select` (743-761) and the URL `Input` (764-776); render `LinkPicker` when `config.type==='link' || 'page'`, wired `value={configToPickerValue(config)}`, `sectionOptions`, `pageOptions={pickerPageOptions}`, `onChange={(link) => setConfig(prev => applyPickerLink(prev, link))}`. No legal/social options (ruling 3, strict parity). A small read-only text span shows the current href beside the picker trigger.

### GOAL_REF preservation — which lines stay OUTSIDE the swap
- `followGoal` state (modal L172), the goal-follow info card + Detach button (L551-575), the re-attach control (L578-586): UNTOUCHED.
- `buildCtaButton`'s `role==='primary' && followGoal ⇒ GOAL_REF` early return: moved verbatim into the adapter, still the first branch — picker residue in `config` cannot leak.
- `handleSave` (validation + the `buttonConfig`/`cta`/`ctaConfig` writes + `elementMetadata[…].cta` persistence): UNTOUCHED. LinkPicker only mutates `config` via `applyPickerLink`, which feeds the exact existing `config` shape → persistence path byte-identical.
- The whole `!followGoal` block stays gated by `{!followGoal && (…)}`, so a goal-following CTA hides the destination editor exactly as before.

### Tests (buttonCtaAdapter.test.ts) — 15 cases, all pass
- GOAL_REF preservation: primary+followGoal ⇒ `{role:'primary',dest:'GOAL_REF'}` regardless of picker-set url OR pathSlug; GOAL_REF still resolves through the render pass (`normalizeCtas` with an M3 goal → buttonConfig → `resolveCtaHref` = `https://calendly.com/demo`, non-empty); detach→picker-set dest→re-attach ⇒ GOAL_REF (no residue leak).
- Round-trips: external URL → `{type:'link',url}` → CTAButton `{kind:'external'}`; page pick → `{type:'page',pathSlug}` → `{kind:'page'}`; section anchor → `{type:'link',url:'#pricing'}` → `{kind:'section'}`; `source` never present on config or CTAButton.
- `configToPickerValue`: page→pathSlug, link→url, form→'', empty→''.
- `configFromCta` reopen round-trip: page + external CTAButton → picker-seedable config.

### Green-gate results
- `npx tsc --noEmit`: PASS (clean).
- `npm run test:run`: PASS (225 files, 3841 passed / 18 skipped; includes new adapter test + existing LinkPicker.test.tsx).
- `npm run lint`: PASS (no new errors; only pre-existing `<img>`/exhaustive-deps warnings).
- `npm run build`: PASS.
- `npm run test:e2e` (`link-picker` + `toolbar-regen` + `toolbar-dispatch`, fresh server `E2E_PORT=3199`): PASS (19 passed). The `window is not defined` lines are the pre-existing SSR-only debug-hook warnings, not failures.

### Confirmations
- Zero `.published.tsx` / published-side files changed (`git status | grep published` → none).
- No persistence-path change: `handleSave`, `buildCtaButton`, `configFromCta`, legacy `buttonConfig` sibling write, `elementMetadata[…].cta` all byte-identical (functions moved verbatim, not modified).

### Deviations
- **`pickerPageOptions = pageOptions.length > 1 ? pageOptions : []`** (in-scope judgment): the replaced "Link to Page" radio only appeared when `pageOptions.length > 1`. To keep strict parity (a single-page project offers no cross-page target), I gate the picker's `pageOptions` the same way. Conservative; matches prior behavior.
- **`git checkout -- <snapshot>`**: running the test/build suite left `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` showing a working-tree change that was a pure LF→CRLF autocrlf artifact (empty content diff). It is outside my Files-touched, so I restored it with `git checkout --` on that single file to keep the change set to exactly my 3 files. No branch/commit/reset state touched; content was identical. Flagging per the git-command rule.

### Open risks
- The modal's existing save-validation message for an empty Link destination still reads "URL is required for external link." even though the Link editor now also covers section/page. Cosmetic; validation logic (locked-untouched) is correct. Left as-is.
