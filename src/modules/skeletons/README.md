# `src/modules/skeletons/` — skeleton layer

A **skeleton** owns ALL markup for a family of sections as single-source
`.core.tsx` blocks (granth pattern), plus a per-section layout library, bounded
token contracts, and the two user-facing token surfaces. A **skin** (a normal
`templateId` under `src/modules/templates/<id>/`) supplies ONLY tokens + palettes +
selections and ZERO markup, and registers through the existing `TemplateModule`
registry via the skeleton's factory. This inverts the classic per-template model
(each template hand-wrote its own blocks) so a new look is a data-only skin.

Introduced by the **work** vertical (D1). See `docs/task/work-skeleton.plan.md` and
`docs/tracks/templatePlan.md` (T9).

## Layer map — skeleton vs skin

```
src/modules/skeletons/
  ids.ts            skeletonBackedTemplateIds (pure data; which templateIds are skeleton-backed)
  styleTokens.ts    USER style-token vocabulary + serializer (--u-*)  ← token surface #2
  work/             the work skeleton (markup + contracts)
    tokenContract.ts  SKIN token contract: --wk-* names, bounds, assertSkinTokens  ← token surface #1
    skin.ts           WorkSkinDef type + makeWorkSkeletonModule(skin) factory + buildWorkStylesheet
    sectionRules.ts   surface vocabulary + default section→surface map
    ThemeInjector.tsx client token injector (factory, parameterized by skin)
    SSRTokens.tsx     server-safe token emitter (factory) — byte-identical CSS to ThemeInjector
    resolveWorkBlock.ts variant-aware dispatch (scale-09 SectionEntry) + placeholder fallback
    WorkPlaceholderBlock.tsx  fallback for unbuilt sections
    hooks/useWorkBlock.ts     store hook (delegates to shared useTemplateBlock)
    blocks/
      primitives.ts        TYPES-ONLY contract (Txt/Img/Link/List + Logo/Nav)
      editPrimitives.tsx   'use client' edit primitives (contentEditable, attribute-driven)
      publishedPrimitives.tsx  server-safe static primitives
      <Section>/           block cores land in phases 3/4/6/7

src/modules/templates/<skinId>/   a SKIN: index.ts + skin.ts (data only, zero markup — phase 3+)
```

## The two token surfaces

1. **Skin tokens** (`--wk-*`, compile-time, bounded) — `work/tokenContract.ts`.
   A skin's `tokens` are validated by `assertSkinTokens` (throws a full violation
   list; out-of-range fails loud). Emitted as `:root{--wk-*}` + `[data-surface]`
   rules by the skeleton's injectors.
2. **User style tokens** (`--u-*`, runtime, per-section) — `styleTokens.ts`. The
   "Design ▾" vocabulary (`background · spacingY · corners · border · shadow ·
   opacity · headerMode`), every value a designed coordinate (enum step, no free
   numbers). Persisted at `Project.themeValues.styleTokens[sectionId]`; serialized
   to `[data-sid]{--u-*}` blocks; block cores consume `var(--u-*, <skeleton
   default>)`. `headerMode` drives a `data-wk-header-mode` attribute (phase 6), not
   a CSS var. Threaded into the injectors via an OPTIONAL `styleTokens` prop (like
   `knobs`) at the 3 renderer call-sites — byte-neutral for every other template.

## Invariants (the traps)

- **Dual-renderer parity:** `ThemeInjector.tsx` (`'use client'`) and
  `SSRTokens.tsx` (server-safe) emit BYTE-IDENTICAL token CSS for the same inputs —
  both call `buildWorkStylesheet` (plain `skin.ts`). Never let them diverge.
- **Client/published firewall:** `blocks/primitives.ts` is TYPES ONLY and imports
  nothing from the edit/published impls. `publishedPrimitives.tsx` +
  `SSRTokens.tsx` are server-safe and must NEVER import a VALUE from a `'use
  client'` module. `editPrimitives.tsx` is `'use client'`.
- **Pure-data leaves:** `ids.ts`, `styleTokens.ts`, `tokenContract.ts`,
  `sectionRules.ts` are pure data/logic (no React, no template-module imports) — so
  nothing here breaks the dispatch firewall.
- **Granth pattern:** layout lives ONCE in a `.core.tsx` rendering via injected
  primitives `E`; the edit/published wrappers are ~10 lines each. See
  `src/modules/templates/granth/` for the reference trio.
