# Background System v3 — Palette-First Architecture

## What Changed From v2

| Aspect | v2 (Current) | v3 (New) |
|--------|-------------|----------|
| Core unit | 1 primary bg + derived secondary/neutral/divider | Complete 3-value palette |
| Dark pages | Dark hero → white sections (broken) | Dark throughout (cohesive) |
| Accent | 1 random accent per background | Separate axis, 1 accent per theme (shades for variants) |
| Divider | 4th background value | Removed — alternation solves this |
| Section mapping | Per-section identity-based | Position-based alternation |
| Cards | — | Dynamic (existing cardStyles.ts) |
| Text color | — | Dynamic (existing getSmartTextColor) |
| Count | 65 primaries | ~30 palettes × ~4 accents = ~120 themes |

---

## Data Model

```typescript
interface Palette {
  id: string;
  label: string;
  mode: 'dark' | 'light';           // Structural tag (affects text/cards/icons)
  temperature: 'cool' | 'neutral' | 'warm';
  energy: 'calm' | 'bold';

  // The 3 backgrounds (all CSS values)
  primary: string;                   // Hero + CTA (bold statement)
  secondary: string;                 // Content sections (subtle)
  neutral: string;                   // Breathing room (cleanest)

  // Compatible accent families (separate axis)
  compatibleAccents: string[];       // e.g. ['cyan', 'emerald', 'purple', 'amber']
}

// Single accent color — shade variants handle different roles
// Icons are theme-driven (cardStyles.ts), not accent-driven
```

**Cards + text = dynamic (no change).** `cardStyles.ts` reads section luminance. `getSmartTextColor` reads background. These stay as-is.

---

## Section Mapping (simplified)

Position-based, not identity-based. Sections no longer need a `background` field.

```
Header        → neutral  (always)
Hero          → primary
Section[0]    → secondary
Section[1]    → neutral
Section[2]    → secondary
Section[3]    → neutral
...           → alternating secondary ↔ neutral
CTA           → primary
Footer        → neutral  (always)
```

**Rules:**
- Header/Footer = always neutral (chrome, not content)
- Hero/CTA = always primary (page bookends)
- Everything between = alternates secondary ↔ neutral by position
- No per-section background config needed — position determines background
- Reordering sections automatically maintains rhythm (no broken sequences)

**Removes from codebase:**
- `background` field from `SectionMeta` in `sectionList.ts`
- `BACKGROUND_MAP` lookup in `backgroundIntegration.ts`
- Rhythm enforcement logic (max 2 consecutive highlights)
- `divider` from `BackgroundSystem` interface

---

## Palettes (~30)

### DARK MODE — Cool (~5)

#### 1. Midnight Slate
```
primary:   linear-gradient(135deg, #0f172a, #1e3a5f)
secondary: #1a2332
neutral:   #0f172a
accents:   [cyan, sky, emerald, purple]
```
Classic dark tech. Deep navy family. Clean, serious.

#### 2. Deep Indigo
```
primary:   linear-gradient(135deg, #1e1b4b, #312e81)
secondary: #1e1b4b
neutral:   #0f0d2e
accents:   [cyan, emerald, amber, sky]
```
Rich purple-blue. AI/ML products, creative dev tools.

#### 3. Ocean Abyss
```
primary:   linear-gradient(135deg, #0c4a6e, #164e63)
secondary: #0e3a52
neutral:   #0a2540
accents:   [amber, emerald, orange]        # removed cyan, teal (same family as primary)
```
Deep ocean blue-teal. Data platforms, analytics.

#### 4. Arctic Night
```
primary:   linear-gradient(to bottom right, #111827, #1f2937, #111827)
secondary: #1a1f2e
neutral:   #111827
accents:   [sky, blue, emerald, orange]
```
Cool gray-dark. Infrastructure, DevOps, CLI tools.

#### 5. Steel Midnight
```
primary:   radial-gradient(ellipse at top, #1e293b, #0f172a)
secondary: #162032
neutral:   #0f172a
accents:   [sky, cyan, purple, emerald]
```
Subtle gradient, restrained. Enterprise dark mode.

---

### DARK MODE — Neutral (~3)

#### 6. Graphite
```
primary:   linear-gradient(135deg, #1f2937, #374151)
secondary: #1a2030
neutral:   #111827
accents:   [orange, emerald, sky, purple]
```
Pure gray-dark. No color bias. Works for anything.

#### 7. Obsidian
```
primary:   radial-gradient(ellipse at top right, #1c1917, #292524)
secondary: #1c1917
neutral:   #0c0a09
accents:   [orange, amber, emerald, sky]
```
Near-black with warm undertone. Premium, luxury SaaS.

#### 8. Charcoal
```
primary:   linear-gradient(to bottom, #18181b, #27272a)
secondary: #1e1e22
neutral:   #18181b
accents:   [emerald, sky, purple, orange]
```
Zinc-dark. Modern, minimal dark. Design tools.

---

### DARK MODE — Warm (~3)

#### 9. Espresso
```
primary:   linear-gradient(135deg, #1c1210, #2c1d18)
secondary: #1a1412
neutral:   #120e0c
accents:   [amber, orange, emerald, sky]
```
Dark brown. Warm premium. Finance, luxury.

#### 10. Dark Terracotta
```
primary:   linear-gradient(135deg, #2a1810, #3d2418)
secondary: #231610
neutral:   #1a100c
accents:   [amber, orange, cream, emerald]
```
Warm rust-dark. Bold warmth. Creative agencies.

#### 11. Dark Forest
```
primary:   linear-gradient(135deg, #0a1f15, #14332a)
secondary: #0e1a14
neutral:   #0a140f
accents:   [amber, sky, orange]             # removed emerald (same family as primary)
```
Deep green-dark. Sustainability, health, nature tech.

---

### LIGHT MODE — Cool (~7)

#### 12. Ice Blue
```
primary:   linear-gradient(135deg, #3b82f6, #2563eb)
secondary: rgba(219, 234, 254, 0.85)              # was 0.8 — stronger tint for hero→section cohesion
neutral:   #f8fafc                                  # was #ffffff — slight tint reduces contrast jump
accents:   [purple, orange, emerald]               # removed indigo (too similar to blue hero)
```
Classic SaaS blue. Trust, reliability. Default for B2B.

#### 13. Trust Blue
```
primary:   linear-gradient(135deg, #2563eb, #1d4ed8)
secondary: rgba(219, 234, 254, 0.7)
neutral:   #f8fafc
accents:   [purple, orange, emerald, amber]
```
Deeper blue. Enterprise, finance, compliance.

#### 14. Soft Lavender
```
primary:   linear-gradient(135deg, #7c3aed, #6d28d9)
secondary: rgba(245, 243, 255, 0.8)
neutral:   #fafafe
accents:   [orange, emerald, amber]          # removed sky (low contrast on purple hero)
```
Purple primary. Creative tools, AI, design.

#### 15. Sky Bright
```
primary:   linear-gradient(135deg, #0ea5e9, #0284c7)
secondary: rgba(240, 249, 255, 0.8)
neutral:   #ffffff
accents:   [orange, purple, emerald, amber]
```
Light sky blue. Friendly SaaS, communication tools.

#### 16. Ocean
```
primary:   linear-gradient(to top right, #3b82f6, #60a5fa, #7dd3fc)
secondary: rgba(219, 234, 254, 0.6)
neutral:   #ffffff
accents:   [orange, amber, emerald, purple]
```
Multi-stop blue gradient. Modern, dynamic. Startups.

#### 17. Teal Fresh
```
primary:   linear-gradient(135deg, #14b8a6, #0d9488)
secondary: rgba(240, 253, 250, 0.8)
neutral:   #ffffff
accents:   [orange, amber, purple, sky]
```
Teal. Growth, health, productivity tools.

#### 18. Emerald Clean
```
primary:   linear-gradient(135deg, #10b981, #059669)
secondary: rgba(236, 253, 245, 0.8)
neutral:   #fafffe
accents:   [orange, purple, sky, amber]
```
Green. Success, fintech, sustainability.

---

### LIGHT MODE — Neutral (~5)

#### 19. Cloud White
```
primary:   linear-gradient(135deg, #9ca3af, #6b7280)  # was #6b7280→#4b5563 — lightened for "light" palette feel
secondary: rgba(249, 250, 251, 0.8)
neutral:   #ffffff
accents:   [blue, emerald, purple, orange]
```
Gray primary. Ultra-minimal. Notion-style clean.

#### 20. Pearl Gray
```
primary:   linear-gradient(135deg, #94a3b8, #64748b)  # was #64748b→#475569 — lightened for cohesion
secondary: rgba(248, 250, 252, 0.7)
neutral:   #ffffff
accents:   [blue, orange, emerald, purple]
```
Slate primary. Professional, corporate, legal.

#### 21. Steel
```
primary:   linear-gradient(to top right, #e2e8f0, #cbd5e1)
secondary: rgba(248, 250, 252, 0.8)
neutral:   #ffffff
accents:   [blue, emerald, purple, orange]
```
Light gray gradient primary. Very subtle. Content-first pages.

#### 22. Soft Stone
```
primary:   linear-gradient(135deg, #78716c, #57534e)
secondary: rgba(250, 250, 249, 0.7)
neutral:   #fffffe
accents:   [orange, amber, emerald, blue]
```
Warm gray. Consulting, professional services.

#### 23. Zinc Modern
```
primary:   linear-gradient(135deg, #71717a, #52525b)  # was #52525b→#3f3f46 — lightened, too heavy for "light"
secondary: rgba(250, 250, 250, 0.8)
neutral:   #ffffff
accents:   [purple, sky, emerald, orange]
```
Cool modern gray. SaaS dashboards, developer tools.

---

### LIGHT MODE — Warm (~7)

#### 24. Warm Sand
```
primary:   linear-gradient(135deg, #d97706, #b45309)
secondary: rgba(255, 251, 235, 0.8)
neutral:   #fffdf7
accents:   [sky, emerald, indigo, purple]
```
Amber primary on cream. Ecommerce, marketplaces.

#### 25. Coral
```
primary:   linear-gradient(135deg, #f97316, #ea580c)
secondary: rgba(255, 247, 237, 0.8)
neutral:   #fffbf5
accents:   [sky, emerald, indigo, purple]
```
Orange primary. High energy. Conversion-focused.

#### 26. Sunset
```
primary:   linear-gradient(to top right, #f59e0b, #f97316)
secondary: rgba(255, 251, 235, 0.7)
neutral:   #fffdf5
accents:   [sky, indigo, emerald, purple]
```
Amber-to-orange. Warm, optimistic. SMB, freelancer tools.

#### 27. Blush
```
primary:   linear-gradient(135deg, #e11d48, #be123c)
secondary: rgba(255, 241, 242, 0.8)
neutral:   #fffbfb
accents:   [sky, emerald, purple, indigo]
```
Rose/pink primary. Consumer, lifestyle, health.

#### 28. Rose Soft
```
primary:   linear-gradient(135deg, #fb7185, #f43f5e)
secondary: rgba(255, 241, 242, 0.7)
neutral:   #fffcfc
accents:   [sky, emerald, indigo, amber]
```
Softer pink. Approachable, friendly. Creator tools.

#### 29. Mint Warm
```
primary:   linear-gradient(to top right, #34d399, #6ee7b7, #a7f3d0)
secondary: rgba(236, 253, 245, 0.7)
neutral:   #fafffe
accents:   [orange, purple, amber]            # removed sky (low contrast on mint hero)
```
Light green gradient. Friendly, growth. Startup default.

#### 30. Golden Hour
```
primary:   linear-gradient(135deg, #ca8a04, #a16207)
secondary: rgba(254, 252, 232, 0.7)
neutral:   #fffef5
accents:   [sky, indigo, emerald, purple]
```
Gold. Premium, exclusive. Luxury SaaS, financial tools.

---

## Accent System

### Single Accent, Shade Variants

One accent color per theme. Different UI elements use shade variants of that same color.
Icons are handled separately by the theme system (cardStyles.ts: warm→orange, cool→blue, neutral→gray).

### Role Assignment

| Element | What It Uses | Example (accent = purple) |
|---------|-------------|--------------------------|
| Primary CTA button | `accent-500` | `bg-purple-500` |
| CTA hover | `accent-600` | `bg-purple-600` |
| "Popular" / "New" badge | `accent-500` | `bg-purple-500` |
| Pricing highlight border | `accent-500` | `border-purple-500` |
| Ghost CTA | `accent-600` text | `text-purple-600` |
| Ghost CTA hover | `accent-50` bg | `bg-purple-50` |
| Links | `accent-600` text | `text-purple-600` |
| Focus borders | `accent-500` border | `border-purple-500` |
| Feature icons | **Theme** (not accent) | `bg-blue-100 text-blue-600` |
| Step numbers | **Theme** (not accent) | `text-orange-600` |

### Selection Logic

Pick 1 from palette's `compatibleAccents[]`:

```typescript
function selectAccent(palette: Palette): string {
  const options = accentOptions.filter(o =>
    palette.compatibleAccents.includes(o.accentColor)
  );

  // Prefer high-contrast for conversion punch
  const selected = options.find(o => o.tags.includes('high-contrast'))
    || options[0];

  return selected?.tailwind || 'bg-blue-500';
}
```

### Dark Mode Accent Rules

Dark backgrounds need brighter accents for visibility:

| Mode | Accent Weight | Example |
|------|--------------|---------|
| Dark | 400-level or neon | `cyan-400`, `emerald-400`, `amber-400` |
| Light | 500-600 level | `blue-600`, `purple-500`, `orange-500` |

---

## Texture System (Optional Enhancement — Phase 2)

Textures are overlays on existing backgrounds, not separate backgrounds.
Applied to **primary** and **dark secondaries** only. Light secondaries and neutrals stay clean.

### Where Textures Apply

| Surface | Texture Allowed | Why |
|---------|----------------|-----|
| Primary (any mode) | Yes | Hero/CTA — adds depth and premium feel |
| Secondary (dark mode) | Yes (dot-grid only) | Flat dark surfaces look cheap without subtle texture |
| Secondary (light mode) | No | Light tints are already subtle, texture = noise |
| Neutral | No | Breathing room — must stay clean |

### Texture Definitions

```typescript
interface TextureOverlay {
  id: string;
  label: string;
  css: { dark: string; light: string };  // Mode-specific CSS (colors inverted)
}

const textures: TextureOverlay[] = [
  {
    id: 'dot-grid',
    label: 'Dot Grid',
    css: {
      dark: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px) 0 0/20px 20px',
      light: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px) 0 0/20px 20px',
    }
  },
  // noise/grain DROPPED — tested distracting across all palettes
  {
    id: 'line-grid',
    label: 'Line Grid',
    css: {
      dark: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 30px)',
      light: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 30px)',
    }
  },
  {
    id: 'paper',
    label: 'Paper',
    css: {
      dark: '',   // Not compatible with dark
      light: 'url("data:image/svg+xml,...") /* subtle fiber texture */',
    }
  },
  {
    id: 'none',
    label: 'None',
    css: { dark: '', light: '' }
  },
];
```

### Compatibility Matrix

| Texture | Dark Primary | Light Primary | Dark Secondary | Light Secondary | Neutral |
|---------|-------------|---------------|----------------|-----------------|---------|
| dot-grid | Yes | Yes | Yes | — | — |
| line-grid | Yes | — | — | — | — |
| paper | — | Yes | — | — | — |
| none | Yes | Yes | Yes | Yes | Yes |

### How It Composes

```typescript
function compileBackground(palette: Palette, textureId: string, surface: 'primary' | 'secondary' | 'neutral'): string {
  const bg = palette[surface];

  // No texture on neutral or light secondary
  if (surface === 'neutral') return bg;
  if (surface === 'secondary' && palette.mode === 'light') return bg;

  const texture = textures.find(t => t.id === textureId);
  if (!texture || textureId === 'none') return bg;

  const textureCss = texture.css[palette.mode];
  if (!textureCss) return bg;  // Incompatible combo

  return `${textureCss}, ${bg}`;  // Texture on top, bg underneath
}

// Example output:
// compileBackground(midnightSlate, 'dot-grid', 'primary')
// → "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px) 0 0/20px 20px, linear-gradient(135deg, #0f172a, #1e3a5f)"
```

---

## Glow (Optional Enhancement — Phase 2)

Content-aware positions only. **No center glows** (content sits there, glow is hidden).

```typescript
const glowPositions = {
  'top-wash':    'radial-gradient(ellipse at top, {color}, transparent 70%)',
  'bottom-anchor': 'radial-gradient(ellipse at bottom, {color}, transparent 70%)',
  'corner-tl':  'radial-gradient(circle at 15% 15%, {color}, transparent 50%)',
  'corner-br':  'radial-gradient(circle at 85% 85%, {color}, transparent 50%)',
  'sides':      'radial-gradient(circle at 0% 50%, {color}, transparent 40%), radial-gradient(circle at 100% 50%, {color}, transparent 40%)',
  'none':       null,
};
```

---

## Vibe → Palette Mapping

```typescript
const VIBE_TO_PALETTES: Record<Vibe, string[]> = {
  'Dark Tech':     ['midnight-slate', 'deep-indigo', 'ocean-abyss', 'arctic-night', 'steel-midnight', 'graphite', 'charcoal'],
  'Light Trust':   ['ice-blue', 'trust-blue', 'pearl-gray', 'steel', 'cloud-white'],
  'Warm Friendly': ['coral', 'sunset', 'warm-sand', 'mint-warm', 'rose-soft'],
  'Bold Energy':   ['soft-lavender', 'sky-bright', 'ocean', 'blush', 'golden-hour'],
  'Calm Minimal':  ['cloud-white', 'pearl-gray', 'zinc-modern', 'soft-stone', 'steel'],
};
```

Strategy AI picks vibe. Palette selection happens via progressive user questions during generation (see below).

---

## Palette Selection UX

### Core Idea

Turn the ~15s copy generation wait into a co-design experience. User answers 2-4 quick visual questions while AI generates copy in the background. Each question is obvious, visual, no jargon. By the time they finish, content is ready. Apply their choices. Reveal the page.

```
Current:   Onboarding → [spinner 15s] → Page
New:       Onboarding → Strategy API → [progressive design questions] → Page
                                              ↑                           ↑
                                      instant (client-side)        AI finishes in background
```

No extra wait. Generation feels faster. Dead time becomes meaningful interaction.

### Flow

```
Step 5: Assets
Step 6: Strategy API → returns vibe + strategy (fast, ~3s)
        Copy generation starts in background
Step 6.5: Progressive design questions ← WHILE copy generates
  Q1: Dark or Light?                            → 2 options (always)
  Q2: Base color family                         → 6 or 8 visual swatches (always)
  Q3: Specific palette (only if >1 in family)   → 2-5 visual cards
      OR skip if only 1 palette in that family
  Q4: Texture                                   → 2-3 options
Step 7: User done + AI copy ready → Reveal page
```

### Q1: Dark or Light?

Two visual cards. Binary. Everyone has an opinion.

```
┌──────────────────┐          ┌──────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │          │ ░░░░░░░░░░░░░░░ │
│  InvoiceBot      │          │  InvoiceBot      │
│  AI invoices for │          │  AI invoices for │
│  freelancers     │          │  freelancers     │
│  [Start Free]    │          │  [Start Free]    │
│                  │          │                  │
└──────────────────┘          └──────────────────┘
Tech & developer audiences    Builds instant trust with
prefer dark interfaces        mainstream B2B audiences
```

Cards use product name + one-liner + CTA text (already collected from onboarding). Semi-real, not dummy.

**Cuts 30 → 11 (dark) or 19 (light).**

### Q2: Base Color Family

Show visual swatches — one per base color. No labels, no mood names. Just color + helper text with a business reason.

**Dark (6 base colors):**

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ navy/  │ │ indigo │ │ teal/  │ │ pure   │ │ brown  │ │ green  │
│ slate  │ │ purple │ │ ocean  │ │ gray   │ │        │ │        │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
Used by 70%  AI & ML     Data &     Clean       Signals     Sustain-
of dev tool  products    analytics  canvas.     premium.    ability,
landing      use this    platforms  Lets your   Finance,    health,
pages        palette     favor      product     luxury      nature
             family      this       UI stand    SaaS        tech
                                    out
```

**Light (8 base colors):**

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ blue   │ │ purple │ │ teal   │ │ green  │ │ gray   │ │ amber/ │ │ orange │ │ rose/  │
│        │ │        │ │        │ │        │ │        │ │ gold   │ │        │ │ pink   │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
#1 in B2B   Creative    Growth &   Success,   Content-   Ecommerce  Highest    Consumer,
SaaS.       & AI        health     fintech,   first.     & market-  energy.    lifestyle,
Stripe,     tools.      products.  sustain-   Stripe,    places.    Conversion creator
Intercom    Stand out   Produc-    ability    Notion,    Premium    focused    tools,
use this    in crowded  tivity              Linear     feel       pages      health
            markets     tools               style
```

Each swatch = mini card with that color family's representative gradient as background. No text labels on the card itself — helper text sits below.

**Narrows to a specific color bucket (1-5 palettes).**

### Q3: Specific Palette (conditional)

Only shown if the chosen color family has >1 palette. If only 1 → skip straight to Q4.

| Mode | Color Family | Palettes | Q3? |
|------|-------------|----------|-----|
| Dark | Navy/Slate | Midnight Slate, Arctic Night, Steel Midnight, Graphite | Yes → 4 |
| Dark | Indigo | Deep Indigo | Skip |
| Dark | Teal | Ocean Abyss | Skip |
| Dark | Pure Gray | Charcoal, Obsidian | Yes → 2 |
| Dark | Brown | Espresso, Dark Terracotta | Yes → 2 |
| Dark | Green | Dark Forest | Skip |
| Light | Blue | Ice Blue, Trust Blue, Ocean, Sky Bright | Yes → 4 |
| Light | Purple | Soft Lavender | Skip |
| Light | Teal | Teal Fresh | Skip |
| Light | Green | Emerald Clean, Mint Warm | Yes → 2 |
| Light | Gray | Cloud White, Pearl Gray, Steel, Soft Stone, Zinc Modern | Yes → 5 |
| Light | Amber/Gold | Warm Sand, Sunset, Golden Hour | Yes → 3 |
| Light | Orange | Coral | Skip |
| Light | Rose/Pink | Blush, Rose Soft | Yes → 2 |

Cards show all 3 palette surfaces (primary + secondary + neutral) so user sees the full color story. Same semi-real content (product name + one-liner + CTA).

```
┌──────────────────┐
│  ██████████████  │  ← primary bg (hero zone)
│  InvoiceBot      │
│  AI invoices     │
│  [Start Free]    │  ← accent CTA
│──────────────────│
│  ▓▓▓▓▓▓▓▓▓▓▓▓  │  ← secondary bg
│  ■ card  ■ card  │  ← card surface
│──────────────────│
│  ░░░░░░░░░░░░░░  │  ← neutral bg
│  [Start Free]    │  ← accent CTA
└──────────────────┘
```

Helper text describes the visual feel briefly — not a mood name, just what makes it different from siblings:

```
Example: Dark → Navy/Slate → 4 options

Card 1: "Deep navy with blue warmth"        (Midnight Slate)
Card 2: "Cool gray-dark, infrastructure"     (Arctic Night)
Card 3: "Subtle radial glow, restrained"     (Steel Midnight)
Card 4: "Lighter slate, more contrast"       (Graphite)
```

### Q4: Texture

Show compatible textures for the chosen palette. Each as a visual swatch on the palette's primary background.

```
Dark palette:    [None]  [Dot Grid]  [Line Grid]
Light palette:   [None]  [Dot Grid]  [Paper]
```

One tap. Default pre-selected = `none`.

### Accent Selection (Automatic)

User doesn't pick accent. Auto-selected:

| Decision | Logic |
|----------|-------|
| Accent | First high-contrast option from palette's `compatibleAccents[]` |

Changeable in editor post-generation.

### Preview Card Design

All question cards use the same component — semi-real content, instant render via CSS vars:

- **Product name** (from step 1)
- **One-liner** (from step 2)
- **CTA text** (derived from landing goal, step 3)
- **Font pairing** from associated vibe (Sora, Inter, DM Sans, Playfair Display)

No palette names shown to user. No mood labels. Pure visual.

### Helper Text Principles

| Do | Don't |
|----|-------|
| Reference audience type: "developer audiences" | Label the mood: "Cool & Techy" |
| Name real companies: "Stripe, Linear style" | Use designer jargon: "neutral palette" |
| Imply conversion benefit: "drives higher engagement" | Be vague: "feels professional" |
| Keep to 1-2 lines max | Write a paragraph |

### Timing Budget

All during ~15s copy generation:

```
Q1: Dark/Light           ~2s
Q2: Base color           ~3s
Q3: Palette (if needed)  ~3-4s
Q4: Texture              ~2s
                        ─────
                     ~10-11s total
```

Fits within generation window. Some paths skip Q3 (single-palette families), finishing even faster.

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| User finishes before AI | Store choices, show brief loading with "Almost ready..." |
| AI finishes before user finishes | Keep showing questions + subtle nudge: "Your page is ready! Finish picking to see it" |
| User doesn't interact after 30s | Auto-select defaults (strategy vibe's top palette, no texture), reveal page |
| User goes back to change Q1 | Reset Q2-Q4, show fresh options for new mode |

### Post-Reveal

On page reveal, show subtle toast:
> "You can change your style anytime from the editor toolbar"

Reduces commitment anxiety.

### Editor Theme Panel (post-generation)

Full control in editor sidebar for users who want to explore further:

```
┌─ Theme ──────────────────┐
│                          │
│  Palette:                │
│  [●][○][○][○][○]         │  ← visual swatches from current color family
│                          │
│  Accent:                 │
│  [🟣][🟠][🟢][🔵]        │  ← compatible accents for current palette
│                          │
│  Texture: [None ▾]       │  ← none / dot-grid / paper / line-grid
│                          │
│  [Browse all styles →]   │  ← opens full 30-palette browser
│                          │
└──────────────────────────┘
```

### Mobile Layout

Q1: side-by-side (2 cards fit).
Q2: 2×3 grid (dark, 6 options) or 2×4 grid (light, 8 options). Scrollable if needed.
Q3: side-by-side or 2×2 grid depending on count.
Q4: side-by-side (2-3 options).

### What This Eliminates

- ~~AI picking palette~~ — user picks through progressive questions
- ~~Random palette within vibe~~ — user intentionally narrows to exact palette
- ~~Loading spinner during generation~~ — meaningful co-design interaction instead
- ~~Post-generation palette regret~~ — user designed it, they own it
- ~~Extra onboarding step~~ — it IS the wait time, not added time
- ~~Abstract vibe/mood labels~~ — pure visual + business-reason helper text
- ~~Analysis paralysis~~ — each question is 2-8 obvious visual options, not 30

---

## Migration Path

### Phase 1: Palette System
1. Create `palettes.ts` with ~30 palettes (this spec)
2. Update `generateBackgroundSystemForVibe()` to use palettes
3. Remove `primaryBackgrounds.ts` (65 individual bgs)
4. Remove `simpleSecondaryBackgrounds.ts` (derived secondaries)
5. Remove `background` field from `SectionMeta` in `sectionList.ts`
6. Replace `assignSectionBackgrounds()` with position-based alternation
7. Drop `divider` from `BackgroundSystem` interface
8. Add `migrateBackgroundSystem(old) → new` for saved drafts
9. Keep `cardStyles.ts` and text color system untouched

### Phase 2: Accent Cleanup
1. Update `accentOptions.ts` — single accent selection from palette's compatibleAccents
2. Update `colorTokens.ts` — simplify to shade variants of one accent
3. Verify UIBlocks use theme for icons (not accent)

### Phase 3: Texture + Glow (optional)
1. Add texture overlay system for primary backgrounds
2. Add glow position system
3. Editor UI for texture/glow selection

---

## Summary

```
Theme = Palette + AccentPair

Palette (fixed trio):
  primary    → Hero + CTA (bookends)
  secondary  → Odd content sections (1st, 3rd, 5th...)
  neutral    → Header, Footer, even content sections (2nd, 4th, 6th...)

Section mapping = position-based alternation, not per-section config.

Accent (separate axis, single color):
  accent-500 → CTAs, badges, pricing highlight
  accent-600 → Links, ghost CTA, focus borders
  Icons      → Theme-driven (cardStyles.ts), not accent

Dynamic (unchanged):
  cardStyles → Luminance-based per section
  textColor  → Computed per background
```

~30 palettes × ~3-4 accents each = **~100 distinct themes**
All hand-curated. No random combinatorics. No garbage output.

---

## Test Report Findings (Applied)

Based on visual testing of all 30 palettes in palette-test.html.

### Accent Removals (same-family clashes)

| Palette | Removed | Reason |
|---------|---------|--------|
| #3 Ocean Abyss | cyan, teal | Same family as teal primary — CTA invisible |
| #11 Dark Forest | emerald | Green on green — CTA blends into hero |
| #12 Ice Blue | indigo | Too similar to blue hero — CTA fades |
| #14 Soft Lavender | sky | Low contrast on purple hero |
| #29 Mint Warm | sky | Low contrast on mint hero |

### Palette Fixes (hero/section cohesion)

| Palette | Change | Reason |
|---------|--------|--------|
| #12 Ice Blue | secondary `0.8 → 0.85`, neutral `#ffffff → #f8fafc` | Stronger tint reduces hero→section contrast jump |
| #19 Cloud White | primary `#6b7280→#4b5563` → `#9ca3af→#6b7280` | Was too dark for a "light" palette |
| #20 Pearl Gray | primary `#64748b→#475569` → `#94a3b8→#64748b` | Same — lightened for cohesion |
| #23 Zinc Modern | primary `#52525b→#3f3f46` → `#71717a→#52525b` | Too heavy for "light" mode |

### Texture Decision

- **Shipped**: dot-grid, paper, none (3 textures)
- **Dropped**: noise/grain — tested distracting on every palette
- **Best pairing**: dot-grid for dark, paper for light/warm, none default

### Missing Moods (future additions)

- Dark warm bright (dark rose/magenta hero — like Blush but dark mode)
- Light minimal monotone (grayscale + single neon accent)

---

## Implementation Direction: Phase 1

### Scope

Palette data layer + position-based mapping + textures + temporary palette selection.
Single dev job. This is the "engine" — the Progressive Design Questions UX is a separate task that consumes this.

### Build

1. palettes.ts — 30 palettes from spec above. Data model:

  interface Palette {
    id: string;
    label: string;
    mode: 'dark' | 'light';
    temperature: 'cool' | 'neutral' | 'warm';
    energy: 'calm' | 'bold';
    colorFamily: string;       // groups palettes for UX selection flow
    fontPairing: string;       // font theme id associated with this palette
    primary: string;
    secondary: string;
    neutral: string;
    compatibleAccents: string[];
  }

  colorFamily values (must be explicit on each palette, not derived):
    Dark: 'navy-slate' | 'indigo' | 'teal-ocean' | 'pure-gray' | 'brown' | 'green'
    Light: 'blue' | 'purple' | 'teal' | 'green' | 'gray' | 'amber-gold' | 'orange' | 'rose-pink'

  Grouping (from Q3 table):
    Dark navy-slate:   Midnight Slate, Arctic Night, Steel Midnight, Graphite  (4)
    Dark indigo:       Deep Indigo                                              (1)
    Dark teal-ocean:   Ocean Abyss                                              (1)
    Dark pure-gray:    Charcoal, Obsidian                                       (2)
    Dark brown:        Espresso, Dark Terracotta                                (2)
    Dark green:        Dark Forest                                              (1)
    Light blue:        Ice Blue, Trust Blue, Ocean, Sky Bright                  (4)
    Light purple:      Soft Lavender                                            (1)
    Light teal:        Teal Fresh                                               (1)
    Light green:       Emerald Clean, Mint Warm                                 (2)
    Light gray:        Cloud White, Pearl Gray, Steel, Soft Stone, Zinc Modern  (5)
    Light amber-gold:  Warm Sand, Sunset, Golden Hour                           (3)
    Light orange:      Coral                                                    (1)
    Light rose-pink:   Blush, Rose Soft                                         (2)

2. compileBackground() — Compose palette surface + texture overlay.
  4 textures: dot-grid, line-grid, paper, none.
  Compatibility matrix:
    dot-grid:  dark primary, light primary, dark secondary
    line-grid: dark primary only
    paper:     light primary only
    none:      all surfaces
  Neutral and light secondary = always clean, no texture.

3. Position-based section mapping — Replace assignSectionBackgrounds():
  Header/Footer → neutral  (always)
  Hero/CTA      → primary  (page bookends)
  Content       → alternating secondary ↔ neutral
  No per-section background config. Position determines everything.

4. Temporary palette selection — GeneratingStep.tsx currently calls vibeBackgroundSystem.
  Replace with: pick a sensible default palette per vibe so generation still works.
  Simple logic — first palette in the vibe's color pool, or hardcoded defaults:
    'Dark Tech'     → midnight-slate
    'Light Trust'   → ice-blue
    'Warm Friendly' → coral
    'Bold Energy'   → soft-lavender
    'Calm Minimal'  → cloud-white
  This is a TEMPORARY bridge. The Progressive Design Questions UX (separate dev)
  will replace this with user-driven selection.
  DO NOT build VIBE_TO_PALETTES as a runtime system — it's dead. Just hardcode 5 defaults.

5. Accent from palette — Feed palette.compatibleAccents into existing accent system.
  Pick first high-contrast option. No accent rewiring needed, just change the source.

6. Export helpers for UX dev to consume:
  - getPalettesByMode(mode: 'dark' | 'light'): Palette[]
  - getColorFamilies(mode: 'dark' | 'light'): { family: string, palettes: Palette[] }[]
  - getPaletteById(id: string): Palette
  - getCompatibleTextures(palette: Palette): TextureOverlay[]
  These are simple lookups. UX dev needs them for Q1-Q4 progressive flow.

### Delete/Archive

- primaryBackgrounds.ts (65 hardcoded bgs)
- simpleSecondaryBackgrounds.ts (derived secondaries)
- themeScoreMap.ts (45K scoring matrix)
- vibeMapping.ts (dead code)
- vibeBackgroundSystem.ts (replaced by temporary defaults + position mapping)
- VIBE_TO_PALETTES mapping — DO NOT port this. Dead concept.
- background field from SectionMeta
- divider from BackgroundSystem interface
- BACKGROUND_MAP lookup
- Rhythm enforcement logic (max 2 consecutive highlights)

### Don't Touch

- cardStyles.ts — luminance-based, works with any palette
- getSmartTextColor — reads background, works with any palette
- getPublishedCardStyles — same
- Accent system internals — just change input source
- Editor Theme Panel — separate task
- GeneratingStep.tsx flow logic — only replace the bg function call, don't restructure

### No Migration

No production pages. Clean swap. No adapter needed.

### Phase 1 Verification

1. npm run build passes
2. Generate page — temporary default palette applied correctly per vibe
3. Dark palettes: ALL sections dark (no white content sections leaking through)
4. Light palettes: hero colored, content sections light alternating
5. Textures compose correctly on primary surfaces
   - dot-grid visible on dark hero
   - paper visible on light hero
   - line-grid visible on dark hero only
   - neutral sections always clean
6. Cards adapt correctly (glass on dark, solid on light) — cardStyles untouched
7. Text readable on all surfaces — getSmartTextColor untouched
8. Accent CTA visible against all hero backgrounds
9. Helper functions return correct groupings (test getPalettesByMode, getColorFamilies)

### Not In Scope (separate tasks)

- Progressive Design Questions UX (Q1-Q4 flow during generation) — separate dev (see Phase 2)
- Glow system — future phase
- Editor Theme Panel redesign — separate task
- Font pairing integration — fontPairing field is defined but wiring to typography system is separate

---

## Implementation Direction: Phase 2

### Scope

Replace the spinner/checklist in GeneratingStep with 4 progressive design questions.
User picks palette + texture WHILE copy generates in background (~15s).
Single dev job. Consumes Phase 1 data layer (palettes.ts, textures.ts, compileBackground).

### What You're Replacing

Current GeneratingStep.tsx (src/app/create/[token]/components/steps/GeneratingStep.tsx):
  - Shows: spinner + progress bar + rotating messages + section checklist
  - Copy generation fires on mount via callGenerateCopyAPI()
  - On success: saves draft → redirects to /generate/{tokenId}

New: Replace the spinner UI with progressive design questions.
Keep the copy generation logic completely unchanged.
Keep saveGeneratedContent but modify to use user's palette choice instead of vibe default.

### Architecture

  GeneratingStep mounts
    ├─ callGenerateCopyAPI() fires (unchanged, runs in background)
    └─ UI shows DesignQuestionsFlow component (NEW)
         Q1: Dark or Light?           → getPalettesByMode()
         Q2: Color family             → getColorFamilies(mode)
         Q3: Specific palette         → only if family has >1 palette
         Q4: Texture                  → getCompatibleTextures(palette)
         Done → user choices stored in local state
    When BOTH ready (copy done + user done):
      → Apply chosen palette to saveGeneratedContent
      → Save draft → redirect

### Data Available in GeneratingStep (from useGenerationStore)

  productName    — "InvoiceBot"           (for preview cards)
  oneLiner       — "AI invoices for..."   (for preview cards)
  landingGoal    — "free-trial"           (derive CTA text for previews)
  strategy.vibe  — "Dark Tech"           (NOT used for palette selection, only for font pairing fallback)

CTA text derivation from landingGoal:
  waitlist     → "Join Waitlist"
  signup       → "Get Started Free"
  free-trial   → "Start Free Trial"
  buy          → "Get Started"
  demo         → "Book a Demo"
  download     → "Download Now"

### Build

1. DesignQuestionsFlow component
  Create: src/app/create/[token]/components/steps/DesignQuestionsFlow.tsx

  Props:
    productName: string
    oneLiner: string
    ctaText: string                    // derived from landingGoal
    vibe: string                       // for skip defaults + font fallback
    apiComplete: boolean               // to show "ready" nudge when API finishes first
    onComplete: (choices: DesignChoices) => void
    onSkip: () => void                 // skip to editor with vibe defaults

  interface DesignChoices {
    paletteId: string;
    textureId: string;
  }

  Internal state:
    step: 1 | 2 | 3 | 4
    mode: 'dark' | 'light' | null
    colorFamily: string | null
    paletteId: string | null
    textureId: string | null

  Flow logic:
    Q1 answer → set mode, advance to Q2
    Q2 answer → set colorFamily
      → if family has 1 palette: auto-set paletteId, skip Q3, advance to Q4
      → if family has >1 palette: advance to Q3
    Q3 answer → set paletteId, advance to Q4
    Q4 answer → set textureId, call onComplete({ paletteId, textureId })

  Back navigation: user clicks back → go to previous Q, reset downstream choices.

2. PalettePreviewCard component
  Create: src/app/create/[token]/components/steps/PalettePreviewCard.tsx

  Reusable mini-preview showing palette applied to a mock landing page.
  Used in Q1, Q3, and optionally Q2.

  Props:
    palette: Palette
    productName: string
    oneLiner: string
    ctaText: string
    accentColor: string              // first compatible accent
    selected?: boolean
    onClick: () => void

  Keep it small (200-250px tall, 160-200px wide). Pure CSS, no animations.
  Text color: simple heuristic — white text on dark bg, dark text on light bg.
  Use palette.mode to decide. Don't import full text color system for previews.

3. Modify GeneratingStep.tsx

  Keep unchanged:
    - imports, mergeImagesIntoSections helper
    - callGenerateCopyAPI

  Modify saveGeneratedContent:
    - Replace generateBackgroundSystemForVibe(strategy.vibe)
    - With: generateBackgroundSystemFromPalette(chosenPalette)
    - Import generateBackgroundSystemFromPalette from backgroundIntegration
    - Import getPaletteById from palettes
    - Import compileBackground from textures
    - Apply texture: compile primary/secondary/neutral with chosen textureId

  Add new state:
    const [designChoices, setDesignChoices] = useState<DesignChoices | null>(null)
    const [userDone, setUserDone] = useState(false)

  Modify completion logic:
    Current: when apiComplete → save → redirect
    New: when apiComplete AND userDone → save with chosen palette → redirect
    If user finishes first: store choices, wait for API
    If API finishes first: store result, wait for user

  Replace render:
    - If !userDone: show <DesignQuestionsFlow ... />
    - If userDone && !apiComplete: show brief "Almost ready..."
    - If userDone && apiComplete: show "Your page is ready!" → save → redirect

  Add handleSkip:
    Pick random palette from DEFAULT_POOLS[strategy.vibe] + texture=none.
    Set userDone=true. Same completion logic applies.

  Add inactivity timer:
    Start 45s timer on mount. Reset on any user interaction.
    If timer fires AND apiComplete: call handleSkip().
    If timer fires AND !apiComplete: do nothing, keep waiting.

4-8. Q1-Q4 + Accent (see Palette Selection UX section above for full details)

9. Subtle background progress indicator
  While user answers Q1-Q4, show a single line at the bottom:
    Before API completes:  "Creating your landing page..."  + tiny spinner
    After API completes:   "Your page is ready! Finish picking to see it"  ✓
  NOT the old progress bar / section checklist. One line of text only.

10. Skip link
  Small muted text link below: "Skip, use defaults →"
  Calls onSkip() → applies random from DEFAULT_POOLS + texture=none.

### Imports from Phase 1

  From palettes.ts:
    getPalettesByMode, getColorFamilies, getPaletteById, Palette

  From textures.ts:
    getCompatibleTextures, compileBackground, TextureOverlay

  From backgroundIntegration.ts:
    generateBackgroundSystemFromPalette

### Default Pools (skip/timeout fallback)

  When user skips or times out, pick RANDOM from vibe-scoped pool.
  Only SHIP-quality palettes (score >= 4.4 from test report). No NEEDS WORK palettes.

  const DEFAULT_POOLS: Record<string, string[]> = {
    'Dark Tech':     ['midnight-slate', 'deep-indigo', 'ocean-abyss', 'arctic-night', 'graphite'],
    'Light Trust':   ['trust-blue', 'sky-bright', 'ocean', 'emerald-clean', 'steel'],
    'Warm Friendly': ['coral', 'sunset', 'mint-warm', 'rose-soft', 'warm-sand'],
    'Bold Energy':   ['blush', 'sky-bright', 'ocean', 'golden-hour', 'soft-lavender'],
    'Calm Minimal':  ['soft-stone', 'steel', 'teal-fresh', 'emerald-clean', 'trust-blue'],
  };

  Excluded from default pools (NEEDS WORK per test report):
    #12 Ice Blue     — hero/section rhythm disjointed
    #19 Cloud White  — hero feels disjointed from sections
    #20 Pearl Gray   — same issue as Cloud White
    #23 Zinc Modern  — hero too heavy for "light" palette

  Also excluded: #5 Steel Midnight (4.3 — lowest scoring SHIP dark palette)

### Don't Touch

  - callGenerateCopyAPI logic — runs unchanged in background
  - Strategy API — already called in previous step
  - Copy API — fires on mount, returns sections
  - mergeImagesIntoSections — image fetching unchanged

### Edge Cases

  1. User finishes Q4 before API returns:
     Show "Almost ready..." with subtle loading indicator.
     When API completes → apply palette → save → redirect.

  2. API completes before user finishes Q4:
     Store result in ref/state. Let user finish picking.
     Bottom indicator: "Your page is ready! Finish picking to see it" ✓
     When user finishes → save → redirect immediately.

  3. User inactive for 45s AND API complete:
     Random pick from DEFAULT_POOLS[vibe] + texture=none.
     Save + redirect. Only auto-skip when API is also done.

  4. User clicks "Skip, use defaults →":
     Random pick from DEFAULT_POOLS[vibe] + texture=none.
     If API done: save + redirect immediately.
     If API not done: show "Almost ready..." until done.

  5. User clicks back on Q2/Q3/Q4:
     Go to previous question. Reset downstream choices only.

  6. Generation error:
     Keep existing ErrorRetry behavior. Design questions don't change this.

### Phase 2 Verification

  1. npm run build passes
  2. Full flow: Onboarding → Strategy → Q1-Q4 → page renders with chosen palette
  3. Dark palette → ALL sections dark on resulting page
  4. Light palette → hero colored, content light alternating
  5. Texture visible on hero of resulting page
  6. Preview cards render correctly with productName + oneLiner + CTA
  7. Back navigation works without breaking state
  8. Edge: finish questions before API → brief loading → page renders
  9. Edge: API finishes first → nudge text → pick → page renders
  10. Skip → random palette from DEFAULT_POOLS applied
  10b. Skip twice for same vibe → different palette each time (random)
  11. Inactivity 45s + API done → auto-skips
  12. Inactivity 45s + API NOT done → stays on questions
  13. Progress text transitions: "Creating..." → "Ready! Finish picking"
  14. Mobile: Q1 side-by-side, Q2 grid, Q3 scrollable, Q4 side-by-side

### File Summary

  New files:
    src/app/create/[token]/components/steps/DesignQuestionsFlow.tsx
    src/app/create/[token]/components/steps/PalettePreviewCard.tsx

  Modified files:
    src/app/create/[token]/components/steps/GeneratingStep.tsx

  No other files modified. Purely a UI addition in the generation step.
