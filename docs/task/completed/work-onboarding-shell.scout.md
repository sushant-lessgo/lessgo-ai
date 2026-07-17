# work-onboarding-shell — scout findings (3 scouts, 2026-07-16)

> Condensed. Source of truth for the plan. **The spec's References section is partly STALE** — see §1.

## 1. Onboarding scaffolds — spec is stale

- `src/app/onboarding/{product,service}/[token]/page.tsx` = **3-line `redirect()` stubs** to `/onboarding/{token}`. The per-audience forks were deleted in scale-06 phase 10. They are NOT flows to copy.
- `src/app/onboarding/[token]/page.tsx` = the **universal entry**: `input → confirm → manual` + load-detection via `/api/loadDraft`; renders the wizard when a brief is confirmed (L81: `brief && audienceType && brief.copyEngine`).
- `src/components/onboarding/wizard/WizardShell.tsx` = **ONE unified wizard for every engine, incl. `work`**. Work is already a first-class engine here.
- `useProductGenerationStore` / `useServiceGenerationStore` **DO NOT EXIST** (retired scale-06 p10). The real store is `src/hooks/useWizardStore.ts` (~1270 lines, zustand+immer), already work-aware: `buildWorkInput` (L696), `resolveWorkBrief` (L678), work sitemap seeding in `fetchStrategy` (L1094). **Do NOT create `useWorkGenerationStore`** — extend `useWizardStore` or add a work-scoped slice.
- Step routing is **state-driven, not URL-driven**: `WizardShell` L146 `index = slots.indexOf(currentSlot)`; slots keyed by slot ID via `slotsForEngine` (L501). Refresh/back does not restore the step. Deep-linkable steps = net-new.
- **Scout recommendation**: do NOT build a fresh `/onboarding/work/[token]` route (duplicates entry/classify/serve-gate/load-detection and strands work outside the confirm gate that sets `audienceType`/`templateId`). Instead: **work-only alternate shell dispatched from the same `[token]` entry when `engine === 'work'`** — cheapest isolation from the shared product/service path.
- ⚠️ "Legacy product/service onboarding unchanged" is misleading: work + product/service share ONE shell/store today. Any `WizardShell`/`useWizardStore` edit **is** a shared-path change — that's the real regression risk.
- **Firewall**: entry page dynamically imports WizardShell (`ssr:false`); `useWizardStore` lazy-imports generation adapters. A new work shell must preserve both.

## 2. Work generation contract

- `POST /api/audience/work/strategy`: req `{ brief }` (`brief.facts.work` **required** → else 400). Resp `{ success, data: WorkStrategyOutput, ... }`. AI supplies only `positioningAngle/storyAngle/voiceNotes`; structure is deterministic (`assembleWorkStrategy`, `parseStrategyWork.ts:87`).
- `POST /api/audience/work/generate-copy`: req `{ strategy: WorkStrategyOutput, page?, uiblocks?, brief, sourceUrl? }`; `page` absent ⇒ home from `strategy.sitemap[0]`. Resp `{ success, sections, meta }`.
- **Strategy call is required in practice** — copy needs a full `WorkStrategyOutput`.
- **Minimum input**: `brief.facts.work` with `identity.name` + `groups[]` (each group needs a valid `price`; `on-request` is legal). Everything else defaults (establishment, languages→'en', praise→[]).
- **Mock path**: `NEXT_PUBLIC_USE_MOCK_GPT` or bearer `lessgodemomockdata` → renderable copy, 0 credits. Good for E1 shell dev + e2e.

## 3. Brief + rail mapping

Real shape = `src/lib/schemas/brief.schema.ts:19-99` (`src/types/brief.ts` is enums + re-export). All top-level fields optional. Work generation reads only `brief.facts.work` (`getWorkFacts`, `workFacts.schema.ts:158`), `brief.businessType`, `brief.goal`.

| Rail field | Brief field | Verdict |
|---|---|---|
| name | `facts.work.identity.name` | exists |
| where | `facts.work.identity.location` (+ `.reach`) | exists |
| what they sell | `facts.work.groups[]` | exists |
| languages | `facts.work.languages[]` (NOT `brief.locales` — different i18n field) | exists |
| price position | **derived** via `derivePricePosition(facts)` from group prices | no field — rail shows group prices, not a stored "position" |
| what they do | **no single field** — closest `facts.work.dreamClient` + `businessType`/`category` | **gap** |

Also present, work-generation branches on them → rail should carry: `establishment`, `praise`, `contactMethod`.

## 4. Reveal → editor handoff

Reference driver = `runWorkLLMGeneration` (`src/modules/wizard/generation/work.llm.ts:155-311`), forked from `GeneratingSlot.tsx:120-158`:
1. `preloadTemplate(templateId)` → `themeValues = { knobs }` (L169-175)
2. `buildMultiPageSkeleton({tokenId,title,onboardingData:{sitemap,strategy,...}})` → `saveDraft` **before** any copy call (L304-306) — durable + resumable
3. Per page: `generate-copy` → `mergePageIntoFinalContent` → `saveFC` after **each** page (L247)
4. `finalizeMultiPageGeneration(fc, briefGoal)` is **MANDATORY** (L256) → then `router.push('/edit/{tokenId}')` (`GeneratingSlot.tsx:157`)

Persistence: `POST /api/saveDraft` → `Project.content.finalContent` + `templateId/variantId/paletteId/themeValues`. Editor bootstraps from `/api/loadDraft`. Resume via `isResumableGeneration(loaded)` (`work.llm.ts:266-276`).

**Today generation redirects STRAIGHT to `/edit/{token}` — there is no reveal surface. STEP 06 is net-new.**

## 5. ui-foundation (merged) — how to consume

- **Tokens**: namespaced `app-*` in `tailwind.config.js` `theme.extend` — `colors.app.*` (primary `#006CFF`, cta coral, ink/muted/canvas/surface/border/divider), `borderRadius['app-ctl|input|panel|card|modal|pill|badge']`, `boxShadow['app-card|modal|float|btn-primary|btn-cta']`, `backgroundImage['app-stripes']`. **Style app chrome with `app-*` utilities ONLY**; never mutate stock Tailwind keys (feeds template rendering → editor↔published divergence).
- **Scope class**: `.app-chrome` (`src/styles/app-chrome.css:22`) — Onest/`#191922`/`#f7f8fa`. Attached by consumers only; **NEVER** on `<body>`, `/p/*`, `/preview/*`, or any wrapper containing the editor canvas.
- **Fonts**: `src/styles/fonts-app-chrome.css`, imported only by `src/app/layout.tsx`. **`font-app-mono` = `'JetBrains Mono App'` — never the bare `'JetBrains Mono'` family** (same-named 600 face → editor real-bold vs published faux-bold).
- **Primitives**: reskinned `button` (`default`/`cta`), `input`, `textarea`, `select`, `checkbox`, `switch`, `card`, `badge`, `dialog`. Net-new: `icon.tsx` (`AppIcon`), `nav-item.tsx`, `segmented-control.tsx`, `tabs.tsx`, `toast.tsx` (`ToastProvider`/`useToast`), `image-placeholder.tsx`. **Read `src/components/ui/README.md` before styling.**
- **Attach precedent**: `src/app/dashboard/layout.tsx:13,56` and `src/components/auth/FounderAuthLayout.tsx:21,45`.

## 6. Design handoff — `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Onboarding Flow.dc.html`

(Copied into this worktree. `.dc.html` = design **reference, not code to port** — read markup for structure/copy, rebuild with real primitives; don't port `support.js`. Mocks framed 1280×840; real screen is full-viewport.)

- **STEP 01 chrome** (`1a`, L65-95): 60px bar — logo, 1px divider, muted "New site with AI", right "Exit to dashboard" (`close`). Body = radial gradient `radial-gradient(120% 90% at 50% -6%,#eef4ff,#fcfcfd)`, centered: `rocket_launch` pill chip (`#e6f0ff`/`#003E80`), 800/40px/-1.2px display "Let's build your first site, {name}", 15.5px muted sub, then a **720px card** (r18, `#e2e6ef`): 2-tab segmented control ("Describe your site" / "Use my current site"), 16px prompt area (min-h 64px), coral CTA "Build my site" + `arrow_forward`. Below: "or start from a blank editor".
- **Steps 02-06 chrome** (L121+): 58px top bar — logo, "New site", **centered 6-dot step progress** (done = 22px blue circle + `check`; current = 26px blue numbered circle, ring `0 0 0 4px #dbe9ff`; future = 9px `#dcdce2` dot; 30-40px×2px connectors), right slot = "Save & exit" or live status ("Building…" + spinning `progress_activity`).
- **Rail** (L141-181): `<aside>` **312px fixed**, `#fafafb`, right border `#f0f0f3`, column flex. Header: mono 10px `.11em` "WHAT WE UNDERSTOOD" + "Tap anything to correct it". Scroll body: one block per field, each `padding:11px 0;border-top:1px solid #eef0f3`, mono 10px label + value row with trailing `edit` icon (`#c0c0c8`) = the correctability affordance. Fields: NAME, WHAT YOU DO, WHERE, WHAT YOU SELL (chips `#e6f0ff`/`#003E80` + pulsing "finding more…" while resolving; label turns blue + spinner while filling), PRICE POSITION, LANGUAGES. **Unknown = `opacity:.5` + striped skeleton bar** (`bg-app-stripes`). Footer (flex:none, border-top): "Something wrong?" + `chat_bubble` free-text box "Tell us…".
- **STEP 05** (L617-681): split — left 44% dark `#0b1830` honest-progress panel (mono eyebrow, 26px display, progress bar, checklist w/ green `#25d366` check / spinner / dimmed pending), right = "feel picker" 3-card grid (selected = 2px `#006CFF` border) + skip-defaults footer.
- **STEP 06** (L702+): same 58px bar, `#f7f8fa` body, full-size scrollable real homepage, desktop/phone toggle, **no publish** — only forward is into the editor.

## Landmines (ranked)

1. 🚨 **`.app-chrome` must NOT be an ancestor of the STEP 06 revealed site.** The reveal renders the real generated site — use an iframe or keep the wrapper outside. Highest-risk point in this spec.
2. 🚨 **`NEXT_PUBLIC_WORK_COPY_ENGINE` defaults OFF and is build-time inlined** (`work.llm.ts:67`). Without it + `templateId==='atelier'`, work silently takes the **skeleton** path → empty draft, no copy → STEP 06 reveals nothing. Confirm flag state before the founder QA gate; kill-switch is redeploy-speed, not runtime.
3. 🚨 **`saveDraft` never writes `audienceType`** — only `/api/brief/confirm` does (`brief/confirm/route.ts:78`). Skip the serve gate and `loadDraft` returns `audienceType:'product'` (L133) → wrong editor/publish behavior.
4. **`BriefSchema.partial()` in saveDraft is SHALLOW** (`saveDraft/route.ts:146`) — a `facts` patch **replaces the whole facts bag**, wiping `facts.entry`/`facts.collections`. Rail writes must re-emit siblings (pattern: `useWizardStore.ts:208`).
5. **Invalid brief patch → saveDraft skips the brief write and still returns 200** (L144-153) — silent data loss, no error surfaced.
6. **Price parse rule** (`workFacts.schema.ts:65`): a group with `mode:'exact'|'from'` and no `amount` fails `getWorkFacts` → silently returns null → 400 "brief.facts.work is required". Rail defaults must never emit a group without a valid price.
7. `finalizeMultiPageGeneration` omission leaves the in-progress marker → editor treats the site as mid-generation.
8. **STEP 04 vs `fetchStrategy` idempotency**: the strategy fetch is the charge-once mechanism (`useWizardStore.ts:L1055-1117`). Work+multipage is chargeless; work+single-page (granth) returns early and never fetches. A thin STEP 04 must not naively call `fetchStrategy`.
9. **Credits**: both work routes use `requireAuth` + post-hoc `consumeCredits` (warn-only on failure), no pre-flight `checkCredits`, no `assertProjectOwner` (they take a Brief body, no tokenId). Ownership is asserted only at `saveDraft`.
10. **Isolation guards must stay green**: `published.css` sha256 (needs a FRESH `npm run build`), `tailwindConfigFreeze.test.ts`, `e2e/ui-isolation.spec.ts` (fixture is a checked-in INPUT baseline — never regenerate).
11. **New icons** need `public/fonts/material-symbols-rounded/icons.txt` + subset regen per its NOTICE (never from the full font): this flow adds `rocket_launch`, `edit_note`, `link`, `chat_bubble`, `progress_activity`, `check_circle`, `add_photo_alternate`, `tune`, `folder`, `language`, `close`.
12. Use `@/components/ui/toast`, not the edit-page-local `ToastProvider`. `badge` default radius is `app-badge` 6px (not a pill) — rail chips need explicit handling.
