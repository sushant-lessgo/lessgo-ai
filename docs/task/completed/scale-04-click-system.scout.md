# scale-04 — scout findings (for planner)

Consolidated from 5 read-only scouts. Pointers + shapes only.

## 1. Destination resolver + CTA/button model
- **`src/utils/resolveCtaHref.ts`** = the one dumb resolver (published only). Signature:
  ```ts
  interface CtaButtonConfig { type?: 'link'|'form'|'link-with-input'|'page'; formId?; behavior?: 'scrollTo'|'openModal'; url?; pageId?; pathSlug? }
  resolveCtaHref(buttonConfig: CtaButtonConfig|undefined, forms: Record<string,any>|undefined, fallback='#cta'): string
  ```
  Branches on `type`: `page`→`pathSlug`; `link`/`link-with-input`→`url`; `form`→`'#form-section'` (if formId resolves); else fallback. Sibling `externalLinkProps(href)`→`{target,rel}` for `^https?://`.
- **~28 published call sites** — every template's CTA/Hero/Nav/Pricing/Footer `.published.tsx` calls `resolveCtaHref` independently. No edit-side `.tsx` calls it except footers (e.g. `meridian/.../HairlineFooter.tsx`).
- **Storage:** `content[sectionId].elementMetadata[elementKey].buttonConfig`. Typed `any` at boundary (`src/types/core/content.ts:94`).
- **3 divergent `ButtonConfig` interfaces** disagree on fields: `resolveCtaHref.CtaButtonConfig`, modal `ButtonConfigurationModal.tsx:41-61` (richest: adds `text,ctaType:'primary'|'secondary',inputConfig,icons`), `forms/FormConnectedButton.tsx:14-25`. Unification target.
- **Write path:** `ButtonConfigurationModal.tsx` builds buttonConfig (~L202) → `setSection(sectionId,{elementMetadata:{[key]:{buttonConfig}}})`. Collection buttons keyed `<collection>_cta_<id>` (`getCollectionCtaRef`).
- **Edit-side click:** imperative — `src/utils/ctaHandler.ts` (`createCTAClickHandler`) + `forms/FormConnectedButton.tsx` (window.open/scroll). No shared model with published path.
- **Role today is fragmented across 3 notions:** element-key naming (`cta_text` vs `secondary_cta_text`, CSS `--primary`/`--ghost`); `buttonConfig.ctaType` (drives form placement only — `sectionHelpers.ts` `findPrimaryCTASection`); `ctaHandler` `variant`. Not unified.

## 2. The 6 LinkTargetPopover copies (DELETE → 1 shared)
- Files (byte-for-byte identical except doc comment): `meridian|techpremium|vestria|surge|lumen|granth/components/LinkTargetPopover.tsx`.
- **Write a bare `href` STRING** via `onChange(href)`: section→`"#anchor"`, page→`"/pathSlug"`, custom→verbatim (`tel:`/`mailto:`/`wa.me`/https). Props: `href, sectionOptions[{value,label}], pageOptions?, onChange, triggerClassName?`.
- **Call sites:** meridian `MeridianNavHeader.tsx:110`,`HairlineFooter.tsx:249`; techpremium `TechPremiumNav.tsx:113`,`TechPremiumFooter.tsx:163`; surge `WarmNavHeader.tsx:113`,`ContactFooterRich.tsx:274`; lumen `LumenNav.tsx:103`,`LumenFooter.tsx:132,160`; vestria+granth via own `blocks/editPrimitives.tsx:119` (re-exported through `index.ts`).
- Replacing = update 6 import lines + 2 `index.ts` re-exports. Callers currently do `onChange=(href)=>patch({href})` → must change to write `Link` objects.

## 3. Analytics beacon + dashboard
- **Source beacon:** `src/lib/staticExport/analyticsGenerator.js` → built to `public/assets/a.v1.js` via `scripts/buildAssets.js` (Terser; rebuild after edit).
- **No explicit conversion event.** `initCTATracking` (L117-130) delegates clicks on `[data-lessgo-cta]` → fires `cta_click` with `{ctaText,ctaHref}` (NO role, NO placement). `form_submit` fired via `window._lessgoTrack`.
- **Base payload:** `{event,pageId,slug,timestamp,url,referrer,sessionId,deviceType,...UTM,...customData}`.
- **API** `src/app/api/analytics/event/route.ts`: `AnalyticsEventSchema` (Zod, L22-44) enum `['pageview','cta_click','form_submit']`; strips unknown fields. Upsert on `slug_date`. `ctaClicks++` on cta_click; **`formSubmissions` + `desktop/mobile/tabletConversions` ++ on form_submit** — i.e. **THE COUNTED CONVERSION = form_submit, NOT cta_click.**
- **Model** `prisma/schema.prisma:231-269` `PageAnalytics`: `formSubmissions,conversionRate,ctaClicks`, device split `*Views/*Conversions`, JSON `topReferrers,topUtmSources`. Mirror JSON pattern for per-placement (`ctaPlacements` Json?).
- **Dashboard:** `src/app/dashboard/analytics/[slug]/page.tsx` (fetch+totals) → `components/MetricsCards.tsx` (Conversions=submissions, CTA Clicks=ctaClicks). Per-dimension precedent to clone: `components/DeviceBreakdown.tsx`.
- **Stamping today:** `src/components/published/CTAButtonPublished.tsx:48,59` sets `data-lessgo-cta=""` — no role, no placement.
- **⚠ Decision:** spec wants primary+secondary CTA clicks counted as conversions with `{role,placement}`; today only form_submit counts. Planner must decide: repurpose cta_click counting vs new metric; verify section wrappers expose an id in published renderer for `placement`.

## 4. Brief.goal + derived-link sources
- **⚠⚠ BIGGEST GAP:** `Brief` (`src/lib/schemas/brief.schema.ts`, type `@/types/brief`) is a **CONTRACT ONLY — zero persistence, zero readers.** `classify.ts:156` builds an in-memory draft. **No DB column persists Brief.** GOAL_REF (render-time resolve of primary buttons from `Brief.goal`) has nothing to read → **Brief→project storage + read path must be built first (or scoped).**
- **`goal` shape:** `{ intent: GoalIntent, mechanism: GoalMechanism, destination?: string|string[] }`. Vocab FROZEN in `src/modules/goals/vocabulary.ts` (18 intents, 5 mechanisms M1 on-site form / M2 direct channel / M3 redirect / M4 subscribe-follow / M5 anchor; `goalIntentMeta` intent→allowed mechanisms). `destination` = where GOAL_REF resolves.
- **socialProfiles:** in Brief (`brief.schema.ts:37` `{platform,url}[]`, scrape-prefilled by `v2/scrape-website:249` + `v2/understand:136`). BUT editor uses a **different, richer** `SocialMediaConfig` store (`state.ts:135` `{items:{id,platform,url,icon,order}[]}`). New D13 panel + Brief↔config bridge MISSING.
- **Sitemap/pages:** `ProjectPage` table (`schema.prisma:91-105`; home `pathSlug='/'`). `getPagesList()` (`hooks/editStore/pageActions.ts:356`); `buildPageLinkOptions(pages,currentPageId)` (`utils/pageLinks.ts`)→`[{value:pathSlug,label:title}]`. Cross-page CTA already resolves (`resolveCtaHref type:'page'`). **Ready source for nav + cross-page.**
- **Legal:** `LegalPages.privacy` only (`state.ts:153`); `/api/generate-privacy-policy` exists; `PrivacyPolicyLink.tsx` builds `{basePath}/privacy`; `Footer.tsx:43` hardcodes `/privacy`. No terms/broader site-settings object.
- **Nav:** **HARDCODED per-block** (`nav_items:NavItem[]` inline per header, e.g. `TechPremiumNav.tsx:23,45`). Store-level `NavigationConfig` exists but unused for derivation. **nav←sitemap derivation MISSING** (must feed `getPagesList` into headers).

### Derived-link scorecard
| Source | Exists? | Missing |
|---|---|---|
| nav ← sitemap | partial (`getPagesList`) | auto-derivation; nav hand-authored per block |
| legal ← settings | yes (privacy only) | terms/broader; footer hardcodes path |
| social ← Brief.socialProfiles | partial (Brief field + separate store) | new panel (D13) + Brief persistence + bridge |
| cross-page ← slugs | mostly built | — |

## 5. Dual-renderer + parity test
- Edit `LandingPageRenderer.tsx` / Published `LandingPagePublishedRenderer.tsx`; both dispatch via registry `resolveBlock(type,'edit'|'published')` (dispatch firewall). Registries `componentRegistry.ts` / `.published.ts`.
- **Static export:** `src/lib/staticExport/htmlGenerator.ts:73` `generateStaticHTML()` → `renderToStaticMarkup(LandingPagePublishedRenderer)`. All published CTA hrefs flow through published renderer → each block's `resolveCtaHref`. No separate export href logic → fixing published renderer covers static output.
- **Parity test:** `src/modules/templates/__tests__/renderParity.meridian.test.tsx`. Seeds store from `MERIDIAN_BLOCK_MOCKS`, renders edit vs published to `renderToStaticMarkup`, strips to `visibleText`, asserts symmetric text parity (L106-125).
  - **⚠ href is EXCLUDED** — `NON_VISIBLE_KEY` regex (L72) drops `href`, and only `visibleText` (tags stripped) compared → anchor `href` never inspected. Extending for CTA href needs **attribute-level `<a>`/button href comparison** (parse both HTML strings), and it's **meridian-only** (per-template coverage TBD).
  - **⚠ Edit blocks mostly emit NO href anchor** (render editable button via `MeridianEditable isButton`) — only some (footers) emit href. True edit↔published href parity likely requires edit blocks to also emit resolved href in preview mode before comparison is meaningful.
