# onboarding2 — spec

Visual variation + video hero for the manufacturer/vestria pilot.

## Problem / why
Onboarding1 built the manufacturer content flow (vestria, 1:1 with manufacturer persona). But vestria ships **one fixed look, one hero, image-only upload**. The pilot customer (uniform manufacturer) needs:
- a **full-bleed autoplay video hero** (separate desktop + mobile clips), and
- the ability to **try alternate looks** — hero layout + cosmetic (variant/font-feel, palette, surface).

Both were previously blocked on designer HTML; the designer has now shipped it (two Vestria HTMLs).

## Goal
On the **product/manufacturer (vestria) path only**, let the user — while copy is generating — choose (1) a **hero variant** (image vs full-bleed video), then (2) a **cosmetic look** (variant + palette + surface), and change both later in the editor: cosmetic via the header theme popover, hero variant via the section-toolbar **Change Layout** control. Add **self-serve desktop+mobile background video upload** to the hero.

Two independent axes:
- **Axis A — cosmetic:** variant (font+feel) + palette (accent) + surface type. Global look.
- **Axis B — hero variant:** image hero vs full-bleed video hero. Per-section (hero).

## Scope OUT (non-goals)
- Full **products** path (non-manufacturer) — later; this is vestria/manufacturer only (1:1 via `isManufacturerFlow`).
- **Service path** — untouched; it's the reference pattern, not a target.
- Per-section variant switching for **sections other than hero** — only the hero gets 2 variants this round (re-enabling the layout modal is scoped to the vestria hero, not a general capability).
- **Video transcode/compress pipeline** — no server-side re-encode (no `sharp` path for video); accept uploaded file as-is within a size cap.
- **Standalone font picker** — font rides on the variant (surge model), not a separate control.
- Other templates — no changes.

## Constraints
- **Dual-renderer parity:** each hero variant needs `.tsx` + `.published.tsx` kept layout-identical (the #1 trap).
- **Firewall intact:** `templateId` must never enter prompt builders; variant/palette/voice derive as they do today (onboarding1 pattern).
- **Template-module gate:** `LayoutChangeModal` returns `null` for template modules today — re-enabling it must be **scoped so other template-module templates (surge/hearth/lex/lumen) stay disabled**; only vestria hero surfaces the swap.
- **No product-route StyleStep exists** — the generation-time picker is net-new on the product route (clone the service `StyleStep` pattern).
- **Generation-time picker must be non-blocking** — runs on the generating/sitemap-gate step *while copy streams*.
- **Video upload:** current `/api/upload-image` is images-only (10MB cap, `sharp` WebP re-encode). Video needs its own MIME allow-list + (larger) size cap + Blob key `uploads/${tokenId}/...`, no `sharp`.
- **Manufacturer↔vestria 1:1** assumption stays centralized in `manufacturerFlow.ts` / `isManufacturerFlow`.
- Persist without a schema migration if possible (choices in `content`/`themeValues` + `variantId`/`paletteId` Project fields already exist; hero variant via `sectionLayouts`).

## References                   <!-- best input is source code -->
- **Designer looks (cosmetic):** `template-design/Vestria - Uniform Manufacturing.html` — source of variant/palette/surface options.
- **Designer hero (video):** `template-design/Vestria - Uniform Manufacturing v2 (full-bleed hero).html` — full-bleed video hero markup/behavior.
- **Axis-A pattern to clone (service):** `.../onboarding/service/[token]/components/steps/StyleStep.tsx`, `fields/PaletteSwatch.tsx`, `fields/templateCatalog.ts`; editor `.../edit/[token]/components/ui/ServiceThemePopover.tsx`, `usePaletteSwap.ts`, `StyleBrowserModal.tsx`.
- **Palette/variant module shape:** `src/modules/templates/surge/{palettes,tokens,paletteSelection}.ts` (`surgeVariants`, palette configs). Vestria already has `src/modules/templates/vestria/{palettes,paletteSelection,sectionRules}.ts`.
- **Store:** `useServiceGenerationStore` (`templateId`/`variantId`/`paletteId`) → product equivalent `useProductGenerationStore`.
- **Editor / section swap:** `.../edit/[token]/components/ui/ThemePopover.tsx` (product), `toolbars/SectionToolbar.tsx`, `ui/LayoutChangeModal.tsx` (the `usesTemplateModule` null-gate), `ui/LayoutChangeSelector.tsx`, `hooks/editStore/layoutActions.ts` (`updateSectionLayout`, `sectionLayouts`).
- **Block resolve:** `surge/resolveServiceBlock.ts` (`SERVICE_BLOCK_REGISTRY`) → vestria's block resolve registry (where the 2nd hero variant is wired).
- **Upload:** `src/app/api/upload-image/route.ts`, `hooks/editStore/formsImageActions.ts` (`uploadImage`). Manufacturer flow: `src/modules/audience/product/manufacturerFlow.ts` (`isManufacturerFlow`).

## Open exploration questions   <!-- feeds scout -->
- How does the base Vestria HTML encode multiple cosmetic looks? Extract exact **variant names, palette hues, surface modes** available.
- Vestria block registry/resolve — where and how to add the 2nd hero variant; how does resolveBlock pick a block by variant/layout?
- Product generating step (`GeneratingStep` / `SitemapReviewStep`) sequencing — where to inject the non-blocking picker while copy streams.
- Does product `ThemePopover` read `variantId`/`paletteId` (or only palette)? What must extend to expose variant + palette + surface?
- `LayoutChangeModal` re-enable path: how `usesTemplateModule` gates it; can we allow-list only the vestria hero without exposing every section/other template module?
- Surface-type: how `sectionRules` assigns surfaces today; how to make a chosen surface set project-overrideable.
- Published-renderer `<video>` handling: autoplay/loop/muted/playsinline/poster in static markup; ISR/blob-proxy implications for serving video.
- `sectionLayouts` persistence for a template-module hero variant.
- Video upload route: MIME/size, poster (separate upload vs first-frame extraction), Blob key.

## Candidate human gates        <!-- feeds planner -->
- **New video upload route** — larger file sizes / storage / abuse surface; cost + limits review.
- **Re-enabling `LayoutChangeModal` for a template module** — regression risk across all template-module templates; must confirm others stay off.
- **Any Project schema change** (surface selection, hero variant, dual video URLs) — prefer `content`/`sectionLayouts`; migration only if unavoidable.
- **Prod pilot publish** of the video hero (custom-domain customer likely).

## Acceptance criteria
- [ ] Vestria has **2 hero variants** (image, full-bleed video), rendered layout-identical in edit + published renderers.
- [ ] During generation (copy streaming), the manufacturer user picks **hero variant → cosmetic (variant/palette/surface)**; choices persist and drive the generated page.
- [ ] Editor: cosmetic changeable in the **header theme popover** (variant + palette + surface) with live update + autosave; **hero variant** changeable via section-toolbar **Change Layout** (vestria only).
- [ ] Video hero supports **separate desktop + mobile clips**, autoplay/loop/muted/playsinline + poster fallback; correct clip shown per viewport.
- [ ] **Self-serve upload:** two video slots on the hero upload to Blob via a video-capable route with MIME + size validation; poster/still settable.
- [ ] A **generation-time placeholder clip** shows before the user uploads.
- [ ] Service path + other templates unchanged; `LayoutChangeModal` stays disabled for non-vestria template modules.
- [ ] `tsc` + `test:run` + `build` green.

## Pilot / smallest slice
Vestria/manufacturer only (1:1). Suggested phase order so the urgent customer need ships first:

- **Phase B first (Axis B + video):** 2 hero variants + generation-time hero choice + section-toolbar swap + self-serve desktop/mobile video upload + poster/placeholder. → **Decision gate:** eyeball on the real pilot site before building the cosmetic axis.
- **Phase A next (Axis A cosmetic):** generation-time variant/palette/surface picker + editor header popover.

Rationale: the video hero is the concrete customer ask and is unblocked; the cosmetic axis is a broader look-system change that benefits from seeing the hero live first.
