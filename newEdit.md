# New Editor UX Spec

## Philosophy

**Generation = curated, opinionated, no garbage.** User lands on a beautiful page.
**Editor = user owns it.** They can mould it to their vision.
Guardrails are warnings, not walls.

---

## Architecture: Header vs Left Panel

**Mental model:**
- **Header** = change the page (global design + actions)
- **Left Panel** = navigate & reference (passive)

---

## Edit Header

```
┌──────────────────────────────────────────────────────────────────────┐
│ [🎨 Theme] [Aa Typography]           [↶↷] [✨Regen Copy] [↻Reset] [👁Preview] │
│ ← design system (2 controls)          global actions →               │
└──────────────────────────────────────────────────────────────────────┘
```

- LEFT: **Theme** (merged bg+color, new), **Typography** (unchanged)
- RIGHT: Undo/Redo, **Regenerate Copy** (new), Reset, Preview
- "Regenerate Copy" = redo all page copy with same inputs/strategy. Global action, lives with Reset/Preview.
- "Regenerate Design" = **killed**. Users co-designed the page; nuking layout is destructive, not helpful.

### Why 2 controls instead of 3

Background and Color are coupled in the new palette system — each palette has `compatibleAccents[]`. Changing palette may invalidate current accent. Separate modals = user changes background → CTA now looks bad → has to open a *different* modal to fix it. Two modals for one decision.

Typography is truly independent (font choice doesn't affect colors). Stays separate.

---

## Theme Popover (replaces Background modal + Color modal)

Opened by the 🎨 Theme button in header. **Popover, not modal** — common actions are quick swaps on small option sets.

```
┌─ Theme ────────────────────────┐
│                                │
│  Palette:                      │
│  [●] [○] [○] [○]              │  ← siblings in current color family
│                                │     (max 5, visual swatches)
│                                │     click = instant swap
│                                │
│  Accent:                       │
│  [🟣] [🟠] [🟢] [🔵]  [Custom]│  ← compatible accents + hex input
│  ⚠️ Low CTA contrast           │  warning if custom has issues
│                                │
│  Texture:                      │
│  [None] [Dot Grid] [Paper]    │  ← 2-3 options, toggle
│                                │
│  [Browse all styles →]         │  ← opens full 30-palette browser modal
│                                │
└────────────────────────────────┘
```

### Palette
- Shows siblings in current color family (2-5 visual swatches). Click = instant swap.
- **Curated only** — 30 hand-curated palettes. No custom palette creation (building a coherent 3-value primary/secondary/neutral set from scratch is genuinely too complex for non-designers).
- "Browse all styles →" opens a full modal with mode → family → palette browsing (same structure as generation Q1-Q4).

### Accent
- Compatible accents shown as quick picks (3-4 curated options per palette).
- **Custom hex input** for brand colors. Show live contrast warning if custom hex has issues against current palette backgrounds. Warning, not blocker — user decides.
- When palette changes: accent auto-resets to first compatible accent if current accent isn't compatible with new palette.

### Texture
- 2-3 options based on palette mode: None, Dot Grid, Paper (light) / Line Grid (dark).
- When palette changes: texture resets to "none" if current texture isn't compatible.

### What this kills
- VariableBackgroundModal (separate background modal)
- ColorSystemModalMVP (separate color modal)
- UIBlock theme selector (warm/cool/neutral) — palette.temperature handles this
- Contrast validation display — pre-validated combos for curated; live warning for custom

---

## Section-Level Background (section toolbar)

**Default: position-based mapping (automatic).** From newBG.md:
- Header/Footer → neutral (always)
- Hero/CTA → primary (page bookends)
- Content → alternating secondary ↔ neutral

User can override per-section. Section toolbar → "⋯" → "Background":

```
┌─ Section Background ──────────┐
│                                │
│  ● Auto (secondary)  ← current│  position-based default
│  ○ Primary                     │  from current palette
│  ○ Secondary                   │
│  ○ Neutral                     │  one-click swap
│                                │
│  ○ Custom: [______] 🎨        │  hex input + color picker
│    ⚠️ Low text contrast        │  warning, not blocker
│                                │
│  [Reset to auto]               │
└────────────────────────────────┘
```

- **Auto** = position-based. Shows which surface it currently maps to. Reordering updates automatically.
- **Palette surface swap** (primary/secondary/neutral) — one click, stays within curated system. Covers 90% of use cases ("make this section bold" or "make this section subtle").
- **Custom solid color** — hex input for edge cases. Live contrast check for text readability. Warning, not blocker.
- **Gradient builder = killed.** Custom gradients from non-designers almost always look bad. Solid color overrides are fine. Multi-stop gradient editors are a trap.
- **Reset to auto** — returns section to position-based mapping.

---

## Typography (unchanged)

Header dropdown, font pair selection filtered by tone/vibe. Already works well. Independent of palette/accent. No change needed.

---

## Left Panel

```
┌───────────────────────────┐
│ Page Outline               │  ← TOP, always visible
│  [Hero]                    │     clickable buttons
│  [Problem]                 │     click = smooth scroll to section
│  [Features]                │     no viewport indicator (MVP)
│  [Testimonials]            │
│  [CTA]                     │
├───────────────────────────┤
│ ▸ Your Inputs (collapsed)  │  ← collapsed by default
│   Product: "Lessgo"        │     read-only, not editable
│   Goal: Free Trial         │     context while editing
│   Audience: SaaS founders  │
│   Offer: "14-day free..."  │
│   Features: chip list      │
│   Assets: checkmarks       │
│                            │
│   [↻ Change inputs &       │  ← routes back to creation flow
│      regenerate]           │     with pre-filled values
└───────────────────────────┘
```

- **Section outline** at top — most-used = most accessible
- **Inputs accordion** collapsed by default — passive reference, expand when curious
- All inputs **read-only**. Editing inputs = fundamental change = new generation, not editor tweak
- "Change inputs & regenerate" lives inside accordion, contextually near the data
- Collapsible panel (existing behavior preserved)

---

## Regeneration Hierarchy (3 levels for MVP)

| Level | Where | What it does |
|-------|-------|-------------|
| **Global** | Header → "Regen Copy" button | Redo ALL page copy, same inputs/strategy |
| **Section** | Section toolbar → "Regenerate" | Redo one section's copy coherently |
| **Element** | Text toolbar → ✨ icon | Show 5 text variations for one element |

- **Card-level regen**: skipped for MVP. User can regen individual elements within a card (2 clicks). Add later if users consistently regen all elements in a card sequentially.
- **Design regen**: killed entirely. Users co-designed the page; they can change design manually.

---

## Element Interaction

### Click on element → Text toolbar directly (no element toolbar)

```
Text toolbar: [B] [I] [U] [Size ▼] [Color ▼] [Align ▼] ... [✨]
                                                              ↑
                                                        AI variations
```

- Element toolbar is gone. Text toolbar appears immediately on element click.
- ✨ icon in text toolbar triggers variations popover (5 alternatives, pick to replace).
- Mental model: text toolbar = everything you can do to this text (format it OR rewrite it).

---

## Element Management (Add/Remove)

### Toggle modal from section toolbar (not hover crosses on elements)

- Section toolbar has "Manage elements" button → opens modal
- Modal shows ALL possible elements for this section/layout
- Each element has a toggle switch (on = visible, off = hidden)
- **All elements deletable** — no "required" restriction. "Required" is a generation-time concept. Post-generation, user decides.

**Why toggle modal over hover crosses:**
- Eliminates card-cross vs element-cross depth ambiguity
- Canvas stays clean — no hover clutter
- Discovery — users see all available elements including ones not on the page
- Non-destructive feel — toggle off ≠ delete, feels reversible
- Batch operations — toggle multiple elements at once
- One concept to learn — add AND remove in one place

### Cards keep hover crosses

- Cards are array items (feature cards, testimonial cards, FAQ items)
- Hover cross on card = list management (remove one from array)
- This is distinct from structural element management

### Interaction depth:

| Action | Where | Frequency |
|--------|-------|-----------|
| Edit text | Click element → text toolbar | Constant |
| AI rewrite | Text toolbar → ✨ | Frequent |
| Manage elements (add/remove) | Section toolbar → toggle modal | Occasional |
| Delete card from array | Hover cross on card | Occasional |
| Regen section copy | Section toolbar | Rare |
| Regen all copy | Header | Rare |

---

## User Inputs (Post-Taxonomy)

V3 flow user inputs — shown as read-only context:

| Input | Type |
|-------|------|
| oneLiner | text (product description) |
| productName | text (optional) |
| understanding | AI-extracted, user-reviewed: categories[], audiences[], whatItDoes, features[] |
| landingGoal | single choice: waitlist/signup/free-trial/buy/demo/download |
| offer | text (what visitor gets) |
| assetAvailability | checkboxes: testimonials, social proof, concrete results, demo video |

These are **not editable** in the editor. To change → "Change inputs & regenerate" → routes back to creation flow with pre-filled values.

---

## Design System Summary

| What | Generation (curated) | Editor (user control) |
|------|---------------------|----------------------|
| **Palette** | Progressive Q1-Q4 picks from 30 curated | Swap within family (popover) or browse all (modal). Curated only. |
| **Accent** | Auto-selected from palette's compatibleAccents | Quick picks + custom hex input with contrast warning |
| **Texture** | Q4 picks from compatible options | Toggle in Theme popover |
| **Section bg** | Position-based automatic mapping | Override to palette surface or custom solid color with contrast warning |
| **Typography** | Vibe-matched font pair | Dropdown with tone-filtered options |
| **Gradient builder** | N/A | **Killed** — custom gradients from non-designers produce bad results |
| **Custom palette** | N/A | **Not offered** — 3-value coherent set too complex to build manually |
