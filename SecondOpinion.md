# Editor UX Refactor — Bug Fix Plan (7 Issues)

All issues from devReview.md. Ordered by dependency — fix bottom-up.

---

## Fix 1: `setSection` shallow merge kills aiMetadata (Bug 3 root cause, affects Bug 2)

**File:** `src/hooks/editStore/contentActions.ts` (~line 256)

`setSection` uses `Object.assign(state.content[sectionId], sectionData)` — shallow merge. Passing `{ aiMetadata: { excludedElements: [...] } }` overwrites the entire `aiMetadata` object, losing `aiGenerated`, `isCustomized`, `aiGeneratedElements`, etc.

**Fix:** Deep-merge `aiMetadata` specifically:
```typescript
if (sectionData.aiMetadata && state.content[sectionId].aiMetadata) {
  state.content[sectionId].aiMetadata = {
    ...state.content[sectionId].aiMetadata,
    ...sectionData.aiMetadata
  };
  const { aiMetadata, ...rest } = sectionData;
  Object.assign(state.content[sectionId], rest);
} else {
  Object.assign(state.content[sectionId], sectionData);
}
```

**Verify:** Toggle off element → check store → `aiMetadata` still has all original fields + new `excludedElements`.

---

## Fix 2: ElementToggleModal shows all elements as ON (Bug 2)

**File:** `src/app/edit/[token]/components/ui/ElementToggleModal.tsx`

Two issues:
- **a)** `isElementOn` reads `excludedElements` correctly BUT Fix 1 above may be clobbering the data. Fix 1 first, then retest.
- **b)** On page load, verify `aiMetadata.excludedElements` survives the save→load cycle. Check `persistenceActions.ts` `loadFromDraft` — does it restore full `content[sectionId].aiMetadata`? If `excludedElements` is being stripped during export/import, that's the bug.

**Verify:** Generate page → some elements excluded by AI → save → reload → open ElementToggleModal → excluded elements show as OFF.

---

## Fix 3: Card elements showing individually (Bug 4)

**File:** `src/app/edit/[token]/components/ui/ElementToggleModal.tsx`

`getSectionElementRequirements` returns `highlights.title`, `highlights.description`, `highlights.icon` as separate elements. For card-based sections, these are sub-properties of a card collection — toggling `highlights.description` off removes description from ALL cards.

**Decision needed from PO:** Is per-sub-property toggle the desired behavior, or should the entire card collection (`highlights`) be a single toggle?

**If single toggle:** In `ElementToggleModal`, group elements by prefix before rendering:
```typescript
// Group "highlights.title", "highlights.description" → "highlights"
const grouped = new Map<string, string[]>();
allElements.forEach(el => {
  const base = el.includes('.') ? el.split('.')[0] : el;
  if (!grouped.has(base)) grouped.set(base, []);
  grouped.get(base)!.push(el);
});
// Render grouped keys, toggle all sub-elements together
```

**If per-property toggle is OK:** Just clarify the UI label. Show "Highlights — Description" not "highlights.description". Already cosmetic fix in `formatElementLabel`.

---

## Fix 4: ThemePopover "No palette active" (Bug 6)

**File:** `src/hooks/editStore/regenerationActions.ts` (~line 238) + `src/hooks/editStore/generationActions.ts`

`paletteId` is never written to the store during generation. When `generateBackgroundSystemFromPalette(palette)` runs, the result is spread into theme colors but `paletteId` is not included.

**Fix:** Wherever the background system updates the theme, also set `paletteId`:
```typescript
state.theme.colors.paletteId = palette.id;
```

Check these locations:
- `regenerationActions.ts` where theme colors are set from background system
- `generationActions.ts` initial generation flow
- `backgroundIntegration.ts` → confirm `generateBackgroundSystemFromPalette` returns or exposes `palette.id`
- The design questions flow (`GeneratingStep.tsx` / save flow) — where the user-selected palette is applied

Also set `textureId` at the same time if texture is selected.

**Verify:** Generate page → open ThemePopover → palette swatches visible, active palette highlighted.

---

## Fix 5: Left panel inputs empty (Bug 1)

**File:** `src/app/edit/[token]/components/layout/LeftPanel.tsx`

LeftPanel reads `onboardingData` from the edit store. After page reload, the onboarding store is empty (not persisted). The edit store's `onboardingData` is reconstructed from the API response in `persistenceActions.ts` — but the fields may not map correctly.

**Fix:** Check `persistenceActions.ts` `loadFromDraft` — verify `onboardingData` is fully restored with `oneLiner`, `validatedFields`, `hiddenInferredFields`, `featuresFromAI`. If the API response uses different field names (e.g., `inputText` instead of `oneLiner`), map them correctly.

If the data simply isn't saved to the DB: ensure the save/export includes full `onboardingData` and the load/import restores it.

**Verify:** Generate page → left panel shows inputs → refresh page → left panel still shows inputs.

---

## Fix 6: Custom hex section background lost on refresh (Bug 5)

**File:** `src/app/edit/[token]/components/ui/SectionBackgroundModal.tsx` + persistence layer

Custom hex is saved to `content[sectionId].sectionBackground` via `setSectionBackground`. Two possible failure points:
- **a)** Export doesn't include `sectionBackground` per section
- **b)** Load doesn't restore it

**Fix:** Check the store export function — does it serialize `sectionBackground` for each section? Check `loadFromDraft` — does it restore `sectionBackground`? If either is missing, wire it up.

Also check: after applying custom hex, does it actually render? The renderer might not read `sectionBackground.custom.solid` correctly for the new radio-button format (A3 changed the modal).

**Verify:** Apply custom hex → section updates → refresh → same custom hex persists.

---

## Fix 7: Regen Copy — no feedback + images gone (Bug 7)

**File:** `src/hooks/editStore/generationActions.ts` (lines 516-563)

**7a — No feedback:**
`regenerateAllContent` sets `isGenerating = true` but no visible progress indicator in the UI. Add per-section status updates:
```typescript
set(draft => { draft.aiGeneration.status = `Regenerating ${sectionType}...`; });
```
And in `EditHeaderRightPanel.tsx`, show the status text or a progress bar while `aiGeneration.isGenerating` is true.

**7b — Images disappearing:**
`regenerateAllContent` calls `regenerateSection` per section. If `regenerateSection` overwrites the entire `elements` object from the API response, image URLs are lost.

**Fix:** Before calling the regen API, snapshot image element keys. After API response, restore them:
```typescript
// Before regen
const imageKeys = Object.entries(elements).filter(([k, v]) =>
  k.includes('image') || k.includes('hero_image') || k.includes('avatar')
);
// After regen response
imageKeys.forEach(([k, v]) => { newElements[k] = v; });
```

**Verify:** Regen Copy → loading indicator visible → copy updates → images remain unchanged.

---

## Execution Order

```
Fix 1 (setSection merge)     — blocker for Fix 2
Fix 2 (ElementToggle ON/OFF) — depends on Fix 1
Fix 3 (card grouping)        — independent, needs PO decision
Fix 4 (paletteId)            — independent
Fix 5 (left panel inputs)    — independent
Fix 6 (custom hex persist)   — independent
Fix 7 (regen feedback+images)— independent

Parallel: Fix 1→2, Fix 3, Fix 4, Fix 5, Fix 6, Fix 7
```

## Unresolved
- Bug 4: Per-sub-property toggle vs whole-card toggle — PO decision needed

==============

My view:


1. Bug 4 — Card sub-property toggle: What's the call?

  SecondOpinion correctly flagged this needs your decision. My recommendation: single toggle per card collection (group by prefix). Reasoning:
  - "Turn off description from ALL feature cards" is a weird edit — if you don't want description on one card, you'd just clear the text
  - Toggling highlights as a unit = "show/hide the feature cards section" which is intuitive
  - If later you want per-sub-property control, it's an expansion, not a rewrite

  My view: delete at card level is already there as a separate feature. So here it should be just skip all card elements.

  2. Regen Copy feedback (Bug 7a) — how much UX?

  SecondOpinion says per-section status text + progress in header. Options:
  - Minimal: spinner on the button + disable, toast when done
  - Medium: per-section status text in header ("Regenerating Features...")
  - Rich: overlay/shimmer on each section as it regenerates

  Minimal ships fastest. Medium is what SecondOpinion suggests. Which do you want?

  My view: Minimal.. its enough..

  3. Bug 5 (left panel inputs) — scope of "inputs"?

  The spec says: productName, oneLiner, landingGoal, offer, features, assetAvailability. But onboardingData in the store also has understanding (categories, audiences,
  whatItDoes). Should the accordion show ALL of these, or just the 6 user-facing fields from the spec?

My view: All

  ---
  Suggestions (dev perspective)

  A. Fix 4 (paletteId) is likely the deepest bug. It's not just "set paletteId in one place" — the generation flow passes through multiple layers (design questions →
  GeneratingStep → backgroundIntegration → store). If paletteId was never wired, textureId probably wasn't either. I'll need to trace the full flow. SecondOpinion's fix is     
  directionally correct but may underestimate the number of touchpoints.

  My view: ok

  B. Fix 6 (custom hex persistence) may also be a renderer issue, not just persistence. SecondOpinion mentions this possibility at the end but doesn't emphasize it. The new    
  SectionBackgroundModal uses radio buttons with a different data shape than the old gradient builder. The renderer might be looking for the old shape. I'll verify both paths. 
  My view: ok


  C. Fix 3 (card grouping) affects the toggle-on path too. If we group by prefix, toggling a card collection ON needs to add ALL sub-elements (highlights.title,
  highlights.description, highlights.icon), not just the base key. SecondOpinion's grouping code only shows the UI grouping, not the store write side.

    My view: doesnt matter as we are excluding cards

  D. Missing from SecondOpinion: "toggle off worked once then stopped" (Bug 3). Fix 1 (deep merge) explains intermittent behavior if aiMetadata gets clobbered on second toggle.
   But there might also be a stale closure or re-render issue in ElementToggleModal — the modal reads state on open but doesn't subscribe to changes. Worth checking.

   My view: ok


   ==========

   PO review of the plan

   Fix 1 — Approved. Deep-merge for aiMetadata + editMetadata is clean. Correctly identifies 13+ callers benefit. Good blast radius awareness.                                   
  
  Fix 2 — Approved. Correct to retest after Fix 1 before writing code.                                                                                                                                                                                                                                                                                          
  Fix 3 — Misread PO direction. PO said: "delete at card level is already there as a separate feature. So here it should be just skip all card elements." This means: don't show
   card sub-elements in the modal at all, not group them as a single toggle. Fix should filter out dot-separated elements entirely:
  const displayElements = allElements.filter(el => !el.includes('.'));
  Simpler than the grouping approach.

  Fix 4 — Approved

  Fix 5 — Too uncertain. The plan has 5 paragraphs of "likely", "might be", "debug approach". The fallback code is good — just ship that and verify. Cut the analysis, keep the 
  fix.

  Fix 6 — Too uncertain. Same issue — goes back and forth. The plan concludes "Actually no code change needed for rendering" then says "Real issue might be". Need to actually  
  reproduce and check the store in devtools before writing code. This should be a debug-first task, not a code-first task.

  Fix 7a — Exceeds PO ask. PO said "Minimal.. its enough" = spinner on button + disable + toast when done. Plan describes per-section progress text. Scale back to: spinner on  
  button during regen, disable button, toast/notification on complete.

  Fix 7b — Approved. Image preservation approach is sound. Good catch on Promise.all race condition risk.

  ================

# Round 2 — Corrected Fixes + Dev Split

Round 1 fixes failed. Root causes re-verified against actual code. 3 fixes in Round 2 plan will fail as written — corrections below.

## Dev Split

**Dev X: Data Flow (Fixes 1R2, 2R2, 6R2)**
Files: GeneratingStep.tsx, persistenceActions.ts, ElementToggleModal.tsx, generationActions.ts

**Dev Y: Rendering (Fixes 3R2, 4R2, 5R2, 7R2)**
Files: useLayoutComponent.ts, colorTokens.ts, 8 Hero UIBlock files, EditHeaderRightPanel.tsx

Zero file overlap. Both start immediately.

---

## Dev X Fixes

### X1: onboardingData not saved during generation (Bug 1)

**Root cause (verified):** `GeneratingStep.tsx` line 158 — `finalContent` object has no `onboardingData`. Variables exist (productName, oneLiner, understanding, landingGoal, offer, audience at lines 82-87) but never packaged.

**Save side — GeneratingStep.tsx (~line 158):**
Add to finalContent:
```typescript
onboardingData: {
  oneLiner: oneLiner || '',
  validatedFields: {
    productName: productName || '',
    landingGoal: landingGoal || '',
    offer: offer || '',
    audience: audience || '',
  },
  featuresFromAI: understanding?.features || [],
  hiddenInferredFields: {
    categories: understanding?.categories?.join(', ') || '',
    whatItDoes: understanding?.whatItDoes || '',
  },
  understanding: understanding || {},
},
```

**Load side — persistenceActions.ts (~line 220):**
Add fallback to read from contentToLoad:
```typescript
const onboardingFromContent = contentToLoad?.onboardingData;
state.onboardingData = {
  oneLiner: apiResponse.inputText || onboardingFromContent?.oneLiner || '',
  validatedFields: apiResponse.validatedFields || onboardingFromContent?.validatedFields || {},
  featuresFromAI: apiResponse.featuresFromAI || onboardingFromContent?.featuresFromAI || [],
  hiddenInferredFields: apiResponse.hiddenInferredFields || onboardingFromContent?.hiddenInferredFields || {},
  understanding: onboardingFromContent?.understanding || {},
};
```

Both sides required. Save without load = data saved but never restored. Load without save = nothing to restore.

**Verify:** Generate → left panel shows all inputs (including understanding fields) → refresh → still there.

---

### X2: ElementToggle all ON + toggle off broken (Bugs 2, 3)

**Root cause (verified):** `GeneratingStep.tsx` line 153 hardcodes `excludedElements: []`. AI decides which elements to generate, but the exclusion list is never populated. Every element shows as ON.

**Fix — dual approach (both needed):**

`isElementOn` — check element PRESENCE for initial state:
```typescript
const isElementOn = useCallback(
  (elementName: string): boolean => {
    const elements = sectionData?.elements || {};
    const meta = sectionData?.aiMetadata;
    const excluded = Array.isArray(meta?.excludedElements) ? meta.excludedElements : [];
    // Element is ON if it exists in elements AND is not excluded
    return (elementName in elements) && !excluded.includes(elementName);
  },
  [sectionData]
);
```

Why both checks: element presence catches AI's initial decision (AI only generates elements it decides to include). excludedElements catches user's manual toggle-off (user excluded it via the modal).

Toggle OFF — add to excludedElements (makes extractLayoutContent skip it):
```typescript
if (!checked) {
  const meta = sectionData?.aiMetadata || {};
  const currentExcluded = Array.isArray(meta.excludedElements) ? meta.excludedElements : [];
  if (!currentExcluded.includes(elementName)) {
    setSection(sectionId, {
      aiMetadata: { excludedElements: [...currentExcluded, elementName] },
    });
  }
}
```

Toggle ON — remove from excludedElements:
```typescript
if (checked) {
  const meta = sectionData?.aiMetadata || {};
  const currentExcluded = Array.isArray(meta.excludedElements) ? meta.excludedElements : [];
  setSection(sectionId, {
    aiMetadata: { excludedElements: currentExcluded.filter((e: string) => e !== elementName) },
  });
}
```

Note: setSection deep-merge for aiMetadata (Fix 1 from Round 1) must be in place. Verify it was shipped.

**Verify:** Generate → open ElementToggleModal → elements AI didn't generate show OFF → toggle off a present element → it disappears → toggle back on → it reappears → close/reopen modal → states persist.

---

### X3: Regen 429 rate limit (Bug 7 partial)

**Verified:** `generationActions.ts` line 531 IS sequential (for...of with await). But user reports regen still fails.

**Fix:** Add delay between requests:
```typescript
for (const sectionId of sections) {
  await state.regenerateSection(sectionId);
  completed++;
  set((draft: EditStore) => {
    draft.aiGeneration.progress = Math.round((completed / sections.length) * 100);
  });
  // Rate limit buffer — avoid 429 from API
  if (completed < sections.length) {
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}
```

Test first without delay. If still 429, add it.

**Verify:** Regen Copy → all sections regenerate without 429 errors → completes successfully.

---

## Dev Y Fixes

### Y1: Custom hex section background not rendering (Bug 5)

**Root cause (verified):** `useLayoutComponent.ts` line 123 returns `bg-[${solidColor}]` — a Tailwind arbitrary value class. Dynamic arbitrary values are NOT compiled by Tailwind JIT (it scans source at build time, not runtime). Class never exists in CSS output.

**CRITICAL RULE: No dynamic Tailwind arbitrary values. Use inline styles.**

**Fix — useLayoutComponent.ts lines 123, 130, 132, 180, 186, 188:**
Return raw CSS value, not Tailwind class:
```typescript
// Line 123: Was bg-[${solidColor}]
customCSS = solidColor;  // raw "#FF5733"

// Lines 130, 132: gradients
customCSS = `linear-gradient(${angle}deg, ${gradientStops})`;
customCSS = `radial-gradient(circle, ${gradientStops})`;

// Same for lines 180, 186, 188 (preview path)
```

**Fix — consumer side (REQUIRED):**
Find where `customCSS` return value is applied. It's currently used as `className`. Change to inline style:
```typescript
// Was: className={customCSS}
// Now: style={{ background: customCSS }}
```

Identify the exact render location in the layout component that consumes useLayoutComponent's return. Both the edit and preview/published renderers need this change.

**Verify:** Apply custom hex → section renders with correct color → works without page refresh.

---

### Y2: Custom accent hex not applying to CTAs (Bug 6 partial)

**Root cause (verified):** `colorTokens.ts` line 133 — `safeCTABg = smartAccentCSS`. For custom hex, smartAccentCSS is a raw `#FF5733` string. CTA button puts this into `className` — not a valid CSS class.

**SAME RULE: No dynamic Tailwind arbitrary values.**

Round 2 plan proposes `bg-[${hex}]` — this WILL FAIL for the same Tailwind JIT reason as Y1.

**Fix — colorTokens.ts:**
When accent is custom hex, flag it for inline style treatment:
```typescript
let safeCTABg = smartAccentCSS;
let ctaBgIsInline = false;

if (safeCTABg?.startsWith('#')) {
  ctaBgIsInline = true;
  // Keep raw hex, don't wrap in bg-[]
}
```

Return `ctaBgIsInline` flag (or a naming convention like `inline::#FF5733`) in the color tokens.

**Fix — CTA button component:**
Detect hex/inline flag. Apply as `style={{ backgroundColor: hex }}` instead of className.

Also fix hover state — hex doesn't support Tailwind's `-500`→`-600` replacement:
```typescript
const smartAccentHover = accentCSS?.startsWith('#')
  ? undefined  // hover handled via opacity in inline style
  : accentCSS?.replace('-500', '-600') || `bg-${accentColor}-600`;
```

For inline hover, use CSS `filter: brightness(0.9)` on hover or an `onMouseEnter`/`onMouseLeave` approach.

**Verify:** Set custom accent hex → all CTA buttons show correct color → hover state works.

---

### Y3: imageValue.startsWith crash (Bug 7 partial)

**Root cause (verified):** `CenterStacked.tsx` line 624 — `blockContent.center_hero_image` can be an object after regen. `|| ''` fallback only triggers for falsy values, not truthy objects. `.startsWith()` crashes on object.

**Fix — 8 files, same pattern:**
```typescript
const rawImage = blockContent.center_hero_image || '';
const imageValue = typeof rawImage === 'string' ? rawImage : (rawImage as any)?.content || (rawImage as any)?.url || '';
```

Apply to:
- `CenterStacked.tsx` + `.published.tsx`
- `SplitScreen.tsx` + `.published.tsx`
- `ImageFirst.tsx` + `.published.tsx`
- `LeftCopyRightImage.tsx` + `.published.tsx`

Search for `.startsWith(` in all UIBlock files to catch any others.

**Verify:** Regen Copy → no crash → images render correctly.

---

### Y4: Regen feedback too subtle (Bug 7a)

**File:** `EditHeaderRightPanel.tsx`

PO decision: minimal. Spinner on button + disable + toast when done.

**Fix:**
```typescript
// Button: show spinner + disable during regen
<button disabled={isGenerating} ...>
  {isGenerating ? <Spinner /> : <SparkleIcon />}
  {isGenerating ? 'Regenerating...' : 'Regenerate Copy'}
</button>

// Toast on completion — add useEffect:
useEffect(() => {
  if (prevIsGenerating && !isGenerating) {
    // Show success toast
    toast('Copy regenerated successfully');
  }
}, [isGenerating]);
```

No fixed-position pulsing div needed. Keep it simple.

**Verify:** Click Regen Copy → button shows spinner + disabled → completion toast appears.

---

## Execution Order

```
Dev X (parallel):          Dev Y (parallel):
X1 (onboardingData)        Y1 (custom hex bg)
X2 (element toggle)        Y2 (accent hex CTA)
X3 (regen rate limit)      Y3 (imageValue crash)
                           Y4 (regen feedback)

After both done:
npm run build
Full integration test (all 7 verifications)
```

## Critical Rules for Both Devs
1. **No dynamic Tailwind arbitrary values** — `bg-[${variable}]` won't compile. Use inline styles.
2. **setSection deep-merges aiMetadata** — verify Round 1 Fix 1 is in place before X2.
3. **Test after each fix** — don't batch. Each fix should be independently verifiable.

=============

X1 — validatedFields is empty, fields in wrong location.                                                                                                                      
  
  Plan saves:                                                                                                                                                                     onboardingData: {                                                                                                                                                             
    productName: productName || '',     // top-level
    landingGoal: landingGoal || '',     // top-level
    offer: offer || '',                 // top-level
    validatedFields: {},                // EMPTY
    hiddenInferredFields: {},           // EMPTY
  }

  SecondOpinion.md specifies:
  onboardingData: {
    oneLiner: oneLiner || '',
    validatedFields: {
      productName: productName || '',   // INSIDE validatedFields
      landingGoal: landingGoal || '',
      offer: offer || '',
      audience: audience || '',
    },
    hiddenInferredFields: {
      categories: understanding?.categories?.join(', ') || '',
      whatItDoes: understanding?.whatItDoes || '',
    },
    featuresFromAI: understanding?.features || [],
  }

  LeftPanel reads onboardingData.validatedFields and onboardingData.hiddenInferredFields to display inputs. If both are {}, the panel shows nothing — Bug 1 persists.

  Also: load-side references onboardingFromContent but never declares it. Need:
  const onboardingFromContent = contentToLoad?.onboardingData;

  X2 — Approved. Dual check matches SecondOpinion.md exactly.

  X3 — Approved. Note: regen "doesn't complete" may also be caused by Dev Y's imageValue crash (Y3). If sections crash mid-regen at .startsWith(), the loop breaks. X3 + Y3     
  together should resolve it.

  ===============


  Y1 — Approved. Key insight: LayoutSection.tsx:67 already uses style={{ background: ... }}, not className. So removing the bg-[...] wrapper is the complete fix — raw CSS      
  hex/gradient values work directly as inline styles. No consumer changes needed. Clean 6-line fix.
                                                                                                                                                                                  Y2 — Approved, 1 minor concern. Root cause correct. applyColorToken utility is the right pattern. All consumers identified (CTA, FormRenderer, InlineFormInput, NumberBadge,  
  FeatureIcon, ProgressBar). Hover skip is pragmatic.

  Minor concern: applyColorToken placed in ComponentRegistry.tsx but also needed in FormRenderer.tsx and InlineFormInput.tsx. Either:
  - Move to a shared util (e.g., src/utils/colorUtils.ts)
  - Or export from ComponentRegistry and import in the others

  Don't duplicate the function in 3 files.

  Y3 — Approved. All 8 files identified with exact lines and field names. Defensive extraction pattern is correct. Confirmed no other UIBlock files have the issue.

  Y4 — Approved. Already implemented per PO's minimal spec. Pulse animation is a proportionate enhancement for "easy to miss visually."

  Decisions section is solid — grep all ctaBg consumers, skip hex hover darken. Good judgment calls.

  ==============
PO response
  Good questions from the dev. Answers:                                                                                                                                                                                                                                                                                                                         
  1. Y1 fallbacks (Tailwind classes as inline style): Fix them. Same bug, and they'll surface the moment a palette fails to load or during edge cases. While you're in those    
  lines anyway, swap to raw CSS fallbacks: 'bg-gray-50' → '#f9fafb', 'bg-white' → '#ffffff', 'bg-gradient-to-br from-blue-500 to-blue-600' → 'linear-gradient(to bottom right, 
  #3b82f6, #2563eb)'. 4 extra lines, eliminates the class.                                                                                                                                                                                                                                                                                                      
  2. Y2 blast radius (46 files): Out of scope. That's a pre-existing bug with the standard accent path mixing Tailwind classes and raw CSS in template strings. Don't touch it
  this round. Note it for a follow-up ticket.

  3. Y2 accentBorder: Yes, fix in same pass. Same root cause, same file. When accentCSS starts with #, set accentBorder to raw CSS too:
  const accentBorder = accentCSS?.startsWith('#')
    ? `border-[${accentCSS}]`  // or inline style
    : accentCSS?.replace('bg-', 'border-') || 'border-blue-500';
  Wait — border-[#hex] has the same Tailwind JIT problem. Use inline style for border too. Return a flag/raw value so consumers apply style={{ borderColor: hex }}.

  4. Y3 root fix in getStringContent: Better fix, but yes it's Dev X's file. Coordinate — if Dev X agrees and it's a 1-line change, do it there and skip the 8 UIBlock patches. 
  If Dev X is already done or can't take it, do the 8-file defensive fix. Don't block on coordination — if you can't get agreement in 10 minutes, do the 8 files.

  5. Y4: Pulse animation is enough. PO said minimal, user said "easy to miss." Pulse is the right middle ground. Ship it.