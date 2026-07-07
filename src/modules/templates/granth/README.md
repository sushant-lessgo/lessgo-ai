# granth — bespoke §13 Writer-vertical template (Hindi literary)

Bespoke template for the **Writer** audience — Hindi literary profile sites (author / poet /
essayist), Devanagari-first. Default template for the `writer` audienceType. Registered +
renderable but NOT in the onboarding picker; writer v1 has **no** generation store /
strategy / onboarding route — projects are seeded white-glove
(`hooks/editStore/granthSeed.ts`, dev route `/dev/seed-writer`). See `../README.md` for the
folder anatomy + dual-renderer rules; only the quirk lives here.

## `.core.tsx` single-source pattern (the pilot for this pattern)

Each of the 6 blocks is a **trio**, not a pair:

- `<Block>.core.tsx` — ALL markup/layout; pure + server-safe; renders only through injected
  primitives `E`. No `'use client'`, no hooks/stores, no Editable/edit imports.
- `<Block>.tsx` (edit, `'use client'`, ~10 lines) — `useGranthBlock` store wiring +
  `GranthEditProvider`, injects `editPrimitives`.
- `<Block>.published.tsx` (server-safe, ~10 lines) — flat props, injects
  `makePublishedPrimitives()`.

Core purity is **mandatory and test-enforced** by `granth/coreParity.test.ts`: it statically
scans each `*.core.tsx` for forbidden tokens (`useEditStore`, `useGranthBlock`,
`editPrimitives`, `GranthEditable`, `useState(`, `useEffect(`, a `'use client'` directive)
and renders each core server-side with published primitives. If a block ever needs
edit-only structure, pair-clone THAT block instead of leaking a hook into its core.

## Variant

Default variant `granth` (serif-led, Tiro Devanagari); `adhunik` = sans-led (Mukta) alt.
