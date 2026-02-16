# Typography Modal Redesign — Product Decision Doc

## Current State (Broken)

Typography modal groups fonts by **tone** (`minimal-technical`, `bold-persuasive`, etc.) read from `hiddenInferredFields.toneProfile`. New onboarding never sets this field — it uses **vibe** instead. Result: modal always falls back to `minimal-technical`, showing wrong grouping for every user.

**Old flow (dead):** `toneProfile` → `fontThemesByTone` → random pick from 3 options per tone
**New flow (active):** `strategy.vibe` → `getDesignTokensForVibe()` → deterministic font pair

## Pre-Downloaded Fonts (in `/public/fonts/`)

| Font | Weights | File Size | Used By Vibes |
|------|---------|-----------|---------------|
| Inter | 400, 500, 600, 700 | ~100KB | All (as body), Light Trust (heading) |
| Sora | 400, 500, 600, 700 | ~80KB | Dark Tech (heading), Bold Energy (heading) |
| DM Sans | 400, 500, 600, 700 | ~80KB | Warm Friendly (both), Bold Energy (body) |
| Playfair Display | 500, 600, 700 | ~70KB | Calm Minimal (heading) |

These load instantly from `/public/fonts/` via `fonts-self-hosted.css`. All other fonts (Poppins, Rubik, Manrope, Space Grotesk, Plus Jakarta Sans, Outfit, Open Sans, Nunito, DM Serif Display, Raleway, Bricolage Grotesque) load from Google Fonts API — adds ~200-400ms on mobile.

## Proposed: Pre-Downloaded Font Combos (Section 1 — "Fast")

These combos use only the 4 self-hosted fonts. Zero external requests = fastest LCP.

| # | Heading | Body | Origin (Vibe Default) |
|---|---------|------|-----------------------|
| 1 | Sora | Inter | Dark Tech |
| 2 | Inter | Inter | Light Trust |
| 3 | DM Sans | DM Sans | Warm Friendly |
| 4 | Sora | DM Sans | Bold Energy |
| 5 | Playfair Display | Inter | Calm Minimal |
| 6 | DM Sans | Inter | — |
| 7 | Playfair Display | DM Sans | — |

### Questions for PO:

1. **Combo 7 (Playfair + DM Sans)** — serif heading + rounded body. Unusual pairing. Include or drop?
2. **Sora + Sora** — same font heading+body. Include as option #8 or too similar to Sora+Inter?
3. **Inter + DM Sans** (Inter heading, DM Sans body) — reversed from #6. Worth including?

## Proposed: Google Font Combos (Section 2 — "More Fonts")

These require Google Fonts load. Grouped flat (no tone labels). Current `fontThemes.ts` has 15 total across 5 tones — after removing the 5 that overlap with pre-downloaded combos, ~10 remain:

| Heading | Body | Old Tone |
|---------|------|----------|
| Bricolage Grotesque | Inter | confident-playful |
| Poppins | Open Sans | confident-playful / friendly-helpful |
| Rubik | Inter | confident-playful / friendly-helpful |
| Manrope | Inter | minimal-technical |
| Space Grotesk | DM Sans | bold-persuasive |
| Plus Jakarta Sans | DM Sans | bold-persuasive |
| Outfit | Inter | bold-persuasive |
| Nunito | Inter | friendly-helpful |
| DM Serif Display | Inter | luxury-expert |
| Raleway | Open Sans | luxury-expert |

### Questions for PO:

4. **Keep all 10?** Or trim to top 5-6 to reduce choice overload?
5. **Any fonts to add?** (e.g., Montserrat, Lato, Work Sans are popular but not currently in the system)
6. **Show speed warning?** e.g., small "Loads from Google" tag vs just visual separation?

## UI Changes Summary

### Before
```
[ Typography ▾ ]
┌──────────────────────────┐
│ minimal technical Options │  ← wrong tone, always fallback
│  ● Inter + Inter          │
│  ○ Manrope + Inter        │
│  ○ Sora + Inter           │
│                           │
│ Compatible Options        │
│  ○ Space Grotesk + DM Sans│
│  ○ Playfair Display + Inter│
└──────────────────────────┘
```

### After
```
[ Typography ▾ ]
┌──────────────────────────────┐
│ ⚡ Optimized for Speed       │
│  ● Sora + Inter              │
│  ○ Inter + Inter             │
│  ○ DM Sans + DM Sans        │
│  ○ Sora + DM Sans           │
│  ○ Playfair Display + Inter  │
│  ○ DM Sans + Inter           │
│  ○ Playfair Display + DM Sans│
│                              │
│ More Fonts                   │
│  ○ Bricolage Grotesque + Inter│
│  ○ Poppins + Open Sans       │
│  ○ Space Grotesk + DM Sans   │
│  ○ ...                       │
└──────────────────────────────┘
```

## Technical Changes Required

| File | Change |
|------|--------|
| `typographyCompatibility.ts` | Replace tone-based grouping with pre-downloaded vs Google split |
| `useTypographySelector.ts` | Remove `toneProfile` dependency, simplify to flat list |
| `TypographyDropdown.tsx` | Two sections: "Optimized" + "More Fonts" instead of tone groups |
| `FontThemeOption.tsx` | Add optional speed badge |
| `FontPreviewText.tsx` | Generic preview text (drop tone-specific copy) |
| `fontThemes.ts` | Add pre-downloaded combos list, keep Google combos separate |

**No changes needed:** `typographyApplication.ts`, `useTypography.ts`, `layoutActions.ts` (store/application layer works fine)

## Dead Code to Remove

- `pickFont.ts` — `pickFontFromOnboarding()` never called in new flow
- `compatibleTones` map in `typographyCompatibility.ts`
- `toneProfile` read in `useTypographySelector.ts` line 29
- `typographyPreviews.ts` tone-specific preview texts (replace with single generic)

## Unresolved Questions

1. Combos 7-8 — include unusual pairings?
2. Trim Google section to 5-6 or keep all 10?
3. Add any new Google fonts not currently in system?
4. Speed badge: icon-only or text label?
5. Should selecting a Google font trigger a "slower page speed" tooltip/warning?
6. Preview text — single generic or keep varied per combo?
