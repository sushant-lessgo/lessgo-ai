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
- "Regenerate Design" = **removed**. Users co-designed the page; nuking layout is destructive, not helpful.

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

### Modals archived by Theme Popover

All 5 existing background/color modals are replaced. **Archive to `archive/editor-v1/`**, not deleted.

| Modal | Why archived |
|-------|-------------|
| `VariableBackgroundModal` | Replaced by palette swatches in Theme popover |
| `ColorSystemModalMVP` | Replaced by accent row in Theme popover |
| `BackgroundSystemModal` | Full variant of VariableBackgroundModal, same replacement |
| `ColorSystemModal` (full, 28-token expert) | Curated palette system pre-validates all combos — manual token tuning unnecessary. WCAG replaced by live contrast warning on custom hex. |
| `ResponsiveBackgroundModal` | Mobile variant of BackgroundSystemModal, same replacement |

Useful features preserved differently:
- WCAG contrast validation → live warning on custom hex/accent in Theme popover
- UIBlock theme (warm/cool/neutral) → `palette.temperature` handles automatically
- Quality score → irrelevant, all 30 palettes are pre-curated

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
- **Gradient builder = removed.** Custom gradients from non-designers almost always look bad. Solid color overrides are fine. Multi-stop gradient editors are a trap.
- **Reset to auto** — returns section to position-based mapping.

**Archives**: `SectionBackgroundModal` → `archive/editor-v1/`. Replaced by the simplified popover above. Gradient builder removed.

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

**Archives**: Current LeftPanel.tsx content (taxonomy fields, hidden AI fields, field editing modals, regeneration controls tied to field changes) → `archive/editor-v1/`. Replaced by outline + read-only inputs accordion.

---

## Regeneration Hierarchy (3 levels for MVP)

| Level | Where | What it does |
|-------|-------|-------------|
| **Global** | Header → "Regen Copy" button | Redo ALL page copy, same inputs/strategy |
| **Section** | Section toolbar → "Regenerate" | Redo one section's copy coherently |
| **Element** | TextToolbarMVP → ✨ icon | Show 5 text variations for one element |

- **Card-level regen**: skipped for MVP. User can regen individual elements within a card (2 clicks). Add later if users consistently regen all elements in a card sequentially.
- **Design regen**: removed. Users co-designed the page; they can change design manually.
- **Card repositioning**: not in MVP. AI orders cards reasonably. Users can edit card text content to swap what cards say.

---

## Toolbar System

### What changes and what doesn't

**IMPORTANT**: Only the text-element interaction changes. Button, Image, and Form toolbars are completely untouched.

| Element type | Current flow | New flow |
|-------------|-------------|----------|
| **Text** (headline, description, subheadline, body text) | Click → ElementToolbar → click "Edit Text" → TextToolbarMVP | Click → **TextToolbarMVP directly** (skip ElementToolbar) |
| **Button/CTA** | Click → ElementToolbar (with Button Settings, Regenerate, etc.) | **No change** |
| **Image** | Click → ImageToolbar | **No change** |
| **Form** | Click → FormToolbar | **No change** |

### ElementToolbar — NOT fully killed

ElementToolbar is **bypassed for text-type elements only**. It remains for button/CTA elements where it provides:
- Button Settings (link URL, form connection, icons, CTA type)
- Regenerate (AI variations)
- Style, Delete

**Text-type elements** = keys containing: `text`, `headline`, `subhead`, `description`, `body`. These skip ElementToolbar and go directly to TextToolbarMVP.

**Button-type elements** = keys containing: `cta`, `button`. These still show ElementToolbar as before.

### TextToolbarMVP — add ✨ AI variations

Current TextToolbarMVP (`TextToolbarMVP.tsx`) has: Bold, Italic, Underline, Alignment, Font Size, Text Color. **No AI functionality currently.**

Add:
```
TextToolbarMVP: [B] [I] [U] [Size ▼] [Color ▼] [Align ▼] ... [✨]
                                                                 ↑
                                                           AI variations
```

- ✨ icon = **new button** in TextToolbarMVP
- Wire to existing `regenerateElement(sectionId, elementKey, 5)` store action (same logic ElementToolbar's "Regenerate" uses)
- Shows 5 text variations, user picks one to replace
- The store action and API endpoint (`/api/regenerate-element`) already exist — dev adds a new entry point, not new logic

### Element Duplicate — not offered

Current "Duplicate" in ElementToolbar is a **non-functional stub** (`console.warn('Advanced action not implemented in V2')`). Not preserved. If needed later, natural home is the element toggle modal.

### FloatingToolbars.tsx — priority chain update

Current priority chain in `FloatingToolbars.tsx`:
```
TextToolbarMVP → ImageToolbar → FormToolbar → ElementToolbar → SectionToolbar
```

**Chain stays the same.** ElementToolbar is still in the chain for button/CTA elements.

**What changes**: When user clicks a **text-type element**, set `textEditingElement` immediately on click (instead of requiring "Edit Text" button in ElementToolbar). This makes TextToolbarMVP take priority automatically via existing priority logic.

**Files to modify:**
- Selection/click handler logic — auto-set `textEditingElement` for text-type elements
- `useSelectionPriority.ts` — may need text-type auto-detection to escalate priority
- `TextToolbarMVP.tsx` — add ✨ button wired to `regenerateElement`
- `FloatingToolbars.tsx` — likely no changes needed, chain unchanged

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
| Edit text | Click text element → TextToolbarMVP | Constant |
| AI rewrite | TextToolbarMVP → ✨ | Frequent |
| Button config | Click CTA → ElementToolbar → Button Settings | Occasional |
| Image edit | Click image → ImageToolbar | Occasional |
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

**Archives**: TaxonomyModalManager, all field editing modals (MarketCategoryModal, TargetAudienceModal, etc.), field change detection, onboarding field sync logic → `archive/editor-v1/`.

---

## Design System Summary

| What | Generation (curated) | Editor (user control) |
|------|---------------------|----------------------|
| **Palette** | Progressive Q1-Q4 picks from 30 curated | Swap within family (popover) or browse all (modal). Curated only. |
| **Accent** | Auto-selected from palette's compatibleAccents | Quick picks + custom hex input with contrast warning |
| **Texture** | Q4 picks from compatible options | Toggle in Theme popover |
| **Section bg** | Position-based automatic mapping | Override to palette surface or custom solid color with contrast warning |
| **Typography** | Vibe-matched font pair | Dropdown with tone-filtered options |
| **Gradient builder** | N/A | **Removed** — custom gradients from non-designers produce bad results |
| **Custom palette** | N/A | **Not offered** — 3-value coherent set too complex to build manually |

---

## Archive List

All retired components go to `archive/editor-v1/`. Nothing is deleted.

| Component | Replaced by |
|-----------|------------|
| `VariableBackgroundModal` | Theme popover |
| `ColorSystemModalMVP` | Theme popover |
| `BackgroundSystemModal` | Theme popover |
| `ColorSystemModal` (full 28-token) | Theme popover |
| `ResponsiveBackgroundModal` | Theme popover |
| `SectionBackgroundModal` (gradient builder) | Simplified section bg popover (palette surface + custom solid only) |
| `LeftPanel.tsx` content (taxonomy fields, field modals, regen controls) | Section outline + read-only inputs accordion |
| `TaxonomyModalManager` + all field modals | Dead with taxonomy |
| ElementToolbar **for text elements only** | TextToolbarMVP shown directly on click |
| Element "Duplicate" action | Not offered (was a non-functional stub) |
| Design regeneration | Not offered |
| Card-level regeneration | Not in MVP |
| Card repositioning | Not in MVP |
