
# Phase 2 UX Refinement — Design Questions Flow

## Problem

User tested the Q1-Q4 design questions flow. Four UX issues:

1. **Bottom progress strip not visual enough** — tiny `Loader2` icon + "Creating your landing page..." doesn't communicate AI is actively working
2. **"Your page is ready!" text color** — uses `text-green-600` / `bg-green-100`, not brand-compatible (`brand-accentPrimary` = `#FF814A`)
3. **Q1 Dark/Light choice not clear** — user doesn't realize more options follow; thinks they're picking the final look
4. **No context about WHY** — user lands on design questions cold, doesn't understand purpose

### Bonus opportunity

5. **StrategyStep "Continuing..." is wasted** — strategy API takes ~3s, currently shows generic messages then flashes "Continuing..." before advancing. Should prime the user for design questions.

---

## Changes (4 files)

### 1. StrategyStep.tsx (lines 8-13, 163)

**Messages during API call** — Replace generic messages with audience-aware ones:

```ts
const strategyMessages = [
  'Analyzing your market position...',
  'Identifying what converts your audience...',
  'Designing the perfect page flow...',
  'Selecting high-converting sections...',
];
```

**Transition message** — Replace "Continuing..." (line 163) with a bridge that primes user for design questions:

```ts
// line 163: replace
return <LoadingOverlay messages={['Continuing...']} />;
// with
return <LoadingOverlay messages={['Now let\u2019s design your page...']} skeletonCount={0} />;
```

`skeletonCount={0}` — no skeleton cards for a brief transition moment.

---

### 2. DesignQuestionsFlow.tsx — 4 changes

#### 2a. Add intro context block (before Q1 cards, after step header)

Insert between the step header `<div>` (line 213-236) and the Q1 cards render (line 239):

```tsx
{/* Intro context — only on step 1 */}
{step === 1 && (
  <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
    While AI writes your copy, pick the look and feel for your page.
    You'll choose colors and textures in the next few steps.
  </p>
)}
```

This answers "WHY am I doing this?" and "what comes next?" in one shot.

#### 2b. Q1 step header — add subtitle

Currently Q1 shows just "Choose your style" (line 92). Add a subtitle below the main header block (after line 236) that only shows for step 1:

Actually — simpler: just update STEP_HEADERS to include the context OR add a `STEP_SUBTITLES` map:

```ts
const STEP_SUBTITLES: Record<number, string> = {
  1: 'This is just the starting point — you\'ll refine next',
  2: 'Each family has palette variations you can explore',
  3: 'Pick the exact shade for your page',
  4: 'Optional — adds subtle depth to backgrounds',
};
```

Render below step header (after line 225):
```tsx
{STEP_SUBTITLES[step] && (
  <p className="text-xs text-gray-400 mt-0.5">{STEP_SUBTITLES[step]}</p>
)}
```

#### 2c. Bottom progress strip — more visual

Current (lines 358-380): tiny `Loader2` + text on left, skip link on right.

Replace with a more communicative strip:

```tsx
{/* Bottom bar: progress + skip */}
<div className="mt-8 w-full">
  {/* Progress indicator */}
  <div className="flex items-center gap-3 mb-3">
    {apiComplete ? (
      <>
        <div className="w-5 h-5 rounded-full bg-brand-accentPrimary/10 flex items-center justify-center">
          <Check className="w-3 h-3 text-brand-accentPrimary" />
        </div>
        <span className="text-sm text-brand-accentPrimary font-medium">
          Your copy is ready — finish picking to see your page
        </span>
      </>
    ) : (
      <>
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 border-t-brand-accentPrimary animate-spin" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">AI is writing your copy...</p>
          <div className="mt-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accentPrimary/40 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </>
    )}
  </div>

  {/* Skip link */}
  <div className="flex justify-end">
    <button
      type="button"
      onClick={onSkip}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      Skip, use defaults &rarr;
    </button>
  </div>
</div>
```

Key differences from current:
- Spinner matches brand color (`border-t-brand-accentPrimary`)
- Thin progress bar below "AI is writing your copy..." adds visual weight
- Check icon uses brand orange instead of generic green
- "Your copy is ready" not "Your page is ready" — more accurate (design isn't done yet)

#### 2d. Step dots — use brand color for active

Current (lines 226-235): active dots are `bg-gray-800`. Change to brand:

```tsx
className={`w-1.5 h-1.5 rounded-full transition-colors ${
  s <= step ? 'bg-brand-accentPrimary' : 'bg-gray-200'
}`}
```

---

### 3. GeneratingStep.tsx — brand colors (lines 346-363)

#### 3a. "Almost ready..." state (lines 346-353)

Replace `text-gray-400` spinner with brand spinner:

```tsx
if (userDone && !apiComplete) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-brand-accentPrimary animate-spin" />
      <p className="text-sm text-gray-600">Almost ready...</p>
    </div>
  );
}
```

Replace `Loader2` with CSS spinner matching brand color.

#### 3b. "Your page is ready!" state (lines 356-363)

Replace green with brand accent:

```tsx
return (
  <div className="flex flex-col items-center justify-center py-16 space-y-4">
    <div className="w-12 h-12 rounded-full bg-brand-accentPrimary/10 flex items-center justify-center">
      <Check className="w-6 h-6 text-brand-accentPrimary" />
    </div>
    <p className="text-sm text-gray-700 font-medium">Your page is ready!</p>
  </div>
);
```

Changes: `bg-green-100` → `bg-brand-accentPrimary/10`, `text-green-600` → `text-brand-accentPrimary`, `text-gray-600` → `text-gray-700 font-medium`.

---

## Summary of all changes

| File | What | Lines |
|------|------|-------|
| StrategyStep.tsx | Better API messages | 8-13 |
| StrategyStep.tsx | Transition text | 163 |
| DesignQuestionsFlow.tsx | Intro context paragraph | Insert after 236, before 239 |
| DesignQuestionsFlow.tsx | Step subtitles | Add constant + render after 225 |
| DesignQuestionsFlow.tsx | Bottom progress strip | 358-380 (full replace) |
| DesignQuestionsFlow.tsx | Step dots brand color | 230 |
| GeneratingStep.tsx | "Almost ready" brand spinner | 346-353 |
| GeneratingStep.tsx | "Your page is ready" brand colors | 356-363 |

## Don't touch

- PalettePreviewCard.tsx — working correctly
- LoadingOverlay.tsx — component is fine, just receives better messages
- Q2/Q3/Q4 render logic — working correctly
- Back navigation — working correctly
- Dual-ready effect, inactivity timer, save logic — all correct

## Verify after

1. Strategy step shows "Analyzing your market position..." then transitions with "Now let's design your page..."
2. Q1 shows intro context + subtitle clarifying more options follow
3. Bottom bar shows brand-colored spinner + progress bar during generation
4. Bottom bar shows brand-colored check + "Your copy is ready" when API done
5. "Almost ready..." and "Your page is ready!" states use brand accent (#FF814A)
6. Step dots use brand orange for active steps
7. Full flow feels like one continuous experience, not disjointed steps
