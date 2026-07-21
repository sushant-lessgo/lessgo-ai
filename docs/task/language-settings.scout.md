# language-settings — scout findings (condensed)

Gathered by 5 scout agents, 2026-07-21. Orchestrator digest — planner input.
**These findings supersede the spec where they conflict** (the spec's onboarding
description is stale). Everything below is file:line-verified.

---

## A. Locale data model (i18n Phase 1 — shipped, do NOT rebuild)

- `LocaleConfig` = `{ locales: string[]; defaultLocale: string }` — `src/types/core/content.ts:75-80`.
  **No `switcherStyle` field** → decision 7 needs a net-new field + zod + save/publish plumbing.
- Overlay: `LocaleContentOverlay` = `locale → sectionId → elementKey → string|string[]`
  (`content.ts:87-93`).
- Store state: `src/types/store/state.ts:236-249` — `localeConfig?: LocaleConfig|null`,
  `activeLocale: string`, `localeContent`, `localeEngaged` (session flag: omit-vs-explicit-clear).
- Persistence: TOP-LEVEL keys on the draft payload → merged into `Project.content.localeConfig`.
  Save `hooks/editStore/persistenceActions.ts:379-382` (+`:631-636` for `localeContent`);
  load `:467-468` (activeLocale re-derived to default), `:513-515` derives `localeEngaged`.
  Zod: `src/lib/validation.ts:60-63`. Routes: `api/saveDraft`, `api/loadDraft`, `api/publish`.
- **Brand-new monolingual defaults**: `localeConfig = null`, `activeLocale = 'en'`,
  `localeContent = {}`, `localeEngaged = false` → **nothing written to DB** (byte-identical to
  legacy). This is the zero-diff regression contract in the spec's Constraints.
- Locale codes = **bare lowercase ISO-639-1**, not `en-US`, not objects.
  `SUPPORTED_LOCALES` (12) — `src/lib/i18n/localeContent.ts:18-22`, pinned by
  `localeContent.test.ts:133`. Display-name map exists only in
  `LanguageToggle.tsx:17-33` (`LOCALE_DISPLAY_NAMES` / `localeLabel`) — export/reuse, don't duplicate.
- Read path funnel: `src/lib/i18n/localeContent.ts` → `resolveLocaleElements()` (L48-74),
  `getEffectiveElementValue()` (L83-93). Editor read site:
  `src/modules/templates/shared/useTemplateBlock.ts:51-52,68-71`; shared blocks
  `LeadForm.tsx:34-42`, `FollowStrip.tsx:31-39`, `StoreBadges.tsx:33-41`.
- Write path: `hooks/editStore/contentActions.ts:25-37` (non-default locale → overlay);
  structure/media always base (`collectionHelpers.ts:18-24`).

## B. The two header locale controls (spec conflates them — they are separate)

1. **`LocaleSettings.tsx`** (`src/app/edit/[token]/components/editor/LocaleSettings.tsx`)
   = the **globe / config popover**. THIS is what the spec retires.
   - `if (!isMultiLocale(localeConfig)) return null;` at **L54** — the gate to remove.
   - Popover chrome to DROP when re-homing: local `open` state + document-mousedown
     outside-click effect (L36-49), trigger button + `absolute … z-50` shell (L131-153).
   - Its mutators are **local closures, not store actions**: `addLocale` (L69-89),
     `removeLocale` (L91-128) — they call `api.setState(immer recipe)` directly, set
     `localeEngaged = true` + `persistence.isDirty = true`, then `flush()` →
     `triggerAutoSave?.()`. **Recommend extracting to real store actions** (currently
     duplicated-by-simulation in `hooks/editStore/i18nStoreState.test.ts:324,357`).
   - Needs no props — only `EditProvider` store context + the `confirmDialog` portal
     (watch z-index/focus-trap when nested in `SeoSettingsModal`).
2. **`LanguageToggle.tsx`** = the **active-editing-locale pill group**. Already
   `isMultiLocale`-gated (returns null when monolingual), already the ONLY
   `setActiveLocale` UI. **KEEP IT** — see orchestrator ruling on open q1.

- Mount points of `LocaleSettings`: `layout/EditHeader.tsx:45` (import), **`:88` (sole mount)**,
  adjacent to `<LanguageToggle />` at `:87`; comments at `:20-24,49-50`.
  Test-only: `editor/localeControls.visibility.test.tsx:40,97,109,120` (must update).
  Mention-only: `components/DebugPanel.tsx:152`.
- `activeLocale` readers (do not disturb): `useTemplateBlock.ts:51`, 3 shared blocks,
  write-routing `contentActions.ts:27,131,572`, regen guards `aiActions.ts:67-68` +
  `generationActions.ts:134-135`, toolbars `TextToolbarMVP.tsx:113,125,132`,
  `ElementToolbar.tsx:43`, and the **regen-lock** `EditHeaderRightPanel.tsx:109-110`
  (`regenLocaleLocked`) — spec says leave as-is.

## C. `SeoSettingsModal` (the new host)

`src/app/edit/[token]/components/ui/SeoSettingsModal.tsx`

- Signature `SeoSettingsModal({ onClose })` (L101); store via
  `useEditStore(useShallow(...))` L109-118; actions via `useEditStoreApi()` L127.
- **No save button.** Fields write straight to the store (`patch()` → `updatePageSeo`, L163);
  auto-save flushed on close by `handleClose()` L206-209. A Languages panel must mutate
  store state directly — no local save UI.
- **Left rail L386-416 is hardcoded JSX, not an array**: greyed `<Coming what="custom domain setup">`
  Domain row (L394-401), `<NavItem active activeBar icon="search" label="SEO" />` (L402-408),
  `<NavItem icon="share" label="Social & sharing" onClick={openSocial} />` (L410-415).
- **Section switching does not exist yet.** SEO is hardcoded-active; "Social & sharing" *closes*
  this modal and dispatches `window.dispatchEvent(new Event('lessgo:manage-social'))` (L216-221)
  to a different modal owned by `GlobalModals`. Pane body (L419+) branches only on
  `isRoot` (site pane) vs sub-page (tabs).
  → To add Languages: introduce `const [section, setSection] = useState<'seo'|'languages'>('seo')`,
  make rail rows `active={section===...} onClick=...`, branch the pane on `section`
  BEFORE the existing `isRoot` branch.
- **Delete the stale "NO Languages row" rulings** at **L16-17** (file header) and
  **L383-385** (rail comment) — the founder reversed them.
- Reusable primitives already in-file: `NavItem`/`navItemClasses`
  (`src/components/ui/nav-item.tsx`, supports `active`+`activeBar` = the handoff's blue left bar),
  `Switch` (`src/components/ui/switch.tsx`), `Coming` (`src/components/ui/coming.tsx`),
  `AppIcon` (`ui/icon.tsx`), `Dialog*`, `Tabs*`, `cn`. Local style consts to reuse verbatim:
  `FIELD` L47, `FIELD_TIGHT` L50, `LABEL` L53, `EYEBROW` L55.
  **No segmented-control primitive exists** → the Dropdown|None control must be built.

## D. Designer target layout (found)

`docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Editor Redesign.dc.html`
§LANGUAGES **L691-719** (Domain frame L721+ shows the idle Languages rail row).

- Window header `"Site settings · Languages"`, icon `language`. Rail =
  Domain / SEO / Social & sharing / **Languages**, active = tint bg + `inset 2px 0 0 #006CFF`,
  with a **mono count badge** ("2") on the Languages row (blue active / grey idle).
- Pane title `"Languages"`, sub `"Offer your site in more than one language."`;
  two columns (flex 1 + 200px fixed, gap 26).
- **Left col** — eyebrow `LANGUAGES`; one card per locale: 26px mono code (`EN`/`ES`) + name,
  state on the right. Default-locale card = sunken bg + blue `Default` pill, **no menu**.
  Non-default card = subline `"Auto-translated · 3 edits"` + `more_horiz` overflow action.
  Then a **dashed** full-width `+ Add language` button.
- **Right col** — `Auto-translate` row (title + sub `"New copy, via AI"`) with toggle drawn ON;
  below, label `Switcher style` + 2-up segmented control `Dropdown` | `None` (Dropdown selected).
- **Deviation required**: the designer draws Auto-translate live/ON. Per spec decision 5 it must
  ship **greyed "coming soon"** (Spec-2 placeholder) via `<Coming>`. Same for any
  "change site language" action.
- Greyed precedent: `src/components/ui/coming.tsx` L57-79 (greyed + `aria-disabled` +
  "Coming soon — {what}" tooltip; class `.app-coming` in `src/styles/app-chrome.css`).
  In-file example to copy: `SeoSettingsModal.tsx:394-401`. **Note** `coming.tsx:26-29` has a doc
  comment listing "Languages" as *never grey* — now stale, update it.

## E. Published switcher + the `/p/{slug}` gap (decision 6 — bigger than the spec assumed)

- **Asset**: source `src/lib/staticExport/switcherBehaviors.js` (live, not frozen-legacy);
  built by `scripts/buildAssets.js:60` → `public/assets/switcher.v1.js`.
- **Immutability contract** (`scripts/buildAssets.js:10-29`): published blobs are immutable and
  hardcode `{assetBase}/assets/switcher.v1.js`. **Any semantic change REQUIRES a new filename.**
  To introduce `switcher.v2.js`: (a) copy current `switcherBehaviors.js` VERBATIM to
  `scripts/legacy/switcher.v1.src.js` and repoint the v1 entry at `legacyDir` (freeze it),
  (b) add `{ src:'switcherBehaviors.js', out:'switcher.v2.js' }`, (c) repoint the emitter
  `htmlGenerator.ts:375` (`switcherTags`) at v2, (d) update the `Current mapping` comment.
  Precedent: `form.v1/v2`, `a.v1/v2`.
- **Why it breaks**: `switcherBehaviors.js:36-48` — `segAt()` treats the **first path segment** as
  the locale; `buildPath()` re-prefixes at root (`'/'+loc+barePath`). Assumes serve-at-host-root.
  On `/p/{slug}` the first segment is `p` → clicking NL navigates to `/nl/p/{slug}` → 404.
  The **geo auto-redirect (L73-85) does the same → can hard-break first paint on preview.**
- **Fix shape**: stamp a `basePath` into the injected config
  (`window.__lessgoLocales`, emitted `htmlGenerator.ts:322-328`) — `'/p/{slug}'` on the preview
  path, `''` on custom-domain/subdomain — then `segAt`/`buildPath` operate on
  `pathname.slice(basePath.length)` and re-prepend. `style: 'dropdown'|'none'` (decision 7)
  belongs in the same config object. Decide explicitly whether `none` also suppresses the
  geo-redirect (recommend: yes — "None" = no automatic locale behavior at all).
- **Per-locale publish fan-out**: `renderPublishedExport.ts:108-130` (gate `isMultiLocale`,
  `buildAlternates`), `:350-510` (loop non-default locales; `path` = `/{loc}` + `/{loc}{subpath}`;
  overlay via `resolveLocaleElements`; locale docs share the primary version `:496`, own blobKey,
  pushed to `extraRoutes` → KV `route:{host}:{path}`, `lib/routing/kvRoutes.ts:69,140,175`).
  hreflang + self-canonical `htmlGenerator.ts:310-319`, `:389`; `<html lang>` from
  `params.locale` `:300`. Switcher injected `:320-328` + `:373-376`, appended `:430`,
  **only when `locales.length > 1`** (`:294-297`) → single-locale output stays byte-identical.
  Publish route threading: `api/publish/route.ts:202`, `:430-434`, `:472`, collision guard `:213`
  (`src/lib/i18n/localeSlugCollision.ts`).
- **`/p/[slug]` is the real gap**: `src/app/p/[slug]/page.tsx` is a **full SSR re-render** from
  `PublishedPage.content` via `LandingPagePublishedRenderer` — **zero locale awareness**: no
  `localeConfig` read, no `resolveLocaleElements`, no hreflang, and **it never injects the
  switcher script at all** (only the blob HTML does). Same for `p/[slug]/[...subpath]/page.tsx`
  (`subPathFromParams` → `notFound()`), so `/p/{slug}/nl` 404s today.
  → decision 6 = *add locale awareness to the SSR path*, not just patch a prefix.
- Custom-domain path is fine: `src/middleware.ts:134,159-162` rewrites host+path → `/p/{slug}{path}`
  after a KV `route:` lookup; locale docs have KV routes, so `example.com/nl` serves via blob-proxy.

## F. Generation output-language (decision 4)

- **Work engine pattern to mirror.** Value = `WorkFacts.languages[0] ?? 'en'`, rides on the
  **strategy object** (`slimStrategy.ts:87,:205`; route `api/audience/work/strategy/route.ts:165`;
  regen `scopedRegen.ts:669`). Injected in `audience/work/copyPrompt.ts:146`
  (`const language = strategy.primaryLanguage || 'en'`), directive block **`:213-219`** + **rule 1
  `:241-243`**. Wording to mirror:
  ```
  ## OUTPUT LANGUAGE — ${language} (READ FIRST)
  Your entire output MUST be written in ${language}. The grounding material below … MAY be
  written in another language. When it is, render its MEANING in ${language}: translate the
  idea, never copy or echo the source-language wording. … Proper nouns … stay as-is.
  1. **Write EVERY string in ${language}.** … No other language, no mixed-language cards,
     no English fragments (unless ${language} IS English).
  ```
  Strategy-side one-liner: `work/strategy/promptsWork.ts:95`, field declared `:40,:64`.
- **Product**: `audience/product/copyPrompt.ts` — input iface `ProductCopyPromptInput` **:29-53**,
  builder `buildProductCopyPrompt` **:205**, template starts with `identity` **:233-237**, RULES
  from `accentRule` :240. Add optional `language?: string`, `const language = input.language||'en'`
  near :208, `## OUTPUT LANGUAGE` block right after `identity`, + a rule-1 line.
  Retry `buildProductCopyRetryPrompt` :438 wraps the original → no separate change.
- **Service**: `audience/service/copyPrompt.ts` — `ServiceCopyPromptInput` **:24-32**,
  `buildServiceCopyPrompt` **:135** (voice via `selectServiceVoice` :141), retry :309. Same shape.
- **No voice.ts change**: product has no `voice.ts` (`ProductVoiceId` +
  `productVoiceForBusinessType`); service's `voice.ts` has no language concept. Directive belongs
  in `copyPrompt.ts` only — the spec's "`voice.ts`" pointer is wrong.
- **Routes don't load the Project**: `api/audience/product/generate-copy/route.ts` body schema
  **:85-128**, handler :130+ does `requireAuth`, reads bearer only for mock detection (:174-176),
  **never loads the Project row**. Same for service generate-copy (:90-, builder call :200) and
  both strategy routes. → **Server-side read is the clean source of truth**:
  `prisma.project.findUnique({ where:{tokenId}, select:{content:true} })` →
  `content.localeConfig.defaultLocale`. Token already in the Authorization header; cost = one new
  cheap select. Prefer this over trusting a client-sent language.
- **Regen already has it**: `scopedRegen.ts` `ScopedProject` :118-124 declares `content?: unknown`,
  and routes select it (`api/regenerate-section/route.ts:217-228`, same for -element/-content).
  Builders: `buildProductPrompt` :541, `buildServicePrompt` :590, `buildWorkPrompt` :648,
  dispatch `buildEnginePrompt` :688, entry `generateScopedCopy` :818 (`resolveCopyEngine` :190-204).
  → add a `readLocaleDefault(project)` helper (sibling of `readOnboardingView` :264).
  **Reconcile**: work regen at :669 re-derives from `facts.languages[0]`, which can diverge from
  `defaultLocale`.
- **Strategy phase**: product/service strategy prompts (`product/strategy/promptsProduct.ts:61`,
  `service/strategy/promptsService.ts`) have **no** language mention. Output is mostly internal
  reasoning BUT includes positioning/story angles that get pasted into the copy prompt.
  Work hedges both ways. → Minimum = copy prompt only; **recommended = also add the one-line
  strategy directive** to stop source-language angle text leaking into copy.
- **Tests at risk**: `audience/__tests__/generationContract.test.ts` (frozen-fixture shape),
  `audience/__tests__/captureGolden.test.ts` (opt-in real LLM), **`product/promptBranch.test.ts`
  (asserts prompt text — most likely to break)**, `product/promptFirewall.ts` +
  `work/promptFirewall.test.ts` (`assertNoTemplateLeak` scans the input object — a new `language`
  field must not carry a template id), regen route tests (adding a project-content read touches
  their prisma mocks). Work-side reference tests for the pattern:
  `work/copyPrompt.language.test.ts`, `work/__tests__/captureGoldenWork.test.ts:291,:557-592`.

## G. Onboarding (⚠ SPEC IS STALE HERE — decision 3)

- `/onboarding/product/[token]/page.tsx:15` and `/onboarding/service/[token]/page.tsx:13` are now
  **pure `redirect()` stubs** → `/onboarding/[token]`.
- Real flow: `src/app/onboarding/[token]/page.tsx` — engine **decider** machine
  (`EntryStep = input|decider|confirm|manual|wizard|journey`, :164; routing table :288-322).
  `D1Entry` (:143) → `D3AlmostSure`/`D4BuyerDecision`/`D5DemandBoard` → terminal
  `ConfirmToWizard` (thing/trust) or `FinalizeHandoff` (work).
- **thing/trust → linear wizard**: `components/onboarding/wizard/WizardShell.tsx`; slot order
  `wizardSlots` = identity · understanding · goal · offer · proof · style · structure · generating
  (`src/modules/engines/inputContracts.ts:46-56`); field→slot mapping is contract data
  (`thingContract` :122-144). Store = **`src/hooks/useWizardStore.ts`** (the old
  `useProductGenerationStore`/`useServiceGenerationStore` are no longer the spine).
- **work → journey**: `components/onboarding/journey/JourneyShell.tsx` (steps 2-5), seam data
  `journey/engines/work.ts`.
- **Generate fires from** `wizard/GeneratingSlot.tsx:72 buildInput()` → `runGeneration(engine, input)`
  (`src/modules/wizard/generation/{thing,trust,work}.ts`). `ThingGenerationInput` (thing.ts:76-101)
  → `/api/audience/product/strategy` (:387) then `/generate-copy`.
  **No language field anywhere in that payload today.**
- **Project writes**: `/api/start` creates `{tokenId,userId,audienceType}`
  (`api/start/route.ts:64` — too early, language unknown). **`/api/brief/confirm` is the single
  pre-generation `project.update`** — `{brief, audienceType, templateId}`
  (`api/brief/confirm/route.ts:74-82`). `/api/saveDraft` already accepts top-level `localeConfig`
  and merges to `Project.content.localeConfig` (`route.ts:91,216-231`).
  → **Cleanest durable insertion = `/api/brief/confirm`**; second-cleanest = the existing
  `saveDraft` `localeConfig` channel used by generation drivers' `saveFC` (thing.ts:431).
  No new route needed either way.
- **Work already captures language**: `journey/engines/work.ts:602-626` — Step-3 question
  `languages`, `kind:'choice'`, `multi:true`, `allowCustom:true`, options `['English','Dutch']`,
  **required** (gate confirmed `work.test.ts:491`); commits via `applyRailEdit({field:'languages'})`
  → `modules/wizard/work/rail.ts` → saveDraft brief facts.
  ⚠ **Format mismatch**: stores human LABELS (`'English'`,`'Dutch'`), while `defaultLocale` is an
  ISO code → a label→code mapping is required when deriving `defaultLocale` from work facts.
- **No language inference exists anywhere.** No browser-locale read, no lang field in classify/entry
  facts, `/api/v2/understand` has no locale token. The LLM inferring from the one-liner IS the bug.
- **uniform-journey collision map** (`docs/tracks/uniformJourney.md`, agreed 2026-07-20, not specced):

  | File likely edited by uniform-journey | Why |
  |---|---|
  | `components/onboarding/journey/engines/work.ts` | `facts.work`→`facts.core` split moves `languages` into the universal core keys (uniformJourney.md:102,:37). **Highest conflict.** |
  | `lib/schemas/workFacts.schema.ts`, `modules/wizard/work/rail.ts:460` | rail vocabulary/schema reshaped by the same split |
  | `journey/JourneyShell.tsx:100-104`, `JourneyTopBar.tsx:22` | step-list de-hardcoding |
  | `journey/engines/types.ts` | seam contract (8 keys) widening |
  | `modules/engines/inputContracts.ts` | shared slot library extraction (Layer 3) — a new `wizardSlots` member is a contract change |

  → **Lowest-conflict strategy**: keep our diff OUT of `journey/engines/*` and avoid adding a new
  `wizardSlots` member. Also note `docs/task/work-contract-wave2.spec.md` is in flight on work
  contract fields.

---

## Orchestrator rulings on the spec's open questions (unattended-mode decisions)

1. **Active-locale editing home — RESOLVED AT ZERO COST.** The spec conflates two components.
   Retire **`LocaleSettings`** (globe/config) from `EditHeader.tsx:88` only. **Keep
   `LanguageToggle`** (`EditHeader.tsx:87`) — it is already `isMultiLocale`-gated and is already
   exactly open-q1's "compact locale chip shown only when multi-locale", and it is the ONLY
   `setActiveLocale` UI (removing it would orphan `activeLocale`). Acceptance
   "no language globe in the header / Languages reachable only via Site Settings" holds literally.
   → **Do NOT build a per-language Edit button or a new editing indicator.**
2. **Onboarding language input — explicit control, no new step.** An explicit picker is REQUIRED
   (no inference exists, and post-gen change is greyed until Spec 2, so a wrong initial value is
   unrecoverable). Constraints for the planner: default to `en`; restrict to `SUPPORTED_LOCALES`;
   reuse `LOCALE_DISPLAY_NAMES`; **do not add a new `wizardSlots` member** and **do not edit
   `journey/engines/*`** (uniform-journey collision); persist via `/api/brief/confirm` (or the
   existing `saveDraft` `localeConfig` channel). For **work**, derive `defaultLocale` from the
   EXISTING `languages` question via a label→code map — do not add a second control.
   Planner picks the exact host slot and justifies it.
3. **Regen during language change — confirmed greyed only.** Spec 1 ships no translate call,
   no half-built path. The `activeLocale` regen-lock (`EditHeaderRightPanel.tsx:109`) stays as-is.

## Orchestrator notes carried into planning

- **Tier escalated `standard` → `full`** (publish path + dual-renderer/SSR surface + asset
  immutability contract). Full plan-review and per-phase impl-review loops apply.
- Spec pointer corrections: language directive lives in `copyPrompt.ts`, **not** `voice.ts`;
  onboarding is the decider/wizard/journey flow, **not** `/onboarding/{product,service}/[token]`.
- `switcherStyle` is a **new** `LocaleConfig` field — needs type + zod + save + load + publish +
  the zero-diff-when-absent guarantee.
- Deterministic-QA rule: parity / route-gate / zero-diff checks that can be scripted belong in
  `e2e/` or vitest in the phase that adds the surface. No e2e covers the published switcher today.
