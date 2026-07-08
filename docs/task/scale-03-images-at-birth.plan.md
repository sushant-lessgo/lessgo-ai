# scale-03 — images at birth · implementation plan

Branch: `feature/scale-03-images-at-birth`
Spec: `docs/task/scale-03-images-at-birth.spec.md`
Flag: `NEXT_PUBLIC_IMAGES_AT_BIRTH` (off = byte-identical to today)

## Overview

Wire the orphaned image machinery (`src/lib/generation/fetchImages.ts` + `src/lib/generation/imageSlots.ts`) into the product generation paths in `GeneratingStep.tsx` so flag-on generations reveal with palette-scored Pexels images in stockable slots, while customer-promised slots keep their existing labeled placeholders. Pilot scope: meridian + vestria, product onboarding only. Everything is behind a client-side flag; flag-off path is untouched.

## Progress log

- phase 1 slot map re-key + flag + expansion: DONE (review loops 1, ship; tsc clean, test:run 892 pass). Non-blocking: silhouette not expressible in ImageFetchSpec (moot, pilot has none); defensive-skip cases untested (optional).
- phase 2 fetch/query/score refactor + palette profiles: pending
- phase 3 orchestrator + GeneratingStep wiring: pending — NIT: plan line 147 test says `createInitialFinalContent`; real export is `buildMultiPageSkeleton` (use that). Also update stale `src/lib/README.md` (refs deleted `fetchPexelsImagesParallel`/`getImageSlotsForUIBlocks`) in phase 2.
- phase 4 measurement + manual QA gate: pending

<!-- RESUME ANCHOR: Phase 1 code written on feature/scale-03-images-at-birth, uncommitted. Next step: re-run impl-reviewer on the Phase-1 diff (files: src/lib/generation/flag.ts, imageSlots.ts, imageSlots.test.ts), then commit `feat(scale-03): phase 1 — slot map re-key + flag + expansion`, then Phase 2. Also uncommitted (pre-existing, intentional): .claude/agents/implementer.md (fable→opus). -->


## Slot inventory — honest full enumeration (verified against block source)

Every image-bearing element in both pilot templates, classified. `stockable:true` = generic/illustrative/decorative (legitimately stock); `stockable:false` = customer-promised brand asset (spec T2 rule: labeled placeholder, never stock).

**Meridian** (all blocks checked: TerminalHero, HairlineFeatureGrid, ThreeTierPricing, ProofWithLogoRail, ArcCTA, MeridianNavHeader, HairlineFooter, MeridianNewsletterCapture):

| Element | Block | Class | Why |
|---|---|---|---|
| `logo_image` | MeridianNavHeader | `stockable:false` | brand asset |
| — hero visual | TerminalHero | n/a | CSS terminal art, **no image slot** (PO ruling in file header) |
| — testimonial avatars | ProofWithLogoRail | n/a | decorative gradient circles, no slot (comment in file) |
| — logo rail | ProofWithLogoRail | n/a | typographic names (`logos_name_*`), no image element |
| — features/pricing/CTA/footer | rest | n/a | zero image elements (only CSS `mask-image`) |

→ **Meridian stockable surface = zero.** Not padded; there is nothing legitimately stockable to add without new block scope.

**Vestria** (all blocks checked: both heroes, AboutStats, ServicesGrid, IndustriesGrid, CatalogueGrid, ProcessRail, Materials, Quotes, ClientStrip, LeadForm, NavHeader, Footer):

| Element | Block | Class | Why |
|---|---|---|---|
| `industries.<id>.image` | VestriaIndustriesGrid | **`stockable:true`** | generic editorial sector shots — exactly what stock is for |
| `hero_image` | VestriaTailoredHero | `stockable:false` | promised "my photos" (placeholder: "Hero image") |
| `hero_video_poster` | VestriaFullBleedHero | `stockable:false` | promised media (poster→hero_image→placeholder chain) |
| `about_image` | VestriaAboutStats | `stockable:false` | placeholder literally says "Workshop / team image" — customer photo |
| `items.<id>.image` | VestriaCatalogueGrid | `stockable:false` | customer product photos |
| `logo_image` | VestriaNavHeader | `stockable:false` | brand asset |
| — services/process/materials/quotes/trust/contact/footer | rest | n/a | **zero image elements** (ClientStrip logos are typographic wordmarks) |

→ **Final stockable inventory for the pilot: `VestriaIndustriesGrid → industries.<id>.image`. That's it.** This is the exact list the implementer wires and QA checks — nothing else should show a stock image flag-on.

**Accepted pilot limitation (explicit):** flag-on visible change = industries sector cards only; meridian/saas flag-on is provably identical to flag-off; vestria hero/about/catalog correctly keep labeled placeholders per spec T2. This build is the *wiring infrastructure* — value compounds as hearth/lex/surge (image-heavier service templates) onboard onto the same seam. Do NOT stock-fill promised slots to pad the demo. Carried to the human merge gate as unresolved question #1.

## Design decisions (resolving the known tensions)

1. **Palette-shape mismatch → hand-authored profile table, `pickBestImage` scoring untouched.**
   `pickBestImage(result, mode, temperature, baseColor)` keeps its existing signature and scoring math (spec says "score by palette mode/temperature (existing)"; it's also what the deterministic unit test pins). The missing scalars come from a new hand-authored table `PALETTE_IMAGE_PROFILES: Record<VestriaPalette, {mode:'light'|'dark', temperature:'cool'|'neutral'|'warm', baseColor:string /*hex*/}>` added to `src/modules/templates/vestria/imageKeywords.ts` (8 entries, e.g. cobalt→`{light, cool, '#2f5fe0'}`, brass→`{light, warm, '#b08a3c'}`). No runtime OKLCH→HSL conversion code — a static table is simpler, reviewable, and deterministic. Vestria pages are bone/light throughout → `mode:'light'` for all v1 entries.

2. **Two seams are complementary, one path.** `imageKeywords.ts` (`PALETTE_IMAGE_KEYWORDS`) supplies the palette→mood phrase for the *query*; `imageSlots.ts` supplies the *slots*; `fetchImages.ts` fetches; `pickBestImage` + `PALETTE_IMAGE_PROFILES` score. `buildSearchQuery`'s legacy `vibe`/`VIBE_MODIFIERS` param is replaced by a `styleKeywords?: string` param fed from `PALETTE_IMAGE_KEYWORDS[paletteId]`; `VIBE_MODIFIERS` is deleted (orphaned, no other callers). No duplicate path is built.

3. **Fetch runs client-side in `GeneratingStep.tsx`.** Rationale: `fetchImages.ts` already POSTs the relative URL `/api/images/search` (browser-only design); palette lives in `useProductGenerationStore` right there; the per-page loop + merge point are right there; and collection slots (industries) need generated item titles, so fetch runs *after* each page's copy response, before `saveFC` — parallel across slots (100ms stagger, 5s per-fetch timeout ⇒ ≤ ~6s worst case for a 6-slot page, inside the <10s/page budget). Server route `/api/generate-copy` is untouched ⇒ flag-off byte-identical is trivial.
   Template data is consumed via **static leaf imports** of `vestria/imageKeywords.ts` (imports only `@/types/product` — no block code, firewall-safe; `GeneratingStep.tsx` already statically imports vestria leaf data like `defaultVestriaPalette`). No registry contract change needed for the pilot.

4. **`stockable` + T2 placeholders = existing empty-state rendering.** `ImageSlot` gains required `stockable: boolean`. Promised slots (`stockable:false`) get **no value written at all** — vestria blocks already render labeled hatched placeholders (`vs-ph`) when the element is empty, and the editor override path (`ImageToolbar`/`E.Img` upload writing a plain URL string into `elements[key]`) is untouched because we only ever write plain URL strings into slots we fill, and write nothing into promised slots. No new placeholder value shape ⇒ zero collision risk.

5. **Write target pinned — everything keyed by concrete `sectionId`, never `sectionType`.** (Verified in `src/modules/generation/multiPageAssembly.ts` `mergePageIntoFinalContent` and `GeneratingStep.tsx` `buildFinalContent`.)
   - Both content maps are keyed by `sectionId` (`${type}-${uuid}` via `sectionUid`/`crypto.randomUUID`), and **every content entry carries its own `.layout` field** — so injection needs NO sectionType→sectionId resolution step at all: iterate the content map's entries, look each entry's `.layout` up in the slot map, write into that same entry's `.elements`. Working by-`sectionType` is forbidden in this feature (a sectionType-keyed write against these maps silently writes nothing).
   - **Fan-out call site (per page, home AND non-home): pass `fc.pages[page.archetypeKey].content`** — the body-only, sectionId-keyed map `mergePageIntoFinalContent` just built for THIS page. Home shared-ref note: for the home page, `fc.content = { ...content }` is a shallow copy — the map is copied but the per-section objects are the **same references** as in `fc.pages[home].content`, so mutating `entry.elements` through the page entry updates the flat top-level view too (one write, both views). Header/footer live only in `fc.content`/`fc.chrome`, not in the page entry — irrelevant here (their only image element is `logo_image`, `stockable:false`).
   - **Single-page call site: pass `finalContent.content`** (the sectionId-keyed map from `buildFinalContent`).
   - Injection mutates `content[sectionId].elements[<flat key>]` or `content[sectionId].elements.industries[i].image` in place, **before** the save call that persists that object (`saveFC(fc)` / `saveDraft`), mirroring the `form_id` injection precedent in both functions.

6. **Rate limits: measure, don't build.** Pilot volume ≈ 3–6 Pexels calls per vestria site (industries section only). Phase 4 logs per-run request count + wall time (console + posthog event). KV `(query,palette)` cache deferred to a later scale-0x unless measurement says otherwise.

7. **Accepted risks (product decisions for the merge gate, not build items):**
   - **Pexels hotlinks in published HTML.** Injected URLs are raw Pexels CDN links; publish embeds them verbatim in the static export (no rehost to Blob, unlike the ImageToolbar upload path). Renders fine via plain `<img>`; risk = hotlink durability / no cleanup if Pexels retires a URL. Accepted for pilot; user swap-via-editor is the mitigation.
   - **No `next.config.js` remote-image pattern — confirmed NOT needed.** Both the edit primitive (`E.Img`) and the published primitive render plain `<img src>`, not `next/image` (verified in `vestria/blocks/editPrimitives.tsx` / `publishedPrimitives.tsx`). Implementer must NOT add a `remotePatterns` entry.
   - **Resume window widens ~6s.** Fetch runs between copy response and `saveFC`, so a tab-close mid-injection re-pays that page's copy+images on resume. Pre-existing failure class (copy already had this window), acceptable — one line, no mitigation built.

---

## Phase 1 — flag, slot map re-key, `stockable`, slot expansion

**Files touched**
- `src/lib/generation/flag.ts` (new)
- `src/lib/generation/imageSlots.ts`
- `src/lib/generation/imageSlots.test.ts` (new)

**Steps**
1. `flag.ts`: `export function isImagesAtBirthEnabled(): boolean { return process.env.NEXT_PUBLIC_IMAGES_AT_BIRTH === 'true'; }` — mirrors `src/lib/testimonials/flag.ts` idiom. `NEXT_PUBLIC_` because the only reader is the client component `GeneratingStep.tsx`.
2. `imageSlots.ts`:
   - Extend `ImageSlot`: add required `stockable: boolean`; add optional `collection?: { key: string; imageField: string; perItemQueryField?: string }`. Keep `orientation`/`modifier`/`useSilhouette`.
   - **Delete** the legacy `UIBLOCK_IMAGE_SLOTS` entries (leftCopyRightImage, centerStacked, splitScreen, imageFirst, SplitCard, VisualCTAWithMockup, LetterStyleBlock — all reference retired layouts; git history preserves them).
   - Re-key to the pilot inventory (see "Slot inventory" above — that table is normative):
     - meridian: header comment stating meridian has zero stockable slots (TerminalHero no-image PO ruling; `logo_image` = brand asset) — no entries.
     - `VestriaIndustriesGrid`: `[{ elementKey:'industries', stockable:true, orientation:'landscape', modifier:'industry sector professional', collection:{ key:'industries', imageField:'image', perItemQueryField:'title' } }]`.
     - Promised, documented with `stockable:false` so a future flip is one boolean: `VestriaTailoredHero` → `hero_image` (landscape), `VestriaFullBleedHero` → `hero_video_poster` (landscape), `VestriaAboutStats` → `about_image` (landscape), `VestriaCatalogueGrid` → collection `items`/`image` (square).
   - Add `expandImageSlots(content: Record<string /* sectionId */, { layout?: string; elements?: Record<string, any> }>): ImageFetchSpec[]` where `ImageFetchSpec = { sectionId: string; elementPath: string /* 'about_image' | 'industries.<itemId>.image' */; collectionWrite?: { key: string; itemId: string; imageField: string }; orientation; queryModifier: string }`.
     - **Keyed by `sectionId`, driven by each entry's own `.layout`** (design decision 5): for each `[sectionId, entry]`, look up `UIBLOCK_IMAGE_SLOTS[entry.layout]`; skip missing/unknown layouts.
     - Stockable-only; collection entries expanded per generated item read from `entry.elements[collection.key]` (one spec per item, itemId captured for the write-back, optional `perItemQueryField` value appended to `queryModifier`); silhouette handling preserved.
     - `sectionType` does not appear in the spec shape at all.
   - Keep `getImageSlotsForUIBlocks` untouched this phase **only because `fetchImages.ts` still calls it**; it is deleted in Phase 2 (tracked, not forgotten).
3. Tests (`imageSlots.test.ts`): sectionId-keyed vestria content fixture (realistic `${type}-abc12345` ids + per-entry `layout`) → expansion yields only stockable specs keyed by sectionId; promised slots excluded; collection expansion produces one spec per generated industries item with itemId + title in the modifier; meridian-layout entries → empty; unknown layout → empty; section present but empty `industries` array → empty.

**Verification:** `npx tsc --noEmit` + `npm run test:run` (new tests green; `ImageSlot.stockable` addition keeps `fetchImages.ts` compiling since it only reads existing fields).

---

## Phase 2 — fetch/query/score refactor + vestria palette profiles

**Files touched**
- `src/lib/generation/fetchImages.ts`
- `src/lib/generation/imageSlots.ts` (delete `getImageSlotsForUIBlocks` only)
- `src/modules/templates/vestria/imageKeywords.ts`
- `src/lib/generation/fetchImages.test.ts` (new)

**Steps**
1. `fetchImages.ts`:
   - Replace `vibe?: string` / `VIBE_MODIFIERS` with `styleKeywords?: string` threaded into `buildSearchQuery` (query = first 2 categories + spec modifier + styleKeywords, ~trimmed; cap total to ~8 words to keep Pexels relevance).
   - Refactor the fetch core to accept Phase 1 specs: `fetchImagesForSpecs(specs: ImageFetchSpec[], { categories, styleKeywords }): Promise<Map<string /* `${sectionId}.${elementPath}` */, ImageFetchResult>>` — same stagger (100ms), timeout (5s), silhouette short-circuit, error-swallowing shape. Delete `fetchPexelsImagesParallel` (orphaned; the new orchestrator is the only caller).
   - **Delete `getImageSlotsForUIBlocks` from `imageSlots.ts`** — its sole caller was `fetchPexelsImagesParallel`; dead after this refactor. Do not leave it "to keep compiling."
   - `pickBestImage` scoring math and signature **unchanged**; leave its `console.log` as-is (flag-on-only path).
2. `vestria/imageKeywords.ts`: add `export const PALETTE_IMAGE_PROFILES: Record<VestriaPalette, { mode:'light'|'dark'; temperature:'cool'|'neutral'|'warm'; baseColor:string }>` — 8 hand-authored entries (all `mode:'light'`; temperature from accent family: cobalt/teal/indigo=cool, brass/safety/claret=warm, emerald/aubergine=cool-or-neutral judgment call; baseColor = hex approximation of the accent). Keep `PALETTE_IMAGE_KEYWORDS` as the query phrase source.
3. Tests (`fetchImages.test.ts`):
   - **Deterministic `pickBestImage` unit test (acceptance item):** fixed candidate fixture (5 candidates with known avgColors) × fixed `(mode, temperature, baseColor)` → asserts the exact winning URL for at least a light/cool, light/warm, and dark/neutral case, plus the no-candidates fallback (`imageUrl` passthrough).
   - `buildSearchQuery` composition test (categories + modifier + styleKeywords, empty fallback `'business professional'`).
   - `fetchImagesForSpecs` with mocked `fetch`: results keyed `${sectionId}.${elementPath}`, timeout/error → `{imageUrl:null, error}` not a throw.

**Verification:** `npx tsc --noEmit` + `npm run test:run`.

---

## Phase 3 — orchestrator + GeneratingStep wiring (flag-gated)

**Files touched**
- `src/lib/generation/imagesAtBirth.ts` (new)
- `src/lib/generation/imagesAtBirth.test.ts` (new)
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx`

**Steps**
1. `imagesAtBirth.ts` (client-safe helper, no React): `injectImagesForPage(opts: { content: Record<string /* sectionId */, SectionData>; templateId: string; paletteId: string; categories: string[] }): Promise<{ requested: number; filled: number; ms: number }>`
   - **`opts.content` is the exact object the caller will save** — mutated in place (design decision 5). No `sectionLayouts` param: each entry's `.layout` drives the slot lookup via `expandImageSlots(content)`.
   - No-op unless `templateId` ∈ {`meridian`,`vestria`} (pilot allow-list). Resolve `styleKeywords` = `PALETTE_IMAGE_KEYWORDS[paletteId]` and profile = `PALETTE_IMAGE_PROFILES[paletteId]` via static leaf import from `@/modules/templates/vestria/imageKeywords` (decision 3 — leaf data only, firewall-safe); meridian resolves to zero specs (empty slot map) and returns `{requested:0,...}`.
   - `fetchImagesForSpecs` → for each result with candidates, `pickBestImage(result, profile.mode, profile.temperature, profile.baseColor)` → write the plain URL string: flat specs → `content[spec.sectionId].elements[spec.elementPath]`; collection specs → find item by `spec.collectionWrite.itemId` in `content[spec.sectionId].elements[key]` array and set its `imageField` (skip silently if the item vanished). Null/error results write **nothing** (block placeholder stands).
   - Whole function wrapped so any throw resolves to a logged no-op — image failure must never fail a paid generation.
   - Returns counts + wall time for Phase 4 measurement.
2. `GeneratingStep.tsx` — two call sites, both `if (isImagesAtBirthEnabled())`:
   - **runFanOut (multi-page vestria):** after `mergePageIntoFinalContent(...)`, before `saveFC(fc)`: `await injectImagesForPage({ content: fc.pages[page.archetypeKey].content, templateId:'vestria', paletteId: <store pick or defaultVestriaPalette, matching the styleInfo/save logic>, categories: <ob.understanding productCategories-or-categories — implementer verifies exact field name in MultiPageOnboardingData> })`. **Exactly this object for home AND non-home pages** — home's section objects are shared refs with `fc.content`, so the flat view updates too (decision 5). Images persist with the page (resume-safe: a completed page already has its images; retried pages refetch).
   - **runCopyAndSave (single-page: meridian/saas AND the `explicitVestria && !sitemap` single-page vestria fallback):** after `buildFinalContent(...)`, before the `saveDraft` POST: `injectImagesForPage({ content: finalContent.content, templateId: storeTemplateId-or-meridian, paletteId, categories })` from the existing save-time variables. **Not a guaranteed no-op:** meridian resolves to zero specs, but the single-page vestria fallback CAN carry an industries section and will fetch/fill here — QA covers this path explicitly (Phase 4).
   - Emit one posthog event `images_at_birth` with `{requested, filled, ms, page}` when the flag is on (measurement hook).
3. Tests (`imagesAtBirth.test.ts`, mocked fetch):
   - **(a) Real-assembly fixture (mis-wire guard, mandatory):** build `fc` via the REAL `createInitialFinalContent` + `mergePageIntoFinalContent` from `@/modules/generation/multiPageAssembly` with a fixture `SitemapPage` (non-home page containing an industries section with generated items) — NOT a hand-built by-sectionType map. Run `injectImagesForPage(fc.pages[<key>].content, ...)` → assert every industries item `image` filled with the top-scored candidate URL, read back **through `fc`** (`fc.pages[<key>].content[<sectionId>].elements.industries[i].image`).
   - **(b) Home shared-ref case:** merge a home page the same way, inject via `fc.pages[home].content`, assert the write is visible in BOTH `fc.pages[home].content` and `fc.content` (same section object).
   - **(c)** promised `hero_image`/`about_image` untouched (remain absent); **(d)** meridian-only content → deep-equal unchanged, zero fetches; **(e)** fetch failure → content unchanged, no throw; **(f)** flag-off call-site behavior covered by code inspection (call sites gated) + full suite green.

**Verification:** `npx tsc --noEmit` + `npm run test:run` + `npm run build` (GeneratingStep is on the onboarding critical path).

---

## Phase 4 — measurement + manual QA 🚧 **HUMAN GATE (before merge)**

**Files touched**
- none expected (tuning-only edits, if any, limited to `src/lib/generation/imageSlots.ts` modifiers and `src/modules/templates/vestria/imageKeywords.ts` phrases/profiles)

**Steps**
1. Flag OFF (`npm run dev`, unset var): run a saas and a manufacturer onboarding end-to-end — confirm behavior identical to main (no image writes, no new network calls in devtools; grep saved draft JSON for absent stock URLs).
2. Flag ON (`NEXT_PUBLIC_IMAGES_AT_BIRTH=true`) — **expected visible change is exactly the stockable inventory: industries cards, nothing else**:
   - **Manufacturer (vestria multi-page) fixture:** every industries card has an image; images plausibly match sector + palette mood (human judgment — this is exactly what automation can't score); hero/about/catalog show their labeled placeholders (CORRECT per spec, not a defect); editor `E.Img` upload still overrides a generated image; publish and confirm editor↔published parity for filled images (published HTML embeds the raw Pexels URL — accepted hotlink risk, decision 7).
   - **Single-page vestria fallback** (`?template=vestria`, no sitemap): if the strategy includes an industries section, its cards fill via the runCopyAndSave seam — verify at least one run.
   - **SaaS (meridian) fixture:** zero visual change (zero stockable slots) — confirm no Pexels calls fired.
   - Record from console/posthog: Pexels request count per run + added wall time per page. Acceptance: < ~10s/page added. Note numbers in the audit → answers spec open question #1 (expected ≈3–6 requests/site ⇒ KV cache deferred).
3. Human eyeballs generated pages and signs off on image quality AND the accepted-limitation trade (stockable surface = industries only for the pilot) before merge. Merge to main is the usual human gate; flag stays OFF in prod env until PO flips it.

**Verification:** manual checklist above + `npm run test:run` + `npm run build` green on the branch before merge sign-off.

---

## Unresolved questions

1. **Stockable surface = vestria industries only** (honest enumeration above; meridian has zero, vestria hero/about/catalog are spec-promised placeholders). Accept as pilot wiring — value lands when hearth/lex/surge onboard — or widen scope now (new block slots = new scope)?
2. Confirm vestria split as enumerated: industries=stock; hero/poster/about/catalog/logo=promised. Flip any?
3. Pexels hotlinks embedded in published static HTML (no Blob rehost/cleanup) — accept for pilot?
4. Industries temperature judgment calls (emerald/aubergine cool vs neutral) — fine to leave to implementer + Phase 4 eyeball?
5. Posthog `images_at_birth` event OK, or console-only measurement?
