# New Editor UX Spec

## Architecture: Header vs Left Panel

**Mental model:**
- **Header** = change the page (global design + actions)
- **Left Panel** = navigate & reference (passive)

---

## Edit Header

```
┌──────────────────────────────────────────────────────────────────────┐
│ [🎨 Background] [🌈 Color] [Aa Typography]   [↶↷] [✨Regen Copy] [↻Reset] [👁Preview] │
│ ← global design system                        global actions →       │
└──────────────────────────────────────────────────────────────────────┘
```

- LEFT: Background, Color, Typography (unchanged)
- RIGHT: Undo/Redo, **Regenerate Copy** (new), Reset, Preview
- "Regenerate Copy" = redo all page copy with same inputs/strategy. Global action, lives with Reset/Preview.
- "Regenerate Design" = **killed**. Users co-designed the page; nuking layout is destructive, not helpful.

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
- **Design regen**: killed entirely.

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
