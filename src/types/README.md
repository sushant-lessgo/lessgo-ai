# `src/types/` — Type contracts

TypeScript contracts shared across generation, editor, renderers, and templates.
**`service.ts`, `product.ts`, and `template.ts` are the source of truth for the
3-tier template model** (`audienceType → templateId → variantId + paletteId`);
the registry, onboarding pickers, render gate, and generation pipeline all key off
the constants and functions defined here.

---

## The 3-tier model (source of truth)

### `service.ts`
Despite the name, this file owns the **top two tiers for every audience**, not just
service:
- `audienceTypes` = `product | service | ecommerce | writer` + `AudienceType`.
- `templateIds` (`hearth, lex, surge, meridian, techpremium, lumen, granth,
  vestria`) + `TemplateId`; `defaultVariantForTemplate`, `defaultTemplateForAudience`.
- `usesTemplateModule(audienceType, templateId)` — **the render gate**: decides
  whether a page renders via a template module vs the legacy 47-UIBlock path.
  Strict on the *stored* values (never synthesize a default at a gate site).
- Persona layer: `userPersonas` + labels/descriptions, `personaToAudienceType`,
  `personaToServiceType`.
- Service enums: `serviceTypes`, `serviceAwarenessStates`, `serviceGoals`.
- Palette families per template (`hearthPalettes`, `lexPalettes`, `surgePalettes`,
  `lumenPalettes`, `granthPalettes`; product families re-exported from `product.ts`)
  and `palettesForTemplate()`.
- Picker metadata (`templateLabels`, `templateBlurbs`) and the service strategy
  I/O shapes (`ServiceStrategyOutput[Assembled]`, `ServiceStrategyRequestInput`, …).

### `product.ts`
Product-line palette/variant contracts + product generation shapes:
- Meridian (`meridianPalettes` / `meridianVariants` + defaults), TechPremium
  (`forest` / `default`), Vestria (8 accent palettes, 3 typeface variants, defaults).
- `SitemapPage` (one page of an agreed multi-page sitemap) and
  `ProductStrategyOutput` (LLM strategy + deterministic section list / block map,
  optional `sitemap`).

### `template.ts`
`TemplateModule` — **the plug contract every visual template satisfies** (the
registry types against it): `resolveBlock(blockType, mode)` (dispatches on
*section type*, one block per section per template), `ThemeInjector` / `SSRTokens`
(client + SSR token emitters, accept optional `variantId` / `mood`),
`getSurfaceForSection`, `defaultPaletteId` / `variants` / `defaultVariantId`, and
optional `paletteImageKeywords`. Plus `TemplateVariant` and `TemplateModuleLoader`.

---

## Other type files

| File | Purpose |
|------|---------|
| `generation.ts` | Onboarding-era generation types: `landingGoals`, `Vibe`, `OneReader`/`OneIdea`, `IVOC`, `FeatureAnalysis`, `StrategyOutput`, `UnderstandingData`, section/uiblock enums. Still active for the generation flow. |
| `storeTypes.ts` | Content-element typing derived from `layoutElementSchema` (`StoreElementTypes`, string/array element unions). *(Note: the editor store's own `EditStore`/`SectionData` types live under `@/types/store`, a separate directory.)* |
| `layoutTypes.ts` | Section/layout structural types. |
| `universalElements.ts` | Universal (cross-section) element definitions. |
| `elementRestrictions.ts` | Element restriction/allow rules (see also `src/config/elementRestrictions.ts`). |
| `sectionBackground.ts` | Section background/surface typing. |
| `blog.ts` | Blog-track post types (BlogPost). |

> Related type homes outside this dir: `@/types/store/*` (editor store slices),
> `@/types/core/*` (canonical field names, forms, `InputVariables`), and each
> template's own `tokens.ts` / `palettes.ts`.
