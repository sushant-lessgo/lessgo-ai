# Browse All Styles — Dev Spec

## What
Enable the "Browse all styles" button in ThemePopover. Opens a modal showing all 30 palettes in a flat grid. Click = instant apply. Modal stays open.

## UX

### Trigger
- `ThemePopover.tsx:364` — change disabled button to open modal
- Clicking closes popover, opens modal

### Modal Layout
```
┌─────────────────────────────────────────────────────┐
│ Browse styles                                   ✕   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [All] [Light] [Dark]          ← pill toggle tabs    │
│                                                     │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │ ██████ │ │ ██████ │ │ ██████ │ │ ██████ │       │
│ │ ▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓ │       │
│ │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │       │
│ │Ice Blue✓│ │Trust Bl│ │Soft Lav│ │Sky Brt │       │
│ └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                     │
│ (4-col grid, scrollable, flat — no sub-groups)      │
└─────────────────────────────────────────────────────┘
```

### Palette Card
- 3 horizontal bands: `palette.primary` (top) → `palette.secondary` (mid) → `palette.neutral` (bottom)
- Render bands as divs with `style={{ background: palette.primary }}` etc.
- `palette.label` below the bands
- Active palette: checkmark overlay + blue ring (same style as current palette swatches)
- Hover: subtle scale (`hover:scale-105`) + shadow

### Interactions
- **Mode tabs**: `All` (default) | `Light` | `Dark` — filters `palettes` array by `palette.mode`
- **Click card**: apply palette instantly (same logic as `handlePaletteSwap` in ThemePopover)
- **Modal stays open** after click — user can keep exploring
- **Close**: X button / ESC / backdrop click
- **Undo**: existing Ctrl+Z works (store history already tracks palette changes)

## Files

### Create
`src/app/edit/[token]/components/ui/StyleBrowserModal.tsx`

### Modify
`src/app/edit/[token]/components/ui/ThemePopover.tsx`
- Add `useState` for modal open/close
- Enable the button (remove `disabled`, add `onClick`)
- Render `<StyleBrowserModal>`

## Key Code to Reuse

### Dialog (existing Radix component)
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

### Palette data + helpers
```tsx
import { palettes, getPalettesByMode, getPaletteById, type Palette } from '@/modules/Design/background/palettes';
```
- `palettes` — full array of 30
- `getPalettesByMode('light')` — returns 19 light, `('dark')` returns 11

### Palette swap logic (from ThemePopover lines 114-147)
```tsx
// Reuse this exact logic — either extract to a shared hook or duplicate (it's small)
const handlePaletteSwap = (newPalette: Palette) => {
  const newCompatible = getCompatibleTextures(newPalette);
  const textureStillValid = newCompatible.some(t => t.id === textureId);
  const finalTextureId = textureStillValid ? textureId : 'none';

  const bgSystem = generateBackgroundSystemFromPalette(newPalette);
  const compiledPrimary = compileBackground(newPalette, finalTextureId, 'primary');
  const compiledSecondary = compileBackground(newPalette, finalTextureId, 'secondary');

  updateFromBackgroundSystem({ ...bgSystem, primary: compiledPrimary, secondary: compiledSecondary });
  updateTheme({ colors: { paletteId: newPalette.id, textureId: finalTextureId } as any });
  recalculateTextColors();
};
```
Imports needed:
- `getCompatibleTextures`, `compileBackground` from `@/modules/Design/background/textures`
- `generateBackgroundSystemFromPalette` from `@/modules/Design/background/backgroundIntegration`
- `updateFromBackgroundSystem`, `updateTheme`, `recalculateTextColors` from `useEditStoreLegacy`

### Store reads
```tsx
const theme = useEditStore(s => s.theme);
const paletteId = theme?.colors?.paletteId;
const textureId = theme?.colors?.textureId || 'none';
```

## Sizing
- Modal: `max-w-2xl` (672px) — fits 4 cards per row comfortably
- Card: ~140px wide, ~120px tall (3 bands ~24px each + label)
- Max height: `max-h-[80vh]` with `overflow-y-auto` on content area

## Verification
1. "Browse all styles" button in ThemePopover is clickable (no "Soon" badge)
2. Modal opens, popover closes
3. All 30 palettes render in a 4-col grid
4. Mode tabs filter correctly (All=30, Light=19, Dark=11)
5. Current palette shows checkmark
6. Click palette → page colors change immediately, checkmark moves
7. Modal stays open after selection
8. Close modal → changes persist
9. Ctrl+Z undoes palette change
10. `npm run build` passes

PO view: extract handlePaletteSwap into a shared hook instead of duplicating. Everything else is clean enough for v1. Ship it, iterate   on texture/accent previews later if users ask.