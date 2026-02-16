# Product Owner Handover — Lessgo Editor

## What This Is

Lessgo is an AI-powered landing page generator. Users describe their product → AI generates full landing page → users edit in visual editor → publish. This doc covers the editor and its subsystems, written after an intensive audit session.

---

## 1. Architecture Mental Model

```
Generation Flow:
  Onboarding → AI Strategy → Copy Generation + Image Fetch → Palette + Texture Selection → Save Draft

Editor Flow:
  Load Draft → LandingPageRenderer (mounts, sets CSS vars, renders sections) → User edits → Auto-save

Publish Flow:
  Draft → LandingPagePublishedRenderer (SSR, inline styles, no client state) → /p/[slug]
```

**Critical distinction**: Editor and Published use DIFFERENT renderers with DIFFERENT styling approaches:
- **Editor**: Zustand store + CSS variables + Tailwind classes + `useTypography()` hook
- **Published**: Props-only + inline styles + `getPublishedTypographyStyles()` + `getPublishedCardStyles()`

Any fix touching styling must account for BOTH paths. They share types but not rendering logic.

---

## 2. Background & Palette System (v3)

### How it works
- 30 palettes in `palettes.ts`, each with `mode` (dark/light), `temperature` (cool/neutral/warm), `energy` (calm/bold), `colorFamily`, and CSS strings for `primary`/`secondary`/`neutral` backgrounds.
- Palette selected during generation based on `strategy.vibe` (5 vibes: Dark Tech, Light Trust, Warm Friendly, Bold Energy, Calm Minimal).
- Section backgrounds assigned by position-based alternation (hero=primary, next=secondary, etc.)

### Key files
- `palettes.ts` — palette definitions
- `textures.ts` — texture overlays (dot-grid, line-grid, paper, none), `compileBackground()` composites texture onto palette
- `backgroundIntegration.ts` — `generateBackgroundSystemFromPalette()`, section assignment
- `vibeDesignTokens.ts` — vibe → palette + font mapping

### Known issues (being fixed)
- **Textures invisible**: Three compounding bugs. (a) Paper texture uses SVG filter in CSS `background-image` — browsers render it blank. (b) Dot-grid opacity 0.04 is imperceptible. (c) Two data-flow bugs strip textures: `LandingPageRenderer` overwrites on mount with raw palette (no texture), and `ThemePopover.handlePaletteSwap` has a stale closure that overwrites compiled backgrounds. Fix plan in `POreview.md`, implementation plan at `memoized-crunching-tarjan.md`.
- **`generateBackgroundSystemFromPalette()` ignores textures** — returns `palette.primary` directly. Only `GeneratingStep.tsx` and `ThemePopover.tsx` correctly call `compileBackground()`. Every other caller (LandingPageRenderer, regenerationActions, layoutActions) gets raw backgrounds.

### Lesson learned
When a value passes through multiple store writes, each write point must preserve composited data. "Pipeline is wired correctly" claims need verification at EVERY write point, not just the first.

---

## 3. Card & Text Color System

### How it works
- Each section has a background type (primary/secondary/neutral/custom).
- `getCardStyles()` (edit mode) and `getPublishedCardStyles()` (published) compute card backgrounds, borders, and text colors based on section background luminance and `uiBlockTheme` (warm/cool/neutral).
- Text colors for section-level content come from `colorTokens` (edit) or `getPublishedTextColors()` (published).


## 4. Typography System

### How it works
- Fonts set during generation via `getDesignTokensForVibe()` → deterministic font pair per vibe.
- Editor: `useTypography()` hook returns inline `fontFamily` styles. Also sets CSS vars `--font-heading`/`--font-body` on renderer wrapper.
- Published: `getPublishedTypographyStyles(variant, theme)` returns inline `fontFamily`.
- 4 self-hosted fonts (Inter, Sora, DM Sans, Playfair Display) load instantly. Others via Google Fonts.

---

## 5. Editor UX Refactor

### Spec and plan
- Spec: `newEdit.md`
- Master plan: `magical-swimming-wand.md`
- Split across 3 devs (A: Theme system, B: Left panel, C: Toolbar interaction)

### Key changes
- **ThemePopover**: Merged palette swatches, accent picks, texture toggle into single popover (replacing 5 old modals)
- **Left Panel**: Section outline (clickable, scrolls to section) + read-only "Your Inputs" accordion (collapsed by default)
- **Element Toggle**: Changed from add/remove to toggle modal showing all elements (required + optional) with switches. Uses `aiMetadata.excludedElements` array.
- **Text direct edit**: Click text → enter edit mode directly (skip ElementToolbar). CTA/buttons still go through ElementToolbar.
- **Regen Copy**: Button in header with confirmation dialog, progress bar, section counter.

### Bugs found during implementation (multiple rounds)

**Round 1 (7 bugs):**
1. Left panel inputs not showing → onboardingData not saved in `finalContent` during generation + load priority wrong in `persistenceActions.ts`
2. Element toggles all showing as ON → needed dual check (element presence + excludedElements)
3. Toggle off not working → `setSection` shallow merge clobbered `aiMetadata`
4. Card element granularity → PO decided: skip card-level elements entirely
5. Custom hex section background not rendering → Tailwind JIT doesn't compile dynamic `bg-[${var}]`, use inline styles
6. Custom CTA accent hex not applying → same Tailwind JIT issue, need `applyColorToken` utility
7. Regen Copy errors → rate limiting needed (800ms between API calls)

**Round 2 (3 more bugs):**
1. Left panel scroll cut off → missing `h-full` on LeftPanel outer div
2. Images lost after regen → broken snapshot/restore in `aiActions.ts` (spreads string into character keys). Fix: skip-during-merge approach with `isImageValue` + `isImageKey` helpers.
3. Element toggle still broken → 3 sub-issues in the dual-check logic

### Key architectural lessons

**`extractLayoutContent` is the gatekeeper.** In `storeTypes.ts:386`, this function merges store elements with schema defaults. It has an `excludedElements` parameter that skips elements entirely. When a key is undefined AND not excluded, it falls back to schema default text. This is why deleting element keys doesn't remove them — you must use the `excludedElements` array.

**Tailwind JIT limitation.** Dynamic arbitrary values like `bg-[${variable}]` are NOT compiled — Tailwind scans source at build time. All dynamic colors must use inline styles. This bit us in section backgrounds AND CTA accents.

**Shallow merge trap.** `Object.assign` in `contentActions.ts:256` is shallow. Passing `{ aiMetadata: { excludedElements: [...] } }` overwrites entire `aiMetadata`, losing other fields. Any nested store update must deep-merge.

---



---

## 7. Developer Management Lessons

### Plan evaluation protocol
Every dev plan was evaluated by reading the plan, then verifying EVERY claim against actual code:
- Do the cited functions exist with the described signatures?
- Are the line numbers accurate?
- Do the described data flows actually work that way?
- Are there side effects the plan doesn't account for?

**Hit rate: roughly 70% of plans had at least 1 significant error.** Common issues:
- Functions described as "dead code" that have active callers
- Stale closure bugs not identified
- Missing blast radius (e.g., removing a type field cascades to 50+ files)
- Confusing Tailwind class context with inline CSS context
- Claiming "pipeline is wired correctly" when secondary write paths destroy data

### Dev split strategy
When a single dev kept failing to fix bugs, we split into Dev X (data flow: onboardingData, element toggles, regen) and Dev Y (rendering: custom hex backgrounds, CTA accents, imageValue crashes, regen feedback). Zero file overlap prevented merge conflicts.


---

## 8. Key Files Reference

| File | Purpose |
|------|---------|
| `newEdit.md` | Editor UX refactor spec |
| `imageimprove.md` | Image-background compatibility spec |
| `newFont.md` | Typography modal redesign decision doc |
| `cardtextcolors.md` | Full UIBlock audit (40 buggy, 34 clean) |
| `POreview.md` | Texture system fix direction |


| `palettes.ts` | 30 palette definitions |
| `textures.ts` | Texture overlays + `compileBackground()` |
| `useLayoutComponent.ts` | Central hook for edit-mode sections (background, text colors, content) |
| `persistenceActions.ts` | Draft load/save — priority order matters |
| `generationActions.ts` | Regen, font init, background system updates |
| `storeTypes.ts:386` | `extractLayoutContent()` — element merge gatekeeper |
| `colorTokens.ts` | CTA colors, accent system |

---



---

## 10. Golden Rules

1. **Never trust "dead code" claims.** Always grep for callers before deleting.
2. **Never trust "pipeline is wired correctly."** Trace every write point end-to-end.
3. **Tailwind JIT does not compile dynamic values.** `bg-[${variable}]` will NOT work. Use inline styles for any dynamic color.
4. **Editor and Published are different worlds.** Same types, different renderers, different styling mechanisms. Test both.
5. **`extractLayoutContent` is the source of truth** for what elements appear. Not the store directly.
6. **Shallow merge is the default trap.** Zustand + Immer helps but `Object.assign` and spread still cause issues for nested objects.
7. **Verify dev plans against actual code.** Line numbers, function signatures, data flows. 70% have errors.
8. **`LandingPageRenderer` runs destructive operations on mount.** `updateFontsFromTone()` and `dynamicBackgroundSystem` both overwrite saved state. Any new "on mount" logic must guard against clobbering loaded drafts.
