# onboarding2 — implementation audit

## Phase 1 — Full-bleed video hero block pair + element schema

**Branch:** `feature/onboarding2` (guard verified before any edit).

**Files changed**
- `src/modules/templates/vestria/blocks/Hero/VestriaFullBleedHero.core.tsx` (NEW)
- `src/modules/templates/vestria/blocks/Hero/styles.ts`
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.tsx`
- `src/modules/templates/vestria/blocks/Hero/VestriaTailoredHero.published.tsx`
- `src/modules/audience/product/elementSchema.ts`
- `src/modules/templates/vestria/coreParity.test.ts`
- `src/modules/templates/vestria/registration.test.ts`

### Per-file detail

**`VestriaFullBleedHero.core.tsx` (new)** — single-source full-bleed hero core, ported from `template-design/Vestria - Uniform Manufacturing v2 (full-bleed hero).html`. Plain server-safe module: no `'use client'`, no hooks, no editPrimitives import — renders only through injected `VestriaPrimitives` (passes the coreParity FORBIDDEN scan). Structure: dark section → absolute media layer (poster `E.Img` + up to two `<video>`s) → `.vs-heroFull__veil` gradient → centered tag (`vs-tag vs-center vs-on-dark`) / h1 (`vs-display`, white, italic accent `em`) / lede / primary (`vs-btn vs-accent`) + ghost CTA → bottom stat row. Content type `VestriaFullBleedHeroContent extends VestriaHeroContent` + 3 media keys.
- Video slots: desktop = `hero_video_desktop`, mobile = `hero_video_mobile`. Each `<video>` rendered ONLY when its clip URL resolves; if only ONE clip exists it renders for all viewports (no `--desktop/--mobile` class → no media-query hiding). Both carry `autoPlay loop muted playsInline poster preload="metadata"`.
- No clip at all → NO `<video>`; poster-only background. Poster chain: `hero_video_poster` → `hero_image` → hatched placeholder. The bg `E.Img` binds its `elementKey` to whichever key is being displayed (`hero_video_poster` if set, else `hero_image`) so an edit-mode Replace writes the key the user is looking at.
- Stats: first stat = `stamp_value`/`stamp_label` (when present), then `values[]` via `E.List` (min 0 max 3) mapped **title → stat value (big display b), kicker → stat label (mono span)**; `description` unused but preserved (content-preserving swaps).

**`styles.ts`** — appended `vs-heroFull*` CSS block (before `HATCH_PLACEHOLDER_CSS`), ported 1:1 from the mock: `min-height:min(92vh,880px)`, `background:var(--dark)`, veil gradient, centered inner stack, on-dark ghost button, `hf-stat` row, `@media(max-width:680px)` h1/stat shrink + desktop↔mobile `<video>` `display` toggle. Two adaptations: (1) `.vs-heroFull__bg` sized via `width/height:100%` instead of `position:absolute` because the edit Img primitive forces inline `position:relative` — identical result in both renderers (parity by construction); (2) `.vs-heroFull__statsList{display:contents}` so `E.List`'s wrapper div doesn't break the flex stat row. Tailored-hero CSS untouched.

**`VestriaTailoredHero.tsx` (edit wrapper)** — branches on `layout` from `useVestriaBlock` (reads authoritative `content[heroId].layout`): `'VestriaFullBleedHero'` → full-bleed core, default/unknown → tailored core. Same provider/ctx as before.

**`VestriaTailoredHero.published.tsx` (published wrapper)** — identical branch; layout read via `props.content?.[props.sectionId]?.layout` (the published renderer passes the full content map + sectionId but not a layout prop). Server-safe, no client imports.

**`elementSchema.ts`** — added `VestriaFullBleedHero` entry (sectionType `'hero'`) directly after `VestriaTailoredHero`: SAME copy keys/defaults/fillModes as tailored (tag_text, headline, lede, cta pair, secondary cta pair, hero_image, stamp_value/stamp_label, values[] min0/max3) PLUS `hero_video_desktop`/`hero_video_mobile`/`hero_video_poster` as `fillMode:'manual_preferred'` (never enters AI generation — no prompt-builder change, firewall intact). NOT added to `VESTRIA_LAYOUT_NAMES` (that map is the per-section default layout; the variant is selected via `content[heroId].layout`). Header doc-comment updated 12→13 layouts. Entry flows automatically into `layoutElementSchema` + `productElementSchema` spreads.

**`coreParity.test.ts`** — core count 12→13; added full-bleed renderToStaticMarkup fixture; added a dedicated `<video>` contract test: with clips → exactly 2 videos, each tag contains `muted`, `autoplay`, `playsinline`, `poster="…"`; without clips → zero `<video>` and the `hero_image` poster URL present.

**`registration.test.ts`** — new `VestriaFullBleedHero variant schema` describe: `getSchemaDefaults('VestriaFullBleedHero') !== null` + sectionType `'hero'`; shared-copy-contract key check (swap is content-preserving); 3 media keys asserted `manual_preferred`.

### Orchestrator open-question decisions applied
1. **No bundled placeholder clip** — `public/assets/vestria-hero-placeholder.mp4` NOT created. No clip → `<video>` omitted, poster-only rendering (`hero_video_poster` → `hero_image` → placeholder). Avoids the `validateAndResolveAssetURLs` poster-rewrite gap (no relative asset URLs introduced).
2. **Stats reuse existing keys** — stamp pair + `values[]` (title→value, kicker→label); zero new stat copy keys.
3. **Media keys** `hero_video_desktop/mobile/poster` added with `fillMode:'manual_preferred'`.

### Deviations / judgment calls (in-scope)
- `values[]` field→stat mapping wasn't pinned by the orchestrator ("each item's fields map to stat value+label"): chose **title → stat value, kicker → stat label** (kicker's mono-uppercase styling matches the mock's stat label; description ignored but preserved). Conservative, reversible.
- Poster-only fallback uses `E.Img` (not a bare `<img>`) so the background image is already editable in the editor pre-Phase-2; its elementKey follows the displayed key (`hero_video_poster` if set, else `hero_image`).
- Single-clip case renders ONE viewport-agnostic `<video>` instead of two identical hidden/shown ones (avoids double-fetch; still the CSS `@media display` toggle when both clips exist).
- `elementSchema.ts` header comment updated 12→13 (same file, doc accuracy).

### `muted` static-markup check
Verified empirically on the repo's React (18.3.1): `renderToStaticMarkup(<video autoPlay loop muted playsInline …/>)` emits `<video autoplay="" loop="" muted="" playsinline="" …>` — `muted` IS present, no workaround needed. Locked in permanently by the new coreParity test (regex over `<video…>` tags asserts `muted`/`autoplay`/`playsinline`/`poster`), so a React upgrade that drops `muted` turns the suite red.

### Test / build results
- `npx tsc --noEmit` — clean, zero errors.
- `npm run test:run` — **51 files passed | 1 skipped; 670 tests passed | 2 skipped** (coreParity at 13 cores + video contract; registration variant-schema asserts green).
- `npm run build` — green (published CSS + assets + next build completed).
- `git status --porcelain` — only the 7 Files-touched entries modified/created (plus pre-existing untracked plan/spec docs). Zero out-of-scope diffs.

### Open risks
- Manual dev check still pending (per plan): set `content[heroId].layout = 'VestriaFullBleedHero'` on a vestria draft and eyeball editor/preview/publish; automated coverage proves markup + schema, not visuals.
- Until Phase 2 upload UI, the only in-editor media control on the full-bleed hero is the poster-image Replace affordance; clips can only arrive via draft-content edits.
- Generated `values[]` copy authored for the tailored hero (e.g. title "Quality Assurance") will read as prose, not numbers, in the stat row until regenerated/edited — accepted consequence of the reuse-keys decision.
- `.vs-heroFull__stats` renders (dashed-top stat borders) whenever stamp or values exist — with tailored-style prose values this is cosmetically fine but worth an eyeball at the pilot gate.
