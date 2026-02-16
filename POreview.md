# PO Review — Text Color Bug on Dark Primary Backgrounds

## Reject: curious-zooming-turtle.md

Plan patches the symptom, doesn't fix the root cause. The real bug is in luminance calculation, not in which component reads what.

---

## The Actual Bug

`parseColor()` in `colorUtils.ts:71` strips alpha from rgba colors:

```ts
// rgba(0,0,0,0.06) → { r:0, g:0, b:0 }  ← pure black, alpha ignored
const rgbMatch = cleanColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
```

When textures are compiled into backgrounds, the stored CSS looks like:

```
"radial-gradient(...rgba(0,0,0,0.06)..., transparent...),
 radial-gradient(...rgba(0,0,0,0.04)..., transparent...),
 ...3 more texture overlays...,
 linear-gradient(to top right, #34d399, #6ee7b7, #a7f3d0)"
```

`analyzeBackground()` extracts ALL colors from combined string → 5 texture `rgba(0,0,0,0.0x)` parsed as **solid black** + 3 mint greens → average luminance drops below 0.5 → `isDark: true` → white text on light mint background.

**This is why it only breaks with textures active.** Raw palette backgrounds analyze correctly.

## The Fix

Two options, pick ONE:

### Option A: Don't analyze compiled CSS (recommended)

`recalculateTextColors()` in `layoutActions.ts:785` reads `theme.colors.sectionBackgrounds.primary` which is the compiled (texture + palette) CSS. Instead, resolve the raw palette background for luminance analysis:

```ts
recalculateTextColors: () => {
  const { theme } = get();
  const palette = getPaletteById(theme.colors.paletteId);

  const calculateForBackground = (bg: string) => ({
    heading: getSmartTextColor(bg, 'heading'),
    body: getSmartTextColor(bg, 'body'),
    muted: getSmartTextColor(bg, 'muted')
  });

  const newTextColors = {
    primary: calculateForBackground(palette?.primary || theme.colors.sectionBackgrounds.primary),
    secondary: calculateForBackground(palette?.secondary || theme.colors.sectionBackgrounds.secondary),
    neutral: calculateForBackground(palette?.neutral || theme.colors.sectionBackgrounds.neutral || '#ffffff'),
  };

  set((state) => {
    state.theme.colors.textColors = newTextColors;
    state.persistence.isDirty = true;
    state.lastUpdated = Date.now();
  });
},
```

Same fix in `useLayoutComponent.ts` — `getEffectiveTextColor`'s last-resort `getSmartTextColor(sectionBackground, type)` call also receives compiled CSS. Pass raw palette background instead.

### Option B: Make parseColor alpha-aware

In `colorUtils.ts`, premultiply against white for light-mode, black for dark-mode:

```ts
const rgbMatch = cleanColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
if (rgbMatch) {
  const alpha = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
  // Premultiply against white (assumes light composite surface)
  return {
    r: Math.round(parseInt(rgbMatch[1]) * alpha + 255 * (1 - alpha)),
    g: Math.round(parseInt(rgbMatch[2]) * alpha + 255 * (1 - alpha)),
    b: Math.round(parseInt(rgbMatch[3]) * alpha + 255 * (1 - alpha)),
  };
}
```

This makes `rgba(0,0,0,0.06)` → `{r:240, g:240, b:240}` (near-white) instead of `{r:0, g:0, b:0}` (black). Correct, but assumes white composite surface — wrong for dark palettes.

**Option A is cleaner** — text color decisions should be based on the palette, not the composited visual.

---

## Separately: Eliminate the Re-derivation Chain

After the luminance bug is fixed, simplify the consumer side. Currently:

```
useLayoutComponent computes hex → converts to Tailwind class → puts on colorTokens
EditableAdaptiveHeadline receives colorTokens → re-derives from backgroundType → gets wrong answer
Plan says: use colorTokens.dynamicHeading instead → adds tailwindClassToHex to convert BACK to hex
```

hex → class → hex is a circle. Clean path:

1. `useLayoutComponent` returns text colors as **hex** (it already computes hex in `smartTextColors`, just stops converting to Tailwind classes)
2. `EditableAdaptiveHeadline/Text` apply hex via `style={{ color }}` — no `getAdaptiveTextColor()`, no `backgroundType` lookup, no conversion
3. Delete `getAdaptiveTextColor()` from both components entirely

This is a separate change from the luminance fix. Do the luminance fix first.

---

## Files to Change

| File | What |
|------|------|
| `layoutActions.ts:785` | `recalculateTextColors` — use raw palette, not compiled CSS |
| `useLayoutComponent.ts:306` | `getSmartTextColor` fallback — same: use raw palette |
| `palettes.ts` | Import `getPaletteById` where needed |

## Verification

1. Apply dot-grid texture + mint-warm palette → hero text should be dark
2. Apply paper texture + rose-soft palette → hero text should be dark
3. No texture + any dark palette → hero text should be white/light
4. Switch textures on/off → text color stays correct
5. `npm run build` passes
