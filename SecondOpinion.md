 1. [Minor] Card heights don't align
  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │ Starter │  │  Pro    │  │  Ent    │
  │ 5 items │  │ 7 items │  │ 8 items │
  │         │  │         │  │         │
  │ [CTA]   │  │         │  │         │
  └─────────┘  │ [CTA]   │  │         │
               └─────────┘  │ [CTA]   │
                            └─────────┘

  1. → Fix options:
    - Set min-height on cards to match tallest
    - OR align CTAs at bottom with mt-auto in flex column
    - OR accept ragged bottom (current - not terrible)
  2. [Minor] Middle card could have stronger highlight
    - Currently: only badge + filled CTA differentiate
    - Optional: subtle background tint or border accent