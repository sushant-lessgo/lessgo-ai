# Adding a New Template — Dev Agent Guide

> **Audience:** a dev agent adding a brand-new visual **template** (the middle tier of
> `audienceType → templateId → variant+palette`) for an **existing audience type**
> (`product` or `service`). This is how **Lex** was added under `service` (a clone of Hearth).
> **Out of scope:** standing up a new *audience type* (new onboarding flow + store + copy
> prompts). See the final appendix for a pointer.

> **Golden rule:** a new template is, by default, a **skin** — new *tokens, palettes, variants,
> and block components* that **consume the audience's existing content contract** (no `audience/**`
> edits). This is the common case and the fastest path; do this unless you have a reason not to.
>
> **But a template MAY also extend the audience** — add new section types, multi-page, collections,
> interactivity (TechPremium/naayom did all four). That is **deliberate, AI-first** work: new
> section types flow through the audience's **AI generation** (schema + section selection + copy
> prompt) so the model produces them — you do **not** hardcode page copy. Multi-page is now a
> **standard** capability, not an exception. See **§12** before you touch `src/modules/audience/**`
> or the multi-page store — going there by accident is still a mistake; going there on purpose,
> following §12, is supported.

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

**A project can hold multiple pages.** Multi-page is standard: one project = one site, with a Home
plus optional subpages (`/gallery`, `/contact`, `/products/{slug}`, …) routed at `/p/{slug}/{path}`.
Shared header/footer ("chrome") is edited once and injected into every page at publish. A pure skin
needs to know none of this — the renderers handle it. A template that *adds* page types or
collections does (see **§12** + `multiPagePlan.md`).

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

**Porting raw designer CSS (TechPremium learnings):**
- **🔴 Per-block CSS lives in a PLAIN `styles.ts` module — never in the `'use client'` `.tsx`.** Put
  the const in `<Block>/styles.ts` (a plain module, **no `'use client'`**), export it, and `import`
  it into BOTH `<Block>.tsx` and `<Block>.published.tsx`, each rendering
  `<style dangerouslySetInnerHTML={{ __html: STYLES }} />`. **Why this exact placement:** if you
  `export const STYLES` from the `'use client'` `.tsx` and import it into `.published.tsx` (server),
  the value resolves to a **client reference, not the string** → the published `<style>` emits
  **empty** → the live page has no CSS (invisible in `/edit`, where inline styles work regardless —
  it only breaks on `/p/[slug]`). This is a real P0 that shipped (same class as the
  `'use client']` 500 bug — see [[project_published_client_boundary]]). Composed styles may import
  shared consts from a plain `shared/styles.ts` (safe — plain module). Block CSS is **inline**, not
  in `published.css`, so no CSS rebuild is needed for block styling.
- **Prefix every ported class** (TechPremium used `tp-`). The designer's bare `.nav`/`.btn`/`.card`
  will collide with the **editor's own UI** in edit mode and silently restyle toolbars/menus. A
  template-unique prefix is mandatory, not cosmetic.
- **Images via the store, not raw URL inputs.** For image elements/collections call
  `useEditStore().uploadImage(file, { sectionId, elementKey })` (Sharp→WebP→Blob, auto-saves);
  for collection items the key is the **nested dotted path** `images.{item.id}.src` (call
  `uploadImage` directly — the `ImageToolbar` parser only splits the first two dot-parts and mangles
  4-part keys). For many photos use `bulkUploadImages(files: FileList)`. The store's save serializes
  the **full** multi-page draft (pages + chrome) — don't hand-roll a partial save.

**Established editable affordances (proven on TechPremium/Surge — port, don't reinvent).** All keep
edit/published parity (update both files; CSS in the plain `styles.ts`):
- **Logo upload (header):** schema already has `logo_image` (`manual_preferred`). Edit `.tsx`: a hidden
  `<input type=file>` + "Change / Remove logo" button calling
  `uploadImage(file, { sectionId, elementKey: 'logo_image' })`; when set, render `<img class="…__img">`
  **instead of** the wordmark/mark. Published: render `<img>` when `logo_image` present, else the mark.
  Pattern source: `techpremium/blocks/Header/TechPremiumNav.tsx`.
- **WhatsApp FAB (footer):** add optional schema keys `whatsapp_number`, `whatsapp_label`,
  `whatsapp_prefill` (`manual_preferred`, default `''`). Render a fixed-position anchor after
  `</footer>` when a number is set, `href = https://wa.me/{digitsOnly}?text={encoded prefill}`, inline
  SVG icon, hardcoded green `#25D366`. **Pure anchor, no JS.** Source: `TechPremiumFooter`.
- **Configurable nav / footer links:** the `LinkTargetPopover` (scroll-to-section / page / custom URL)
  + add/remove affordances. Copy `LinkTargetPopover` into your template's `components/` (it's
  `'use client'` — import it ONLY in edit `.tsx`, never `.published.tsx`); feed it
  `buildSectionLinkOptions` (`@/utils/sectionAnchors`) + `buildPageLinkOptions` (`@/utils/pageLinks`).
  Single-page templates → `pageOptions` is empty and the "Link to page" radio auto-hides. Published:
  render `<a href={item.href} {...externalLinkProps(item.href)}>` (new-tab on external —
  `@/utils/resolveCtaHref`). Source: `TechPremiumNav` / `TechPremiumFooter`.
- **When converting hardcoded designer content (e.g. a fixed footer column) to an editable collection,
  SEED defaults** — an empty collection + "hide when empty" silently drops the designed element.
- **Adding template-specific OPTIONAL keys to a SHARED layout is safe** when `manual_preferred`
  + `default ''` (other templates ignore them; the AI never fills `manual_preferred`). This is how
  Surge added `whatsapp_*`/`footer_links` to the shared `ContactFooterRich` without affecting Hearth.

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

> ⚠️ **Two-identifier discipline — the #1 silent-failure source** (build stays green, runtime breaks).
> Each section carries **two** names that must each stay consistent across several places:
> - **lowercase `type`** — the section-id prefix (`hero-…`), the `resolveBlock` key, the
>   `sectionRules` key, and the schema's internal `sectionType` field. **Wrong → placeholder block.**
> - **PascalCase `LayoutName`** — the `elementSchema` object KEY, the section's `layout` field, and
>   `sectionLayouts[id]`; `getSchemaDefaults(LayoutName)` drives content. **Wrong → block renders empty.**
>
> Neither mismatch throws a TS or build error. Two recurring traps:
> 1. **Don't confuse the component name with either.** `TechPremiumResults` is the *component*; the
>    `type` is `testimonials` and the `LayoutName` is `ProofWithLogoRail`. Registry/schema/builders
>    use `type`/`LayoutName`, never the component name.
> 2. **Section-id prefixes must be single all-lowercase tokens.** `extractSectionType` lowercases the
>    prefix and runs a small `typeMap` in `componentRegistry.ts` — a compound/camelCase name gets
>    mangled or collides (`howitworks` → `howItWorks`). TechPremium used **`process`** instead of
>    `howitworks` to dodge it. Keep `type` a clean lowercase word.
>
> 3. **Layout names are GLOBAL across the merged `layoutElementSchema`, and PRODUCT WINS TIES.**
>    `serviceElementSchema` is spread first, `meridianElementSchema` last (`layoutElementSchema.ts`
>    ~`:331/:335`), so a service/template layout that reuses a product layout NAME (e.g. a bare
>    `ContactForm`, which already exists in `meridianElementSchema`) is **silently shadowed** by the
>    product entry → your block gets the wrong schema defaults, build stays green. **Prefix bespoke /
>    template-specific layout names** (`Lumen*`, `TechPremium*`) so they're globally unique. (Lumen
>    learned this — PO review 2026-06-29.)
>
> **Guard it with a smoke test** (TechPremium's `registration.test.ts`): for every section type assert
> `resolveBlock(type) ≠ placeholder`, a surface band exists, the schema `sectionType` matches, and
> `extractSectionType('type-x') === 'type'`. For archetype-seeded sections, also run the builder and
> assert `getSchemaDefaults(layout) ≠ null`. This is the **only** thing that catches casing drift.

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

## 7.5 Interactive behaviors (published JS) — one shared asset, not per-block scripts

If the design needs JS (nav dropdowns, mobile menu, image gallery/lightbox, gallery filters, live
tickers), do **not** scatter inline `<script>` tags per block. Port the designer's JS into **one
minified asset**, like the existing `form.v1.js` / `a.v1.js`:
1. New `src/lib/staticExport/<template>Behaviors.js` — the designer JS, selectors renamed to your
   `tp-`-style prefix, each behavior a no-op when its markup is absent, with an idempotent boot guard.
2. `scripts/buildAssets.js` — add `{ src: '<template>Behaviors.js', out: '<template>.v1.js' }` (the
   build minifies it into `public/assets/`).
3. `src/lib/staticExport/htmlGenerator.ts` — inject `<script src="…/<template>.v1.js" defer>` gated
   on `templateId === '<id>'` (mirror the `form.v1.js` injection).
4. Blocks emit only **markup + hook attributes/classes** (e.g. `[data-tp-lightbox-group]`,
   `.tp-gfilter`); the asset wires them. In **edit** mode use minimal React (`useState`) instead.

Pitfalls: the asset's selectors must match block markup **exactly** — a renamed class is a silent
no-op. Behaviors run on **published only** — `/preview` uses the edit renderer and won't show them,
so **verify on the live `/p/[slug]` URL**, not preview. Bump `…v2.js` only on breaking markup changes.

For **forms** (a contact/lead block), don't write a bespoke submit — reuse the platform pipeline:
seed an `MVPForm` into `state.forms`, render `<form data-lessgo-form data-form-id data-page-id
data-owner-id>` with `name={field.id}` inputs; `form.v1.js` (auto-injected when `content.forms` is
non-empty) POSTs to `/api/forms/submit`. The published renderer passes `publishedPageId`/`pageOwnerId`
to every block for the data-attributes.

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
8. **Registration smoke test** (esp. if you added section types): a `registration.test.ts` that, per
   type, asserts non-placeholder resolve + surface + schema `sectionType` match + `extractSectionType`
   round-trip (+ `getSchemaDefaults(layout) ≠ null` for archetype sections). Build-green ≠ correct —
   this is the only catch for the two-identifier/casing traps (§3g).
9. **Behaviors on the live URL, not preview:** any JS (§7.5) only runs on published — hard-refresh
   `/p/[slug]` (and subpaths) and confirm dropdowns/lightbox/filters/forms actually work.
10. **`'use client'` boundary guard (commit it):** a test/grep asserting no `*.published.tsx` imports
    a non-component value (CSS `*_STYLES`, helpers) from a `'use client'` sibling. This bug class has
    shipped **twice** (functions → 500; CSS strings → empty published styles) and fails **silently** —
    `npm run build` stays green, only the live page breaks. Inline-CSS templates especially: confirm
    the actual published HTML carries the rules (`curl /p/[slug] | grep '.your-class'`), since `/edit`
    looks correct regardless. See [[project_published_client_boundary]].

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
- [ ] Picker: `templateCatalog.ts` entry + `TEMPLATE_ORDER` (service). **Bespoke/exclusive (§13): SKIP this** so it stays unselectable; set `templateId` on the client's project by hand instead.
- [ ] Block CSS in a **plain `styles.ts`** imported by both files (never exported from the `'use client'` `.tsx` → empty published CSS); **prefix all ported classes** (e.g. `tp-`); images via `uploadImage`/`bulkUploadImages` (§3f).
- [ ] Reuse the proven affordances where needed: logo upload, WhatsApp FAB, `LinkTargetPopover` nav/footer links; seed defaults when making hardcoded content editable (§3f).
- [ ] Commit the `'use client'` boundary guard test (§10.10); verify published HTML actually carries block CSS via `curl`.
- [ ] Two-identifier discipline (lowercase `type` vs PascalCase `LayoutName`); single-lowercase id prefixes; add a `registration.test.ts` smoke guard (§3g/§10.8).
- [ ] If interactive: one minified `<template>.v1.js` behaviors asset wired via `buildAssets.js` + `htmlGenerator.ts` (§7.5) — verify on the published URL.
- [ ] If adding section types / pages: follow **§12** (AI generation, not hardcoded copy) + `multiPagePlan.md`.
- [ ] Audit §9 hardcoded defaults.
- [ ] Run §10 verification end-to-end (esp. edit==published parity + zero Google font calls).

---

## 12. Extending the audience — new section types & multi-page (beyond a skin)

A skin reuses the audience's existing sections. A richer template (TechPremium/naayom) **adds**
section types, pages, and collections. That is an **audience-level** change — it affects every
template of that audience and touches the AI generation pipeline, so **coordinate with a PO** and
read this before editing `src/modules/audience/**`.

**Principle: AI-first, never hardcoded copy.** New section types must be wired so the **AI generates**
their content through the normal `onboarding → strategy → copy` flow. (TechPremium shipped a
deterministic 12-section copy seed as a one-off launch bridge for naayom — that was **removed and is
not the pattern**. Don't reintroduce a hardcoded-copy default for a persona/template.)

**A new section type, end-to-end** (all must use the same lowercase `type` / PascalCase `LayoutName`
per §3g):
1. **Schema (contract):** add `meridianElementSchema['<LayoutName>']` / `serviceElementSchema[...]`
   with `sectionType: '<type>'` + its elements/collections (`src/modules/audience/<a>/elementSchema.ts`).
2. **Generation (so the AI actually emits it — the point):**
   - Section selection: product = `MERIDIAN_PILOT_SECTIONS` / `selectProductSections`
     (`audience/product/sectionSelection.ts`); service = `selectServiceSections`
     (`audience/service/sectionSelection.ts`, awareness-driven). The new type must be able to appear.
   - Element map: `getCompleteElementsMap` / `getAllPossibleElements` (`modules/sections/elementDetermination.ts`).
   - Prompts: `buildStrategyPrompt.ts` (cardCounts) + `buildPrompt.ts` (copy) must teach the model the
     new section + its elements.
3. **Render (your template):** `resolveBlock` pair + `sectionRules` surface (§3f/§3g).
4. **Guard:** extend `registration.test.ts` (§10.8). If the generation work for a type isn't done yet,
   that's generation work to finish — not a reason to hardcode its copy.

**Multi-page & collections are standard** (`multiPagePlan.md` is the authority — don't duplicate it):
- The page axis (store `pages` + mirror), shared **chrome** (header/footer injected at publish),
  **collections** (catalog + repeatable detail pages, materialized), and **subpath publish/serve**
  are generic. Your template supplies the *blocks*; the machinery is shared.
- Template-specific pages are added via **archetype builders + page actions** (e.g.
  `buildHomeSlice`/`buildGallerySlice` + `addArchetypePage`), not the generic section picker (which is
  inert for template audiences). Keep insertion generic and mirror-safe (reuse the existing
  `commitActivePage → mutate pages[id] → loadPageIntoActive` pattern; never assign `state.sections`
  directly — it drops injected chrome).

---

## 13. Bespoke / single-use templates (hard-coded, client-exclusive)

Some templates are built for **one paying client** — hand-written copy + real photos, never offered
to anyone else (naayom on product; a photographer on service). This is a legitimate mode: don't force
the AI-generation path (§12) on a site you'll never reuse. Rules:

- **Exclusivity = register, but don't list in the picker.** Add the id to `templateIds`
  (`types/service.ts`) + a `registry.ts` loader entry (so it renders), but **do NOT** add it to
  `TEMPLATE_CATALOG`/`TEMPLATE_ORDER` (`templateCatalog.ts`). The onboarding picker loops
  `TEMPLATE_ORDER` (`StyleStep.tsx`), so omitting it there keeps it **unselectable** by other users.
  Precedent: `techpremium`/`meridian` are in `templateIds` but not the service `TEMPLATE_ORDER`.
- **Set the template on the client's project by hand** — a deterministic seed or the
  admin/transfer-ownership flow sets `audienceType` + `templateId` directly on the project. This
  **bypasses the `/api/start` persona/waitlist gate entirely**, so the client's persona is irrelevant
  and you don't add one. (For reference: a photographer is `service`; the *conceptual* persona is
  `freelancer`/`local-service`, but those are pilot-waitlisted in `PILOT_SERVICE_PERSONAS` — another
  reason bespoke skips the persona route. Only whitelist them if you later want self-serve onboarding.)
- **Hard-code via a seed scoped to that project.** Copy + every `manual_preferred` image is seeded
  (the AI fills none of it). **Never** bake the seed into a shared persona/template default a future
  customer could inherit — keep it project-scoped (see [[project_before_customer_2]]).
- **Skip the reusable-template wiring you don't need:** the picker (§8) and the AI-generation tie-in
  (§12). You still need the module (blocks/tokens, §1–§7) and **all** the §3f CSS-boundary rules.
- **Plan to retire/decouple, don't duplicate.** When done, leave it registered (inert, picker-less)
  or remove it — don't fork the whole module "to keep a clean copy."

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
  templates of that audience. Avoid for a pure skin; if your template genuinely needs new sections
  or fields, that's the **§12** path (AI-first), not a one-off.
- **A brand-new audience type** (e.g. `ecommerce`): much larger — new onboarding flow + store +
  strategy/copy routes + element schema + `defaultTemplateForAudience` + `usesTemplateModule`
  gate. Separate plan; not covered here.
