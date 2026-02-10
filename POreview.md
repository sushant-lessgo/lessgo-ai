Final Direction: Background System v3 — Phase 1

Scope

Palette data layer + position-based mapping + textures + temporary palette selection.
Single dev job. This is the "engine" — the Progressive Design Questions UX is a separate task that consumes this.

Build

1. palettes.ts — 30 palettes from newBG.md spec. Data model:

  interface Palette {
    id: string;
    label: string;
    mode: 'dark' | 'light';
    temperature: 'cool' | 'neutral' | 'warm';
    energy: 'calm' | 'bold';
    colorFamily: string;       // NEW — groups palettes for UX selection flow
    fontPairing: string;       // NEW — font theme id associated with this palette
    primary: string;
    secondary: string;
    neutral: string;
    compatibleAccents: string[];
  }

  colorFamily values (must be explicit on each palette, not derived):
    Dark: 'navy-slate' | 'indigo' | 'teal-ocean' | 'pure-gray' | 'brown' | 'green'
    Light: 'blue' | 'purple' | 'teal' | 'green' | 'gray' | 'amber-gold' | 'orange' | 'rose-pink'

  Grouping (from newBG.md Q3 table):
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
  Compatibility matrix from newBG.md:
    dot-grid:  dark primary ✓, light primary ✓, dark secondary ✓
    line-grid: dark primary ✓ only
    paper:     light primary ✓ only
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

Delete/Archive

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

Don't Touch

- cardStyles.ts — luminance-based, works with any palette
- getSmartTextColor — reads background, works with any palette
- getPublishedCardStyles — same
- Accent system internals — just change input source
- Editor Theme Panel — separate task
- GeneratingStep.tsx flow logic — only replace the bg function call, don't restructure

No Migration

No production pages. Clean swap. No adapter needed.

Verification

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

Not In Scope (separate tasks)

- Progressive Design Questions UX (Q1-Q4 flow during generation) — separate dev (see Phase 2 below)
- Glow system — future phase
- Editor Theme Panel redesign — separate task
- Font pairing integration — fontPairing field is defined but wiring to typography system is separate

---

Final Direction: Progressive Design Questions UX — Phase 2

Scope

Replace the spinner/checklist in GeneratingStep with 4 progressive design questions.
User picks palette + texture WHILE copy generates in background (~15s).
Single dev job. Consumes Phase 1 data layer (palettes.ts, textures.ts, compileBackground).

What You're Replacing

Current GeneratingStep.tsx (src/app/create/[token]/components/steps/GeneratingStep.tsx):
  - Shows: spinner + progress bar + rotating messages + section checklist
  - Copy generation fires on mount via callGenerateCopyAPI()
  - On success: saves draft → redirects to /generate/{tokenId}

New: Replace the spinner UI (lines 336-378) with progressive design questions.
Keep the copy generation logic (lines 257-314) completely unchanged.
Keep saveGeneratedContent (lines 154-253) but modify to use user's palette choice instead of vibe default.

Architecture

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

Data Available in GeneratingStep (from useGenerationStore)

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

Build

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

  Layout (from newBG.md):
    ┌──────────────────┐
    │  ██████████████  │  ← palette.primary as background
    │  {productName}   │  ← text color via getSmartTextColor or white/dark heuristic
    │  {oneLiner}      │
    │  [{ctaText}]     │  ← accentColor button
    │──────────────────│
    │  ▓▓▓▓▓▓▓▓▓▓▓▓  │  ← palette.secondary as background
    │  ■ card  ■ card  │  ← card surface (getPublishedCardStyles)
    │──────────────────│
    │  ░░░░░░░░░░░░░░  │  ← palette.neutral as background
    │  [{ctaText}]     │  ← accentColor button
    └──────────────────┘

  Keep it small (200-250px tall, 160-200px wide). Pure CSS, no animations.
  Text color: simple heuristic — white text on dark bg, dark text on light bg.
  Use palette.mode to decide. Don't import full text color system for previews.

3. Modify GeneratingStep.tsx

  Keep unchanged:
    - Lines 1-46: imports, mergeImagesIntoSections helper
    - Lines 95-151: state, progress simulation
    - Lines 257-314: callGenerateCopyAPI
    - Lines 316-322: useEffect trigger

  Modify saveGeneratedContent (lines 154-253):
    - Currently line 173: generateBackgroundSystemForVibe(strategy.vibe)
    - Change to: generateBackgroundSystemFromPalette(chosenPalette)
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

  Replace render (lines 336-378):
    - If !userDone: show <DesignQuestionsFlow ... apiComplete={apiComplete} onComplete={handleDesignComplete} onSkip={handleSkip} />
    - If userDone && !apiComplete: show brief "Almost ready..." with mini progress
    - If userDone && apiComplete: show "Your page is ready!" → save → redirect

  Add handleSkip:
    Pick random palette from DEFAULT_POOLS[strategy.vibe] + texture=none.
    Set userDone=true. Same completion logic applies (waits for API if needed).

  Add inactivity timer:
    Start 45s timer on mount. Reset on any user interaction (click).
    If timer fires AND apiComplete: call handleSkip().
    If timer fires AND !apiComplete: do nothing, keep waiting.

4. Q1: Dark or Light
  Two large cards side by side.
  Each card = PalettePreviewCard with a representative palette:
    Dark card: use midnight-slate palette (4.8 score — top performer)
    Light card: use trust-blue palette (4.6 score — SHIP. NOT ice-blue which is NEEDS WORK)
  Below each card: helper text (from newBG.md):
    Dark: "Tech & developer audiences prefer dark interfaces"
    Light: "Builds instant trust with mainstream B2B audiences"
  Mobile: side by side (cards fit at 160px width each).

5. Q2: Color Family Swatches
  Show color family swatches — NOT full preview cards (too many).
  Each swatch = small rounded rectangle (60×60px) filled with the family's
  representative primary gradient + label below.

  Get families via getColorFamilies(mode).
  For each family, show ONE representative swatch using first palette's primary gradient.

  Dark: 6 swatches. Light: 8 swatches.
  Helper text below each (from newBG.md Q2 section):
    Dark navy-slate:  "Used by 70% of dev tool landing pages"
    Dark indigo:      "AI & ML products use this palette family"
    Dark teal-ocean:  "Data & analytics platforms favor this"
    Dark pure-gray:   "Clean canvas. Lets your product UI stand out"
    Dark brown:       "Signals premium. Finance, luxury SaaS"
    Dark green:       "Sustainability, health, nature tech"
    Light blue:       "#1 in B2B SaaS. Stripe, Intercom use this"
    Light purple:     "Creative & AI tools. Stand out in crowded markets"
    Light teal:       "Growth & health products. Productivity tools"
    Light green:      "Success, fintech, sustainability"
    Light gray:       "Content-first. Stripe, Notion, Linear style"
    Light amber-gold: "Ecommerce & marketplaces. Premium feel"
    Light orange:     "Highest energy. Conversion focused pages"
    Light rose-pink:  "Consumer, lifestyle, creator tools, health"

  Layout: 2×3 grid (dark) or 2×4 grid (light). Mobile: scrollable row.

6. Q3: Specific Palette (conditional)
  Only shown if getColorFamilies(mode) returns >1 palette for chosen family.
  Show PalettePreviewCard for each palette in the family (2-5 cards).

  Helper text per card (differentiator within family, from newBG.md Q3):
    Brief description — what makes this palette different from siblings.
    Use palette.label as visual reference but show descriptive text, not the name.

  Skip table (auto-select the only palette, go to Q4):
    Dark indigo, Dark teal-ocean, Dark green
    Light purple, Light teal, Light orange

  Layout: side by side, scrollable if >3. Mobile: horizontal scroll.

7. Q4: Texture
  Show texture swatches on the chosen palette's primary background.
  Get options via getCompatibleTextures(palette).
  Each swatch = small card showing the texture rendered on primary bg.

  Pre-select "none" as default.
  Dark palettes see: None, Dot Grid, Line Grid (3 options)
  Light palettes see: None, Dot Grid, Paper (3 options)

  Layout: side by side (3 options always fit).

8. Accent selection — AUTOMATIC
  Not a question. After palette is chosen, auto-select:
    palette.compatibleAccents[0] (first high-contrast option)
  Used for CTA button color in preview cards and final page.
  Import accent selection logic from backgroundIntegration (already exists).

9. Subtle background progress indicator
  While user answers Q1-Q4, show a single line at the bottom of the flow:
    Before API completes:  "Creating your landing page..."  + tiny spinner (inline)
    After API completes:   "Your page is ready! Finish picking to see it"  ✓
  NOT the old progress bar / section checklist. One line of text only.
  Transitions via apiComplete prop passed from GeneratingStep.

10. Skip link
  Small muted text link below the questions: "Skip, use defaults →"
  Calls onSkip() → GeneratingStep applies getDefaultPaletteForVibe(vibe) + texture=none.
  If API not done yet, show "Almost ready..." until API completes, then save + redirect.
  If API already done, save immediately + redirect.
  Position: bottom-right, muted gray, does not compete with design cards.

Imports from Phase 1

  From palettes.ts:
    getPalettesByMode, getColorFamilies, getPaletteById, Palette

  From textures.ts:
    getCompatibleTextures, compileBackground, TextureOverlay

  From backgroundIntegration.ts:
    generateBackgroundSystemFromPalette

Default Pools (skip/timeout fallback)

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

  Implementation: pick random from pool, apply palette + texture=none.
    const pool = DEFAULT_POOLS[vibe] || DEFAULT_POOLS['Light Trust'];
    const paletteId = pool[Math.floor(Math.random() * pool.length)];

Don't Touch

  - callGenerateCopyAPI logic — runs unchanged in background
  - Strategy API — already called in previous step
  - Copy API — fires on mount, returns sections
  - mergeImagesIntoSections — image fetching unchanged
  - Progress simulation — can keep or remove (see below)

Progress Indicator

  Drop the section checklist (it's fake anyway — simulated timer).
  Drop the spinning progress circle.
  Replaced by: subtle one-line indicator inside DesignQuestionsFlow (see Build item 9).
  User is engaged with Q1-Q4 so no need for progress theatre.

Edge Cases

  1. User finishes Q4 before API returns:
     Show "Almost ready..." with subtle loading indicator (replaces questions).
     When API completes → apply palette → save → redirect.

  2. API completes before user finishes Q4:
     Store result in ref/state. Let user finish picking.
     Bottom indicator changes to: "Your page is ready! Finish picking to see it" ✓
     When user finishes → apply palette → save → redirect immediately.

  3. User inactive for 45s AND API complete:
     Random pick from DEFAULT_POOLS[vibe] + texture=none.
     Save + redirect. Only auto-skip when API is also done — no point sending user
     to a loading screen.
     If API NOT complete yet: keep showing questions, don't auto-skip.

  4. User clicks "Skip, use defaults →":
     Random pick from DEFAULT_POOLS[vibe] + texture=none.
     If API done: save + redirect immediately.
     If API not done: show "Almost ready..." until API completes, then save + redirect.

  5. User clicks back on Q2/Q3/Q4:
     Go to previous question. Reset downstream choices only.
     Q3→Q2: reset palette + texture
     Q2→Q1: reset colorFamily + palette + texture

  6. Generation error:
     Keep existing ErrorRetry behavior (lines 324-333). Design questions don't change this.

Verification

  1. npm run build passes
  2. Full flow: Onboarding → Strategy → GeneratingStep shows Q1-Q4 → pick palette → page renders
  3. Dark palette chosen → ALL sections dark on resulting page
  4. Light palette chosen → hero colored, content light alternating
  5. Texture visible on hero section of resulting page
  6. Preview cards render correctly with productName + oneLiner + CTA
  7. Back navigation works (Q3→Q2→Q1) without breaking state
  8. Edge: finish questions before API → brief loading → page renders
  9. Edge: API finishes first → questions still shown → nudge text appears → pick → page renders
  10. Skip link → random palette from DEFAULT_POOLS applied → page renders correctly
  10b. Skip twice for same vibe → different palette each time (random, not deterministic)
  11. Inactivity 45s + API done → auto-skips with defaults
  12. Inactivity 45s + API NOT done → stays on questions (no premature skip)
  13. Subtle progress text transitions: "Creating..." → "Ready! Finish picking"
  14. Mobile: Q1 side-by-side, Q2 grid scrollable, Q3 scrollable, Q4 side-by-side

File Summary

  New files:
    src/app/create/[token]/components/steps/DesignQuestionsFlow.tsx    (main flow)
    src/app/create/[token]/components/steps/PalettePreviewCard.tsx     (reusable preview)

  Modified files:
    src/app/create/[token]/components/steps/GeneratingStep.tsx         (integrate flow + palette choice)

  No other files modified. This is purely a UI addition in the generation step.
