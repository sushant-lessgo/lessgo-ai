# editor-trust-truth — Task A audit (image alt-text: truth)

## Files changed
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx` — removed the Alt Text control and its dead wiring.

## Ruling
Option B (coordinator): the Alt Text control was silently no-op'ing and there is no
truthful way to persist alt within this phase's scope, so the control is removed.
Real alt-text support becomes a **phase-3 image-primitive requirement**: both the
edit and published renderers must read `elementMetadata[key].alt` via the shared
image primitives (see "Follow-up" below).

## Investigation summary — why the save could not be wired
`handleAltTextSave` called a stub `executeAction('update-alt-text', …)` that only
`console.warn`ed — user alt text was silently discarded. The acceptance bar was to
persist alt "where the PUBLISHED renderer actually reads it." Investigation found
**no published renderer reads a stored alt field.** Every published `<img>` either:

1. **Hardcodes `alt=""`** — e.g. `src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.published.tsx:69` (`<img src={props.hero_image} alt="" … />`); the editor `.tsx` twin matches (line 161). The static-export behavior JS (`src/lib/staticExport/naayomBehaviors.js`, `lumenBehaviors.js`) also emits `alt=""`.
2. **Derives alt from a *sibling* content field** (title/name/caption/badge_text) — e.g. Lumen hero `alt={props.badge_text || 'Hero portrait'}`, TechPremium `alt={item.name || ''}`, granth/vestria `E.Img` primitives pass `alt={content.name}` / `alt={item.title}` from `.core.tsx`.

Corroborating searches, all negative:
- `alt={…\.(alt|altText)}` across `src`: zero published readers (only the toolbar's own stock-photo grid).
- `_alt` / `image_alt` / `imageAlt` / `altText` field convention in `src/modules/templates`: none.
- `.alt` / `altText` in static-export `.js`: none.
- `elementMetadata` (`content[sectionId].elementMetadata[key]`) exists but is read only for `buttonConfig`/`cta` (`src/utils/ctaHandler.ts`, `resolveCtaHref.ts`); no image renderer reads `elementMetadata[key].alt`.
- `src/components/published/ImagePublished.tsx` (takes an `alt` prop) is dead — imported only by its own `index.ts`, used by zero blocks.
- The store's `generateImageAltText` (`src/hooks/editStore/formsImageActions.ts:665`) is a mock with no consumer.

Storing alt in `elementMetadata` would persist it but nothing would render it →
"faked success," which the phase forbids. Meeting the bar requires editing ~40
published block renderers (out of this phase's Files-touched), hence Option B.

## What changed in ImageToolbar.tsx
Removed, all internal single-use / dead wiring:
- `import { AdvancedActionsMenu }` (imported, never rendered — only "removed for MVP" comment stubs remained).
- `import { TextInputModal }` (only the alt modal used it).
- State: `showAdvanced` / `setShowAdvanced`, `showAltTextModal`, `currentAltText`; ref `advancedRef`.
- The stub `executeAction` (its sole caller was `handleAltTextSave`; now zero callers).
- The click-outside `useEffect` gated on `showAdvanced` (dead: nothing ever set it true).
- `handleAltText` + `handleAltTextSave` handlers.
- The `'alt-text'` entry in `primaryActions`.
- The Alt Text `<TextInputModal>` JSX block.

Left intact (per ruling): Replace / Stock Photos / Edit / Delete actions and all
their handlers. The now-unused `accessibility` entry in the `ImageIcon` lookup map
was left as-is (harmless dead map key; touching it is outside the minimal removal).

## Verification
- `npx tsc --noEmit` — clean (no output).
- No targeted vitest test file exists for ImageToolbar; none run.
- Removed symbols were all file-internal — no external importers.

## Follow-up (phase 3, not done here)
Canonical alt store = `elementMetadata[key].alt`. `handleAltTextSave` would write it
via `setSection` (pattern already used by `src/components/toolbars/ButtonConfigurationModal.tsx:371`),
update the on-screen `<img alt>` immediately, and the shared image primitives
(`editPrimitives.tsx` / `publishedPrimitives.tsx` `E.Img`, plus per-block `<img>`)
would read `alt={elementMetadata?.[key]?.alt ?? <existing sibling / ''>}` in BOTH
`.tsx` and `.published.tsx` (dual-renderer parity). That reintroduces the control
truthfully.

## Open risks
- None functional. Cosmetic: the `accessibility` icon map entry is now dead code.
