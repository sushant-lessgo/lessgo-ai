# `src/modules/templates/` — template skins + registry

Agent-oriented reference for the **template tier** of Lessgo. Read the repo-root
`CLAUDE.md` first for the whole-app picture; this file goes deep on this folder only.

---

## 1. What a template IS

A **template is a skin** over an audience's existing **content contract**. It supplies
tokens, palettes, variants, section-surface rules, and one block component per section
type — and NOTHING else. A template does **not**:

- change copy generation, the element schema, or the section list;
- own the content shape (that belongs to the audience — `product` / `service` / `writer`);
- get statically imported anywhere (see the firewall, §3).

Swapping a project's `templateId` re-renders the *same stored content* through a different
skin. This is why dispatch is keyed by **section type**, not by stored layout name (§4).

## 2. The 3-tier model

A landing page = three orthogonal inputs (repo-root `CLAUDE.md` has the canonical table):

| Tier | Values | Chosen at |
|------|--------|-----------|
| `audienceType` | `product`, `service`, `writer`, (`ecommerce` reserved) | persona / route |
| `templateId` | this folder — one dir per id | picker (service) / param or default (product) / seeded (bespoke) |
| `variantId` + `paletteId` | token rescale + accent | picker or template default |

Canonical type contracts live **outside** this folder: `src/types/service.ts`
(audienceTypes, templateIds, `defaultVariantForTemplate`, `usesTemplateModule`, the
persona→audience map) and `src/types/product.ts` (product palettes/variants). The
`TemplateModule` plug contract is `src/types/template.ts`.

## 3. The registry — async dynamic-import "dispatch firewall"

`registry.ts` maps each `templateId` → a **loader** that `import()`s its module barrel.
Nothing here is a *static* import of a template; the only way in is the async loader. This
keeps every template's code in its own chunk and out of the main/product bundle.

- `preloadTemplate(id)` — await-loads and **memoizes** the module (module-scope `cache`).
- `getLoadedTemplate(id)` — synchronous read of the already-cached module (or `undefined`).
- **Callers MUST `preloadTemplate()` before the first synchronous `resolveBlock`.**
  Client render does this once per page via `useTemplateReady.ts` (`useTemplateModule`) —
  a single-boundary preload flag, no per-block `React.lazy`/Suspense flicker.

Because barrels are `preload`ed from **server components**, an `index.ts` must stay
server-importable: it may re-export a `'use client'` `ThemeInjector` (referenced, never
invoked, on the server — React tolerates this), but it must **not** re-export bare
client-only helpers (hooks, Editable, editPrimitives). Those are consumed by blocks via
relative imports only. See the `// NOTE:` blocks in each `index.ts`.

## 4. The `TemplateModule` contract (`src/types/template.ts`)

Every loaded module exposes exactly this surface:

| Member | Purpose |
|--------|---------|
| `resolveBlock(blockType, mode)` | `blockType` is the **section type** (`hero`, `features`, …), NOT the stored layout name. `mode` is `'edit' \| 'published'`. Returns the block component (or a placeholder). |
| `ThemeInjector` | Client-side (`'use client'`) CSS-var + font + `data-palette` [+ `data-variant`] [+ `data-mood`] injector. |
| `SSRTokens` | Server-safe token emitter for published/static export (same axes, no hooks). |
| `getSurfaceForSection(sectionType)` | Section type → surface token for this template's alternation. The renderer writes it under the neutral `data-surface` attribute (shared attr, per-template values — no collision). |
| `defaultPaletteId` | Palette used when none persisted. |
| `variants` / `defaultVariantId` | Selectable token rescales; first entry is the default. |
| `paletteImageKeywords?` | Optional `paletteId → phrase` map for editor image search. |

`ThemeInjector` / `SSRTokens` take optional `variantId` and `mood`: palette-only templates
ignore `variantId`; **only vestria consumes `mood`** (§7), everyone else ignores the prop.

## 5. Per-template folder anatomy

```
<templateId>/
  index.ts              barrel = the TemplateModule surface (loaded by registry)
  tokens.ts             base CSS-var tokens (neutrals, type, spacing, rhythm)
  palettes.ts           accent palettes ([data-palette] overrides) + default
  variants.ts           token-rescale variants (some templates fold these into tokens.ts)
  sectionRules.ts       section type → surface band + getSurfaceForSection()
  ThemeInjector.tsx     'use client' — injects vars/fonts/attributes for edit canvas
  resolve<X>Block.ts    section-type → { edit, published } component map
  imageKeywords.ts      PALETTE_IMAGE_KEYWORDS + get<X>ImageQuery
  paletteSelection.ts   inferDefaultPalette() (business-context → palette) [most templates]
  <X>PlaceholderBlock.tsx   fallback for unknown section types
  components/           <X>Editable, <X>SSRTokens, LinkTargetPopover, …
  hooks/                use<X>Block (store wiring for edit blocks)
  blocks/<Section>/     the block pair(s) — see §6
```

Naming is per-template (`meridianVariants`, `defaultHearthPalette`, …); the registry maps
those names to the generic contract. Two service templates keep the legacy filename
`resolveServiceBlock.ts` (hearth, lex, surge); others use `resolve<Name>Block.ts`.

## 6. The DUAL-RENDERER rule (the #1 trap)

Every block is rendered by **one of two renderers** and therefore exists as a **pair**:

- **Edit:** `LandingPageRenderer` → `<Block>.tsx` (`'use client'`, hooks, contentEditable).
- **Published:** `LandingPagePublishedRenderer` → `<Block>.published.tsx` (server-safe,
  flat props, `renderToStaticMarkup`).

**If the two diverge, a change "looks right in the editor but wrong when published."** When
touching any block, update BOTH and keep layout/CSS identical.

### Single-source `.core.tsx` pattern (granth + vestria)

`granth` and `vestria` avoid pair-drift with a **third file**: `<Block>.core.tsx` holds ALL
markup/layout and renders only through **injected primitives** (`E`). The thin wrappers pick
the primitive set:

- `<Block>.tsx` (edit, `'use client'`) → wires the store, injects `editPrimitives`.
- `<Block>.published.tsx` (server-safe) → injects `makePublishedPrimitives()`.

A core MUST be pure: no `'use client'`, no hooks/stores, no Editable/edit imports. This is
**enforced by a test** — `granth/coreParity.test.ts` and `vestria/coreParity.test.ts`
statically scan each core for forbidden tokens and render it server-side. The older
templates (hearth, lex, surge, meridian, techpremium, lumen) use the plain `.tsx` +
`.published.tsx` pair with no core.

## 7. Registered templates

Facts below are verified against `registry.ts`, `src/types/service.ts`,
`.../service/[token]/components/fields/templateCatalog.ts`, and each template's source.

| id | audience | purpose / customer | availability | notable |
|----|----------|--------------------|--------------|---------|
| **hearth** | service | Warm editorial; default service template | Onboarding picker | default variant `classic` |
| **lex** | service | Trust / professional, serif authority | Onboarding picker | variant `statesman` |
| **surge** | service | Growth / performance marketing | Onboarding picker | 7 shared + 4 Surge-only delta sections |
| **meridian** | product | Modern tech, hairline/mono; default product template | Not in a picker (product has none) | variant axis `developer`/`marketing`/`light` |
| **techpremium** | product | Industrial IoT (hardware-founder persona) | Not in a picker | pilot-locked (single palette/variant) |
| **lumen** | service | Bespoke §13 photography (Kundius) | Registered, **NOT** in picker; seeded white-glove | **bilingual EN/NL twin-fields**, brass-only palette — see `lumen/README.md` |
| **vestria** | product | GA B2B manufacturing / trade lead-gen (pilot: Golden Shadow) | Registered; selected via onboarding `?template=vestria` or `manufacturer` persona default | **mood axis** (bone/slate) + `.core.tsx` — see `vestria/README.md` |
| **granth** | writer | Bespoke §13 Hindi-literary profile sites | Registered, **NOT** in picker; seeded white-glove; writer v1 has no generation store/route | `.core.tsx` single-source — see `granth/README.md` |

`usesTemplateModule(audienceType, templateId)` (`src/types/service.ts`) is the render gate:
`service` and `writer` always render through a module; `product` does ONLY for `meridian`,
`techpremium`, `vestria` (legacy product drafts with `templateId=null` still use the 47
legacy UIBlocks). The service onboarding picker (`templateCatalog.ts`) lists only
`hearth`, `lex`, `surge`; every other id is intentionally unselectable.

## 8. Pitfalls

- **Published/client boundary.** A `*.published.tsx` (or any published/server code) must
  NOT `import { X }` a **named value** from a `'use client'` sibling — it resolves to a
  broken client reference (→ 500 "F is not a function", or an empty `<style>` = unstyled
  page). Both are invisible to markup-parity audits. Shared helpers/CSS strings must live
  in a plain `.ts` (non-`'use client'`) module. Default-*component* imports across the
  boundary are the one legitimate case. Enforced by `publishedClientBoundary.test.ts`.
- **Two-identifier discipline: section type vs LayoutName.** `resolveBlock` dispatches by
  **section type** (lowercase: `hero`, `features`); the stored **layout name** (PascalCase,
  e.g. `TerminalHero`) is kept in saved content but NOT the dispatch key. Valid only while
  it's one block per section per template; if multi-block-per-section ever lands, revert to
  name-keyed dispatch (the layout name is retained precisely for this).
- **Dual-renderer drift** (§6) — the single most common "works in editor, breaks on
  publish" bug. Keep the pair (or the `.core`) in lockstep.
- **Barrel must stay server-importable** (§3) — don't re-export bare client helpers.

## 9. Shared + top-level files

- `registry.ts` — the dynamic-import registry + `preloadTemplate` / `getLoadedTemplate`.
- `useTemplateReady.ts` — `'use client'` single-boundary preload hook for the editor.
- `CriticalFontPreload.tsx` — server component; preloads the LCP hero-headline face per
  `(templateId, variantId)`, additive to the `p/layout` base preloads.
- `shared/blog/` — `BlogIndexBlock` / `BlogPostBodyBlock`: server-safe blocks reused by
  multiple templates (same component for edit + published; blog pages never hit the canvas).
- `shared/elementExclusion.ts` — `'use client'` `useIsElementExcluded` used by every
  template's Editable wrapper to hide toolbar-excluded optional elements in edit (parity
  with publish).
- `__tests__/`, `paletteSelection.regression.test.ts`, `blogRegistration.test.ts`,
  `publishedClientBoundary.test.ts`, plus each template's `registration.test.ts` /
  `coreParity.test.ts` — the regression net. Run `npm run test:run`.

## 10. Adding a template

Do **not** improvise — follow `.claude/skills/new-template/SKILL.md`. It covers cloning an
existing template, the module contract, dual-renderer parity, the two-identifier discipline,
fonts, interactive behaviors, wiring into the registry/picker, and the bespoke (§13) path
(register but skip the picker; set `templateId` on the project by hand).
