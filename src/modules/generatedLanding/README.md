# `generatedLanding/` — the dual-renderer + registries

This directory owns how a landing page's stored content becomes rendered DOM. It
is the seam where the **3-tier template model** (`audienceType → templateId →
variant + palette`, see repo `CLAUDE.md`) meets React. Read this before touching
any block or renderer.

## The #1 trap: renderer divergence

Every block exists as a **pair** and is rendered by one of **two renderers**:

| | Edit renderer | Published renderer |
|---|---|---|
| File | `LandingPageRenderer.tsx` | `LandingPagePublishedRenderer.tsx` |
| Runs | in the browser (client component) | server-side, static markup |
| Block file | `<Section>.tsx` (hooks, `contentEditable`) | `<Section>.published.tsx` (no hooks, flat props) |
| Registry | `componentRegistry.ts` | `componentRegistry.published.ts` |
| Data source | Zustand edit store (`useEditStoreLegacy`) | props passed in by the caller |
| Output | live, editable React tree | `ReactDOMServer.renderToStaticMarkup` string |

**If the two diverge, a change "looks right in the editor but wrong when
published" (or vice-versa).** When editing any block, update BOTH `.tsx` and
`.published.tsx` and keep their layout/CSS identical. There is no shared render
path — the parity is maintained by hand (the `/manual-test` skill's editor↔published
check is the human backstop; some templates use a shared `.core.tsx` to reduce drift).

Related hard rule: **never import a function from a `'use client'` block into a
published renderer** (→ 500 "F is not a function"). Put shared helpers in plain modules.

## How a block resolves (both renderers)

Both `getComponent()` functions dispatch **by section TYPE, not the stored layout
name**, through the dynamic **template registry** (`@/modules/templates/registry`):

1. `extractSectionType(sectionId)` — `hero-1753195467366` → `hero` (edit registry
   also normalizes a few PascalCase names, e.g. `howitworks` → `howItWorks`).
2. If `usesTemplateModule(audienceType, templateId)` is true, read the
   **preloaded** template module from the registry cache
   (`getLoadedTemplate(templateId)`), then call `tmpl.resolveBlock(sectionType,
   'edit' | 'published')`.
3. The template resolves its own single block for that section, so the stored
   layout string is irrelevant to dispatch (kept in data, unused here) — the editor
   can switch templates with zero layout-name rewrites.

**Bundle firewall:** neither registry statically imports a template module. Doing
so would pull e.g. Hearth/Meridian into the main bundle. Template code is
loaded via async dynamic import and cached; the renderers read it synchronously
and **gate render on readiness** (edit renderer returns `null` until
`useTemplateModule` reports ready; published render is preceded by
`preloadTemplate()` in `htmlGenerator.ts`). The legacy 47-UIBlock à-la-carte
registry was removed in P5 — there is no non-template render path.

## Data flow: content, theme, palette/variant

- **Edit renderer** pulls everything from the token-scoped edit store:
  `sections`, `sectionLayouts`, `content`, `theme`, `mode`, plus
  `audienceType / templateId / variantId / paletteId / themeValues`. For each
  `sectionId` it looks up `content[sectionId]` and spreads it as props onto the
  block (`{...(data || {})}`), with `isEditable={mode !== 'preview'}`.
- **Published renderer** is pure props: the caller passes `sections`, `content`,
  `theme`, and the tier ids. It extracts `content[sectionId].layout`, flattens
  the section's `elements`/`elementMetadata`/system props via
  `extractContentFields`, and spreads them onto the block with `mode="published"`.
- **Palette / variant / mood** fall back to the loaded template's own defaults
  (`tmpl.defaultPaletteId`, `tmpl.defaultVariantId`; `mood` from
  `Project.themeValues.mood`, default bone) when unset.

## The `data-surface` contract

Template-backed sections are wrapped in a `<div data-surface={surface}>` where
`surface = tmpl.getSurfaceForSection(sectionType)` (default `cream`). This
**template-agnostic** attribute is how surface tones are applied — the template's
CSS/tokens style by `[data-surface]`, so both renderers stay skin-independent. Both
renderers emit the same wrapper (with a dedup-aware anchor id from
`buildSectionAnchorMap` and `scrollMarginTop: 80`); the edit side additionally wraps
in `<SectionTracker>` and appends `<FormPlacementRenderer>`. Product (non-template)
projects instead compute an explicit `sectionBackgroundCSS` from `theme.colors`.

## Theme injection

- Edit renderer: template projects wrap `renderContent()` in the template's
  `tmpl.ThemeInjector` (palette + variant + mood); non-template projects use
  `VariableThemeInjector` behind a `CSSVariableErrorBoundary`.
- Published renderer: template projects wrap the section tree in
  `tmpl.SSRTokens` (server-safe CSS-variable emit); it also injects a small
  inline smooth-scroll script and an optional analytics `<Script>`.

## Files in this directory

| File | Purpose |
|---|---|
| `LandingPageRenderer.tsx` | Edit renderer (client): store-driven, editable, ThemeInjector/VariableThemeInjector wrap. |
| `LandingPagePublishedRenderer.tsx` | Published renderer (server-safe): flat props → static markup, `SSRTokens` wrap. |
| `componentRegistry.ts` | Edit dispatch: section type → `.tsx` block via template registry cache. |
| `componentRegistry.published.ts` | Published dispatch: section type → `.published.tsx` block. |
| `EditableText.tsx` | `contentEditable` text primitive used inside edit-mode blocks. |
| `EditableWrapper.tsx` | Hover/pencil affordance wrapper for editable elements (edit mode only). |

## Shared blocks (`sharedBlocks/`)

A handful of blocks (`LeadForm`, `StoreBadges`, `FollowStrip`) render **identically on
every template** — the component registries consult `resolveSharedBlock*()` BEFORE
template dispatch. Each is a dual-renderer pair with its own lowercased registry key
(`leadForm-<uuid>` → `leadform`) in `registry.ts` (edit) and `registry.published.ts`
(published).

**When you add a new shared block you MUST also declare its serve-gate capability in
`sharedBlocks/capabilities.ts`** — map its lowercased key to a `CapabilityId`, or to an
explicit `null` if no capability id fits it today. `capabilities.ts` is PURE DATA (no
React/component imports) so the serve gate (`src/modules/templates/fit.ts`) can import
it without breaking its bundle firewall. `capabilities.test.ts` fails CI if the
declaration and the two component registries ever fall out of sync.

## Consumers

- Edit renderer → `/edit/[token]` and `/preview/[token]`.
- Published renderer → `src/lib/staticExport/htmlGenerator.ts` (static export at
  publish time) and the `/p/[slug]` render path. See that dir's `README.md`.
