# Adding a New Template — Dev Agent Guide

> **Audience:** a dev agent adding a brand-new visual **template** (the middle tier of
> `audienceType → templateId → variant+palette`) for an **existing audience type**
> (`product` or `service`). This is how **Lex** was added under `service` (a clone of Hearth).
> **Out of scope:** standing up a new *audience type* (new onboarding flow + store + copy
> prompts). See the final appendix for a pointer.

> **Golden rule:** a new template is a **skin**. It supplies new *tokens, palettes, variants,
> and block components* that **consume the audience's existing content contract**. It does
> **NOT** change copy generation, the element schema, the strategy, or the section list.
> If you find yourself editing `src/modules/audience/**`, stop — you're out of scope (see Appendix B).

---

## 0. Mental model

A landing page is rendered from three orthogonal inputs:

| Tier | What it is | Where it's chosen |
|---|---|---|
| `audienceType` | `product` \| `service` \| `ecommerce` | persona at `/onboarding` |
| `templateId` | the visual system (e.g. `meridian`, `hearth`, `lex`, **your new one**) | onboarding picker (service) / locked (product pilot) |
| `palette` + `variant` | accent colors + font/spacing variation **within** a template | picker, or template defaults |

A **template module** lives at `src/modules/templates/<id>/`. It exposes a fixed contract
(below) that the global **registry** loads lazily. The renderers are **generic** — they call
`tmpl.resolveBlock(sectionType, mode)`, `tmpl.ThemeInjector`, `tmpl.SSRTokens`,
`tmpl.getSurfaceForSection(...)` — so once your module satisfies the contract and you register
it, edit / preview / published / static-export all "just work."

**Three render surfaces, two component variants per block:**
- **Edit** (`/edit/[token]`) and **Preview** (`/preview/[token]`) → `LandingPageRenderer` → your block's **`.tsx`** (client, editable).
- **Published** (`/p/[slug]`) and **static export** → `LandingPagePublishedRenderer` → your block's **`.published.tsx`** (server-safe, no hooks).
- **Dual-renderer parity is the #1 trap.** Every block is a *pair*; they must render the same
  layout/colors. A mismatch = "looks right in editor, wrong when published" (or vice-versa).

---

## 1. The designer handoff: a single static HTML file

A template starts as one self-contained HTML file from the designer, e.g.
`Folio - Editorial Minimalist.html` (compare `Meridian - Modern Tech.html`). It encodes the
**whole design system** and maps almost 1:1 onto the module files. Read its `<head>` first.

```html
<html lang="en" data-palette="bone" data-variant="mixed">   <!-- the two configurable axes -->
<link href="...fonts.googleapis.com/css2?family=Source+Serif+4...&family=Manrope...">  <!-- fonts -->
<style>
:root {
  --accent: ...; --accent-deep: ...; --accent-ink: ...;     /* PALETTE axis  → palettes.ts */
  --paper: ...; --paper-1: ...; --paper-2: ...;             /* SURFACES      → sectionRules.ts */
  --ink: ...; --ink-2: ...; --ink-3: ...;                   /* base tokens   → tokens.ts */
  --rule: ...; --font-display: ...; --font-body: ...;       /* base tokens   → tokens.ts */
  --s-1..--s-10; --r-sm..--r-xl; --sec-pad-y; --max-w;      /* base tokens   → tokens.ts */
}
[data-variant="editorial"] { --font-display: ...; --r-md: 0; }   /* VARIANT axis → variants.ts */
[data-palette="forest"]    { --accent: ...; --accent-deep: ...; } /* PALETTE blocks → palettes.ts */
[data-surface="paper-1"]   { background: var(--paper-1); }        /* surfaces → tokens.ts serialize */
</style>
...
<section class="hero">...</section>   <!-- each SECTION → one block pair (.tsx + .published.tsx) -->
```

**Mapping cheat-sheet:**

| In the HTML | Goes to |
|---|---|
| `:root { ... }` (the non-accent vars) | `tokens.ts` → `serializeBaseTokens()` |
| `[data-palette="x"] { --accent... }` blocks | `palettes.ts` → `serializePaletteOverrides()` + palette id union in `types/service.ts` |
| `[data-variant="x"] { ... }` blocks | `tokens.ts`/`variants.ts` → `serializeVariantOverrides()` |
| `[data-surface="x"] { background... }` | emitted inside `serializeBaseTokens()`; section→surface map in `sectionRules.ts` |
| `[data-palette] em { ... }` accent rule | emitted inside `serializeBaseTokens()` |
| `<link href="fonts.googleapis...">` | self-host into `fonts-self-hosted.css` (§7) |
| each `<section>` | a block pair under `blocks/<Section>/` |

> The design file often has a "spec doc" reading column at the top (`.doc*` classes) explaining
> the system — that is **documentation, not a section**. The real sections come after it.

---

## 2. Decide name + audience, then clone the closest template

1. **Pick an id** (lowercase, kebab-free): e.g. `folio`. Used as the dir name, registry key, and `templateId`.
2. **Pick the audience** it belongs to: `service` or `product`. (Your scope = existing audience.)
3. **Clone the closest existing template of that audience** and rename. This is the fastest,
   lowest-miss path (Lex was a clone of Hearth):
   - **service** → clone `src/modules/templates/hearth/`
   - **product** → clone `src/modules/templates/meridian/`
   ```bash
   cp -r src/modules/templates/hearth src/modules/templates/folio
   ```
4. Inside the clone, rename every `Hearth*`/`hearth*` identifier and file to `Folio*`/`folio*`
   (ThemeInjector, SSRTokens, tokens, palettes, hook, editable wrapper, resolver). Keep the
   **structure and the generic export names** the registry expects (§6).

> **Required block set (your audience's full section list).** You must implement **every**
> section type the audience can emit — confirm the authoritative list from the audience's
> layout-name map, **not** by guessing:
> - service → `PILOT_LAYOUT_NAMES` in `src/modules/audience/service/elementSchema.ts`
> - product → `MERIDIAN_LAYOUT_NAMES` in `src/modules/audience/product/elementSchema.ts`
> Every key there (header, hero, services/features, testimonials, packages/pricing, cta, footer, …)
> needs an edit `.tsx` **and** a `.published.tsx`. Missing ones fall back to a placeholder block on
> real pages — not acceptable (you chose full coverage).

---

## 3. The module files (translate the HTML → module)

Paths below are relative to `src/modules/templates/folio/`.

### 3a. `tokens.ts` — base tokens + surface rules + accent-em
Translate `:root` (minus the `--accent*` palette vars) into a typed token object and a
serializer. Mirror the cloned template exactly; only values change.
- Export: `folioBaseTokens`, `type FolioBaseTokens`, `serializeBaseTokens()`,
  `folioVariants`, `defaultFolioVariant`, `serializeVariantOverrides()`.
- `serializeBaseTokens()` must emit, in this order:
  1. `:root{ --font-display:…; --font-body:…; --ink:…; --s-1:…; --sec-pad-y:…; … }`
  2. the `[data-surface="…"]{ background:var(--…); }` rules (one per surface tone)
  3. the accent-em convention: `[data-palette] em{ font-style:…; color:var(--accent-…); }`
- `serializeVariantOverrides()` emits one `[data-variant="x"]{ … }` block **per non-default
  variant** (omit the default — it's the `:root` baseline). Translate each `[data-variant]`
  block from the HTML.

### 3b. `palettes.ts` — the accent axis
Translate each `[data-palette="x"]{ --accent…; --accent-deep…; --accent-wash…; }` block.
- Export: a `PaletteConfig`-shaped record (`folioPaletteConfigs`), `defaultFolioPalette`,
  `pilotEnabledPalettes` (which palettes the picker offers — usually all), and
  `serializePaletteOverrides()` which emits `[data-palette="x"]{ --accent:…; … }` per palette.
- The **palette id union/type lives in `types/service.ts`**, not here (see §5). `palettes.ts`
  imports `folioPalettes`/`FolioPalette` from `@/types/service`.

### 3c. `sectionRules.ts` — section → surface
- Export `type FolioSurface` (the surface tones, e.g. `'paper' | 'paper-1' | 'paper-2'`),
  `folioSectionSurfaces: Record<string, FolioSurface>` (section type → surface, the alternation
  rhythm), and `getSurfaceForSection(sectionType): FolioSurface` (lookup + sane fallback).
- The published renderer wraps each section in `<div data-surface={getSurfaceForSection(type)}>`
  automatically — so **blocks must NOT paint their own full-bleed section background**; let the
  surface wrapper do it (avoids edit/published divergence).

### 3d. `ThemeInjector.tsx` (client) + `components/FolioSSRTokens.tsx` (server)
Both inject the **same** stylesheet
`serializeBaseTokens() + serializePaletteOverrides() + serializeVariantOverrides()` and set
`data-palette`/`data-variant`:
- `ThemeInjector` ('use client'): in a `useEffect`, `ensureStyleTag()` (`<style id="folio-theme">`),
  then `document.documentElement.dataset.palette/variant = …`; clean up the data attrs on unmount.
- `FolioSSRTokens` (server, no 'use client'): renders `<style id="folio-theme" dangerouslySetInnerHTML=…>`
  + `<div data-palette=… data-variant=…>{children}</div>`.
- **No font `<link>` here** — fonts are global and self-hosted (§7).

### 3e. `components/FolioEditable.tsx` + `components/FolioAddImageOverlay.tsx` + `hooks/useFolioBlock.ts`
Clone + rename from the source template; these are near-identical across templates:
- `FolioEditable` — the inline-text wrapper. Props: `value, mode, sectionId, elementKey, as,
  onSave, className, style, placeholder, enterBehavior, multiline, isButton`. In edit mode with
  `isButton`, single click selects (so the element toolbar / "Button Settings" appears), double
  click edits text. In non-edit mode it renders static HTML (preserves `<em>`).
- `useFolioBlock<T>({ sectionId })` → `{ sectionId, mode, blockContent, handleContentUpdate,
  handleCollectionUpdate }`. It reads `content[sectionId]` and runs
  `extractLayoutContent(elements, getSchemaDefaults(layout), …)` — **this is how a block gets the
  audience's content**. (Generic; just renamed.)
- `FolioAddImageOverlay` — the "Add image" affordance over empty image slots (`pointerEvents:none`).

### 3f. `blocks/<Section>/` — the block pairs (the bulk of the work)
For **every** section type in the audience layout map (§2), create
`blocks/<Section>/<ComponentName>.tsx` and `<ComponentName>.published.tsx`.

**Edit block (`.tsx`, 'use client') rules:**
- `export default function <Name>({ sectionId })`. Get content via `useFolioBlock<TContent>({ sectionId })`.
- Wrap each text element in `<FolioEditable elementKey="…" value={blockContent.…} onSave={…}>`.
- **Consume the audience's element keys exactly** (§4) — `headline`, `cta_text`,
  `secondary_cta_text`, collections like `services[]` / `packages[]` / `testimonials[]`
  (`{ id, … }`), etc. If the generator doesn't produce a field, your block won't get it.
- CTAs: pass `isButton` + the correct `elementKey` (`cta_text`, `secondary_cta_text`,
  `signin_text`, tier `…_cta_${id}`) so Button Settings can target them.
- Collections: keep stable `id`s; mirror the add/remove/update pattern from the cloned block.

**Published block (`.published.tsx`, server-safe — NO hooks, NO 'use client') rules:**
- `export default function <Name>Published(props)`. Content arrives as **flat props**
  (`headline`, `cta_text`, `services`, …) plus `content`, `sectionId`, `publishedPageId`,
  `pageOwnerId` (the renderer passes these to every block).
- **Resolve CTA hrefs from buttonConfig**, do not hardcode `#cta`. Reuse the shared util:
  ```ts
  import { resolveCtaHref } from '@/utils/resolveCtaHref';
  const md = props.content?.[props.sectionId]?.elementMetadata;
  const ctaHref = resolveCtaHref(md?.cta_text?.buttonConfig, props.content?.forms, '#cta');
  ```
  (Per-tier CTAs: key `tiers_cta_${id}` / `packages_cta_${id}`.)
- **Parity:** same CSS/markup as the edit block. Put the block's `<style>` once (string constant)
  and reuse it in both files, or keep them byte-aligned.
- **No collapsing section margins** — use padding inside the surface, not `margin: Npx 0` on the
  outer element (margin collapses through the `data-surface` wrapper and exposes the page bg).

### 3g. `resolveFolioBlock.ts` + the `resolveBlock` export
Map **section type (lowercase) → `{ edit, published }`** component pair:
```ts
const FOLIO_BLOCK_REGISTRY: Record<string, { edit: ComponentType<any>; published: ComponentType<any> }> = {
  header: { edit: FolioNav, published: FolioNavPublished },
  hero:   { edit: FolioHero, published: FolioHeroPublished },
  // …every section type in the audience layout map…
};
export function resolveFolioBlock(sectionType: string, mode: 'edit' | 'published') { … }  // fallback → placeholder
```
> Note: for template projects the renderer dispatches by **section type + templateId** (via
> `resolveBlock`), **not** by the stored `layout` name. The `layout` name is used only for the
> audience content schema/defaults. So your registry is keyed by section type.

### 3h. `index.ts` — the module barrel (exact export names the registry consumes)
Re-export with the **generic alias names** the registry loader maps (§6). At minimum:
```ts
export { FolioThemeInjector as ThemeInjector } from './ThemeInjector';
export { FolioSSRTokens   as SSRTokens }      from './components/FolioSSRTokens';
export { resolveFolioBlock as resolveBlock }   from './resolveFolioBlock'; // or a local resolveBlock(blockType,mode) wrapper
export { defaultFolioPalette }  from './palettes';
export { folioVariants, defaultFolioVariant } from './tokens';
export { getSurfaceForSection } from './sectionRules';
export { PALETTE_IMAGE_KEYWORDS } from './imageKeywords';   // optional but expected by the loader
// plus serializeBaseTokens / serializePaletteOverrides / serializeVariantOverrides used internally
```
- `imageKeywords.ts` (`PALETTE_IMAGE_KEYWORDS`, `getFolioImageQuery`) and `paletteSelection.ts`
  (`inferDefaultPalette(understanding)`) are cloned + retuned. The loader reads `PALETTE_IMAGE_KEYWORDS`;
  the picker uses `inferDefaultPalette`.
- **Firewall:** keep block/client code out of anything imported by audience-level modules. The
  registry's dynamic `import()` is what keeps the template out of the main bundle — don't break it
  by importing your template module from `src/modules/audience/**` or shared server code.

---

## 4. The content contract (what your blocks must read) — you do NOT edit it

Copy generation is **audience-scoped and already done**. Your blocks must consume the element
keys it produces. Treat the audience element schema as the **contract**:
- **service** → `src/modules/audience/service/elementSchema.ts` (`serviceElementSchema`, keyed by
  layout name; `PILOT_LAYOUT_NAMES` = section→layout).
- **product** → `src/modules/audience/product/elementSchema.ts` (`meridianElementSchema`,
  `MERIDIAN_LAYOUT_NAMES`).

For each section type, open the schema entry for its layout to see the exact element keys + their
shapes (strings vs collections-with-`{id,…}`). Your edit block must `<FolioEditable elementKey=…>`
those keys; your published block reads them as flat props. **Do not invent fields** the schema
doesn't define — they won't be generated.

You do **not** touch: `elementSchema.ts`, `parseCopy.ts`, `copyPrompt.ts`, `selectUIBlocks.ts`/
`selectBlocks.ts`, the `strategy` route, or the section-selection logic. (Lex added zero lines
there.) If your design genuinely needs a *new* content field, that's an audience-schema change —
see Appendix B.

---

## 5. Register the template id + palette/variant types — `src/types/service.ts`

(Service-audience palettes/variants live here; product palettes live in `src/types/product.ts`.)
Add/extend:
1. `templateIds` const: add `'folio'`. (Drives `TemplateId`, request validation, picker loop.)
2. `defaultVariantForTemplate`: `folio: '<your default variant id>'`.
3. Palette id union (service templates): add
   ```ts
   export const folioPalettes = ['bone','forest', …] as const;
   export type FolioPalette = (typeof folioPalettes)[number];
   ```
4. `palettesForTemplate(templateId)`: add `if (templateId === 'folio') return folioPalettes;`.
5. `templateLabels`: `folio: 'Folio'`. `templateBlurbs`: `folio: 'Editorial minimalist — …'`.
6. **Only if** your template is the first for a new audience (out of scope): update
   `defaultTemplateForAudience` and the `usesTemplateModule(...)` gate. For an existing audience,
   leave both alone — `usesTemplateModule` already returns true for all `service`, and for
   `product && templateId==='meridian'` (so a new *product* template would need a gate clause).

---

## 6. Register the loader — `src/modules/templates/registry.ts`

Add an entry to `templateRegistry` (the lazy `import()` map). The keys on the right are the
**contract**; map your module's exports to them:
```ts
folio: async () => {
  const m = await import('@/modules/templates/folio');
  return {
    resolveBlock: m.resolveBlock,
    ThemeInjector: m.ThemeInjector,
    SSRTokens: m.SSRTokens,
    getSurfaceForSection: m.getSurfaceForSection,
    defaultPaletteId: m.defaultFolioPalette,
    variants: m.folioVariants,
    defaultVariantId: m.defaultFolioVariant,
    paletteImageKeywords: m.PALETTE_IMAGE_KEYWORDS,
  };
},
```
The renderers (`LandingPageRenderer`, `LandingPagePublishedRenderer`), `useTemplateModule`,
`componentRegistry(.published)`, `ServiceThemePopover`, `StyleStep`, `EditHeader`, request
`validation.ts`, and static export are all **generic** off this registry + `templateIds` — no edits.

---

## 7. Fonts (only if the design introduces a new family)

Self-hosted only (CSP blocks Google Fonts). Existing self-hosted families: Inter, Inter Tight,
JetBrains Mono, DM Sans, Fraunces (var), Source Serif 4 (var), Lora, EB Garamond. Folio uses
Source Serif 4 + JetBrains Mono (already present) and **Manrope (new)**.

For each **new** family the design needs:
1. Drop latin `woff2` into `public/fonts/<family>/` (match existing naming, e.g. `manrope-v…-latin-400-normal.woff2`).
   - Static weights: one file per weight (+ italic if used).
   - **Variable** family (opsz/wght axes): use the **axis-preserving variable** woff2 (normal +
     italic) — a static instance silently kills the optical-size axis.
2. Append `@font-face` rules to `src/styles/fonts-self-hosted.css` (use `font-display:swap`;
   variable fonts use a weight **range**, e.g. `font-weight: 300 600;`).
3. `tokens.ts` already references the family by name in `--font-display/-body/-mono` — make sure the
   `@font-face` `font-family` name matches exactly (incl. quotes).
4. **Optional preload** in `src/app/p/layout.tsx` — only for a near-body face shared across
   templates; don't preload template-specific or large variable files (rely on swap).
5. CSP: `src/lib/security.ts` `font-src 'self'` already covers same-origin woff2 — **no change**
   for self-hosted. Only touch CSP if you (don't) add an external font origin.

---

## 8. Picker wiring (you opted in) — show the template + its palettes/variants

**Service** (onboarding StyleStep + editor ServiceThemePopover read a catalog):
`src/app/onboarding/service/[token]/components/fields/templateCatalog.ts`
1. Add a `TEMPLATE_CATALOG.folio` entry:
   ```ts
   folio: {
     id: 'folio',
     label: templateLabels.folio,
     blurb: templateBlurbs.folio,
     palettes: palettesForTemplate('folio'),
     enabled: folioPilotEnabledPalettes,      // from folio/palettes.ts
     swatch: (p) => { const c = folioPaletteConfigs[p]; return { accent: c?.accent, accentDeep: c?.accentDeep, wash: c?.accentWash }; },
     variants: folioVariants,                  // from folio/tokens.ts
     inferDefaultPalette: (u) => inferFolioPalette(u),  // from folio/paletteSelection.ts
   },
   ```
2. Add `'folio'` to `TEMPLATE_ORDER` (display order).
`StyleStep.tsx`, `ServiceThemePopover.tsx`, and `EditHeader.tsx` then pick it up automatically
(they iterate `templateIds`/read the catalog + `templateLabels`).

**Product** is pilot-locked (no picker): a product template is hardcoded in
`onboarding/product/[token]/components/steps/GeneratingStep.tsx` (`PILOT_TEMPLATE`,
`PILOT_PALETTE`, `PILOT_VARIANT`). To ship a product template you'd swap those (and the
`EditHeader` shows a static label, not a picker, until product picker work lands).

---

## 9. Hardcoded-default gotchas (audit these)

These default to Hearth and only bite when `paletteId`/`templateId` is null (shouldn't happen if
onboarding persisted them, but verify for your template):
- `LandingPageRenderer.tsx` — `effectivePalette … ?? 'terracotta'`.
- `LandingPagePublishedRenderer.tsx` — `… ?? 'terracotta'` and surface `… ?? 'cream'`.
- `src/app/p/[slug]/page.tsx` — service `templateId` falls back to `'hearth'`.
- `src/lib/staticExport/htmlGenerator.ts` — `preloadTemplate(templateId || 'hearth')`.
Leave them if your projects always persist `templateId`+`paletteId`; otherwise generalize to read
`defaultTemplateForAudience` / `tmpl.defaultPaletteId`.

---

## 10. Verification (run before declaring done)

1. **Build/typecheck:** `npm run build` green (and `npx tsc --noEmit`).
2. **Every section renders, both renderers:**
   - `npm run dev`, create a project on your template (service: pick it in StyleStep).
   - `/edit/[token]`: every section renders with correct fonts/colors; background matches the
     design; hero/headers don't overlap; CTAs selectable (Button Settings opens).
   - `/preview/[token]`: same.
   - **Publish → `/p/[slug]`: pixel-parity with the editor** (the dual-renderer check). No
     placeholder/"missing component" blocks. No light seams between sections.
3. **Palette + variant switching** (picker): re-renders instantly, no copy regen; persists across
   save + reload; published page reflects `data-palette`/`data-variant`.
4. **CTAs:** set a link on header/hero/closing/secondary/tier CTAs → publish → each navigates to
   its own target.
5. **Fonts:** on `/p/[slug]`, Network shows woff2 from `/fonts/...` only — **zero**
   `fonts.googleapis.com` / `gstatic.com`. Variable display font shows non-default
   `font-variation-settings` (opsz) on a heading.
6. **Picker:** the template appears in StyleStep + ServiceThemePopover with its palettes/variants;
   EditHeader shows it.
7. **Grep:** no leftover `Hearth`/`hearth` (or whatever you cloned) identifiers in
   `src/modules/templates/folio/**`.

---

## 11. Quick checklist

- [ ] Read the designer HTML; identify palette vars, variant blocks, surfaces, fonts, sections.
- [ ] `cp -r` the closest same-audience template → `src/modules/templates/folio/`; rename all identifiers.
- [ ] `tokens.ts` (base + surfaces + accent-em + variants), `palettes.ts`, `sectionRules.ts`.
- [ ] `ThemeInjector.tsx` + `components/FolioSSRTokens.tsx` (same stylesheet, set data-palette/variant).
- [ ] Clone `FolioEditable`, `FolioAddImageOverlay`, `useFolioBlock`.
- [ ] Build **every** section's `.tsx` + `.published.tsx` (full audience set); consume audience element keys; `resolveCtaHref` for hrefs.
- [ ] `resolveFolioBlock.ts` (section type → pair) + `index.ts` barrel (alias exports).
- [ ] `imageKeywords.ts` + `paletteSelection.ts` retuned.
- [ ] `types/service.ts`: `templateIds`, `defaultVariantForTemplate`, palette union + `palettesForTemplate`, `templateLabels`, `templateBlurbs`.
- [ ] `registry.ts`: loader entry.
- [ ] Fonts: woff2 + `@font-face` in `fonts-self-hosted.css` (+ optional preload) for any new family.
- [ ] Picker: `templateCatalog.ts` entry + `TEMPLATE_ORDER` (service).
- [ ] Audit §9 hardcoded defaults.
- [ ] Run §10 verification end-to-end (esp. edit==published parity + zero Google font calls).

---

## Appendix A — Contract reference (what the registry/renderers require)

| Contract key (registry) | Your module must export | Used by |
|---|---|---|
| `resolveBlock(sectionType, mode)` | `resolveBlock` (alias) | both renderers / componentRegistry |
| `ThemeInjector` | `ThemeInjector` (alias, client) | LandingPageRenderer / EditLayout |
| `SSRTokens` | `SSRTokens` (alias, server) | LandingPagePublishedRenderer |
| `getSurfaceForSection(type)` | `getSurfaceForSection` | published per-section `data-surface` |
| `defaultPaletteId` | `defaultFolioPalette` | renderers' fallback, picker |
| `variants` | `folioVariants` (`{id,label,blurb}[]`) | picker |
| `defaultVariantId` | `defaultFolioVariant` | renderers' fallback, picker |
| `paletteImageKeywords` | `PALETTE_IMAGE_KEYWORDS` | image query hints |

Every block also implicitly receives (published): `sectionId`, `content`, `publishedPageId`,
`pageOwnerId`, plus flattened content fields. Wrap-level `data-palette`/`data-variant` come from
`SSRTokens`/`ThemeInjector`; per-section `data-surface` from the renderer.

## Appendix B — Out of scope: new content fields or a new audience type

- **New content field a block needs** (e.g. a field the audience schema doesn't have): that's an
  **audience-schema** change — edit `src/modules/audience/<audience>/elementSchema.ts` (+ the copy
  prompt's collection spec + `parseCopy` defaults). Coordinate with a PO; it affects *all*
  templates of that audience. Avoid unless necessary.
- **A brand-new audience type** (e.g. `ecommerce`): much larger — new onboarding flow + store +
  strategy/copy routes + element schema + `defaultTemplateForAudience` + `usesTemplateModule`
  gate. Separate plan; not covered here.
