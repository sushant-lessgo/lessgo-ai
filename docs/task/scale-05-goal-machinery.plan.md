# scale-05 — goal machinery: implementation plan

**Branch:** `feature/scale-05-goal-machinery`
**Spec:** `docs/task/scale-05-goal-machinery.spec.md` (contract)
**Depends:** scale-04 (merged) — Destination union, `goalToDestination`, `normalizeCtas` GOAL_REF pre-pass, beacon `data-lessgo-cta` attrs.

## Overview

Make the picked goal actually shape the page. Today the goal is a dead wire: the wizard stores a legacy enum, the Brief never gets the goal parameter, copy prompts get one CTA-verb line, forms are manual, and M2/M3/M4 mechanisms have no machinery. This plan wires: goal-slot param collection → `Brief.goal.param` (+ writeback so publish-time GOAL_REF resolves), per-intent copy guidance (label + new `cta_subtext` + emphasis), M1 form auto-seed at generation (incl. `subscribe-newsletter` as an email-capture form), M2 deterministic WhatsApp prefill, M3 store-badges and M4 follow-strip as **shared template-agnostic blocks** (new concept — decided below), and an intent-first wizard goal step (likelyIntents + AI pre-select + "other").

**Key design calls (made now, flagged for plan-review):**
1. **`param` is the raw wizard capture; `destination` stays the resolver input.** Writeback *composes* `Brief.goal.destination` from `param` (e.g. phone → `https://wa.me/<num>`, links[] → array). `goalToDestination` (scale-04, tested) stays almost untouched — only the M2 WhatsApp-message enrichment is added. Lowest-risk way to satisfy "GOAL_REF resolves from param".
2. **Follow-strip / store-badges = shared blocks in a NEW home** `src/modules/generatedLanding/sharedBlocks/` (no such dir exists today), resolved via a shared-block shim in BOTH component registries *before* template dispatch. **Firewall-safe split:** TWO registry files mirroring the existing componentRegistry split — `sharedBlocks/registry.ts` (edit `.tsx` twins ONLY, imported only by `componentRegistry.ts`) and `sharedBlocks/registry.published.ts` (server-safe `.published.tsx` twins ONLY, imported only by `componentRegistry.published.ts`). No file ever holds both twins, so no `'use client'` code can reach the static-markup path. New section types `followStrip` / `storeBadges` are injected deterministically at generation (no AI copy — content derived from `param.links` / `socialProfiles`). Blocks style via CSS vars + `data-surface` so they inherit template tokens. Alternative (per-template footer promotion) rejected: N templates × 2 files each, forever. **Human gate before this phase** (new architecture concept).
3. **WhatsApp prefill** is materialized deterministically at generation writeback into `param.message` ("Hi {businessName}, I found your website — interested in {offer}" from `brief.facts`), resolver falls back to computing it when absent; editable via a message field in the edit-page goal modal. NO AI (§11.6).
4. **Legacy goal enums stay alive.** Wizard→Brief writeback + copy guidance key on `GoalIntent` via new reverse maps (legacy `ServiceGoal`/`LandingGoal` → intent). Legacy enum removal is out of scope.
5. **Param capture keys on INTENT where the intent needs a special shape, mechanism-generic otherwise.** Concretely: `download-app` (mechanism M3) captures TWO store URLs into `param.links[]` (Play + App Store), not the generic single-URL M3 branch — Phase 6's badge injector reads `param.links` and host-sniffs both stores. All other M3 intents use the generic single `param.url`.
6. **`subscribe-newsletter` is an M1 form** (email capture), per orchestrator decision — routed through Phase 4's form auto-seed (newsletter template: email + optional name). It is NOT handled by Phase 7's follow-strip. Only `follow-social` uses the M4 follow-strip. **Intent-specific mechanism override at writeback:** the frozen vocab meta says M4 (`goalIntentMeta['subscribe-newsletter'].mechanisms = ['M4']` in `src/modules/goals/vocabulary.ts`); product decision is M1 form. Do NOT edit vocabulary.ts — override via an explicit intent branch at the writeback layer AND in param capture (same pattern as the download-app/rsvp intent branches), so capture ↔ writeback ↔ hero GOAL_REF resolution all agree on M1 (`#form-section` anchor to the seeded form, never the M4 social/external path).

**Scope OUT (honored):** no order/reserve machinery (place engines, P3), no payment/donate beyond plain external link, no secondary-CTA defaults (D14), no `prisma` migration anywhere (Brief is a JSON column — zod-only change).

## Progress log

- phase 1 goal param plumbing: done (commit 1a64012, review loops 1)
- phase 2 cta_subtext element: done (review loops 1, ship)
- phase 3 intent→copy guidance: pending
- phase 4 M1 form auto-seed: pending
- phase 5 M2 whatsapp prefill: pending
- phase 6 shared-block infra + M3 store-badges: pending
- phase 7 M4 follow-strip: pending
- phase 8 intent-first wizard goal step: pending
- phase 9 acceptance fixtures + parity QA: pending

---

## Phase 1 — Goal param plumbing: schema + capture + writeback

**Goal:** `Brief.goal.param` exists, the wizard collects it per intent/mechanism, and generation-save writes `brief.goal` (intent + mechanism + composed destination + param) to `Project.brief` via the existing saveDraft brief passthrough. After this phase, publish-time GOAL_REF resolves real founder-entered destinations for NEW projects.

**Files touched:**
- `src/lib/schemas/brief.schema.ts` — add `param` to the goal object: `z.object({ phone, email, url, links: z.array(z.string()), date, message }).partial().optional()` (all string fields optional).
- `src/modules/brief/bridge.ts` — add reverse maps `SERVICE_GOAL_TO_INTENT: Record<ServiceGoal, GoalIntent>` and `LANDING_GOAL_TO_INTENT: Record<LandingGoal, GoalIntent>` (total, every legacy goal maps; e.g. `signup`→`signup-free`, `download`→`download-app`, `buy`→`buy-via-link`, `demo`→`request-demo`) + export helper `legacyGoalToBriefGoal(legacyGoal, param) → Brief['goal']`. Composition rules — **intent-specific first, mechanism-generic fallback**: `download-app` → persist `param.links[]` verbatim (both store URLs; Phase 6 injector reads exactly `brief.goal.param.links`) and compose `destination` from `links[0]` (external); **`subscribe-newsletter` → force `mechanism='M1'`, set NO `param` and NO `destination`** (intent-specific override — vocab meta says M4, design call #6 is M1 form; hero GOAL_REF then resolves via the existing M1 `#form-section` path to Phase 4's seeded newsletter form); M2 → `wa.me/{phone}` | `tel:` | `mailto:` per which param key is set; other M3 → `param.url`; M4 → `param.links`; M1/M5 → none. `mechanism = goalIntentMeta[intent].mechanisms[0]` **except where an intent branch overrides it (subscribe-newsletter above)**.
- `src/components/onboarding/shared/GoalParamFields.tsx` — NEW shared component: given a `GoalIntent`, renders the param inputs. **Intent-specific branches:** `download-app` → TWO labeled URL fields ("Google Play link", "App Store link"), both written to `param.links[]` (≥1 required to proceed); rsvp → link + date; **`subscribe-newsletter` → render NOTHING** (M1 form treatment — the newsletter form auto-seeds in Phase 4; must NOT fall through to the M4 "platform link(s)" fallback). **Mechanism-generic fallback:** M2 → phone/email choice + number; M3 → single destination URL; M4 → platform link(s); M1 → nothing. Controlled via props (value + onChange) so both wizards and phase 8 reuse it.
- `src/hooks/useProductGenerationStore.ts` — add `goalParam` state + setter.
- `src/hooks/useServiceGenerationStore.ts` — add `goalParam` state + setter.
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx` — after goal pick, if the mapped intent needs a param, show `GoalParamFields` inline (no auto-advance until filled or skipped); write to store.
- `src/app/onboarding/service/[token]/components/steps/GoalStep.tsx` — same.
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — final `/api/saveDraft` body gains `brief: { goal: legacyGoalToBriefGoal(landingGoal, goalParam) }`.
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — same for `goal`.
- `src/modules/brief/bridge.test.ts` — reverse-map totality + destination composition cases, incl. `download-app` two-links case (`param.links` persisted intact, destination = links[0]) **+ `subscribe-newsletter` override case (mechanism='M1', no param, no destination)**.
- `src/modules/goals/goalToDestination.test.ts` — add cases proving composed destinations resolve (wa.me/tel/mailto/external/social + download-app links[0]).

**Steps:**
1. Zod `param` (additive, optional — existing Briefs unaffected; `BriefSchema.partial()` in saveDraft already accepts it).
2. Reverse maps + `legacyGoalToBriefGoal` in bridge.ts (pure module; intent-specific branches first — download-app, rsvp, subscribe-newsletter M1 override — then mechanism fallback).
3. `GoalParamFields` (client component, plain inputs, no validation beyond trim + basic URL/phone shape; download-app dual-URL branch; subscribe-newsletter renders nothing).
4. Wire both GoalSteps + stores + both GeneratingSteps' saveDraft bodies.
5. Tests — must include an end-to-end shape assertion: wizard `goalParam` for download-app → `legacyGoalToBriefGoal` → `brief.goal.param.links` is exactly what Phase 6's injector will read; and subscribe-newsletter → `brief.goal.mechanism === 'M1'`.

**Verification:** `npx tsc --noEmit` · `npm run test:run -- bridge goalToDestination brief` · manual: run product wizard with `demo` goal + Calendly URL → confirm `Project.brief.goal` persisted with destination + param; run with `download` goal + both store URLs → `param.links` has 2 entries; newsletter goal → no param input shown, persisted `brief.goal.mechanism = 'M1'`.

---

## Phase 2 — `cta_subtext` element (schema + hero blocks, dual-renderer)

**Goal:** A place for "7 days free, no credit card" to live. New optional `cta_subtext` element on the hero section, rendered under the primary CTA in the 4 core templates (both renderers, identical markup). Copy population comes in phase 3.

**Files touched:**
- `src/modules/audience/product/elementSchema.ts` — hero: add `cta_subtext { type:'string', requirement:'optional', fillMode:'ai_generated', default:'' }`.
- `src/modules/audience/service/elementSchema.ts` — hero: same.
- `src/modules/templates/meridian/blocks/Hero/TerminalHero.tsx` + `TerminalHero.published.tsx`
- `src/modules/templates/techpremium/blocks/Hero/TechPremiumHero.tsx` + `TechPremiumHero.published.tsx`
- `src/modules/templates/hearth/blocks/Hero/PetalFramedHero.tsx` + `PetalFramedHero.published.tsx`
- `src/modules/templates/lex/blocks/Hero/ProspectusHero.tsx` + `ProspectusHero.published.tsx`

**Steps:**
1. Schema entries (optional ⇒ empty/absent renders nothing; existing projects unchanged).
2. In each hero pair: render `cta_subtext` as a small muted line directly under the primary CTA, editable in the `.tsx` via the same inline-edit pattern the block uses for other optional text elements; `.published.tsx` renders the identical static markup. Guard: render only when non-empty (both renderers, same guard).
3. Keep `.tsx`/`.published.tsx` byte-parallel in layout/classNames (dual-renderer gate).

**Verification:** `npx tsc --noEmit` · `npm run test:run -- renderParity sanitizeContentForPublish` · `npm run build` (new classes must land in `public/published.css`) · manual: add subtext in editor → preview → publish → identical.

**Note:** bespoke templates (surge/lumen/granth/vestria) intentionally skipped — their fixtures don't need subtext; follow-up if wanted.

---

## Phase 3 — Intent → copy guidance (one table, both engines, strategy + copy)

**Goal:** Per-intent guidance (CTA label, cta_subtext, objection/section emphasis) injected into BOTH engines' copy prompts and BOTH strategy prompts, from ONE table keyed by `GoalIntent`.

**Files touched:**
- `src/modules/goals/copyGuidance.ts` — NEW plain module: `goalCopyGuidance: Record<GoalIntent, { cta: string; subtext?: string; emphasis: string }>` for all 18 intents (place intents get plain-link guidance only) + `getGuidanceForIntent(intent)` formatter returning the prompt block.
- `src/modules/audience/service/copyPrompt.ts` — `getGoalCtaGuidance` (:73) re-points to the table via `SERVICE_GOAL_TO_INTENT`; injection site (:151) now emits label + subtext + emphasis lines; JSON output spec for hero gains `cta_subtext` (optional).
- `src/modules/audience/product/copyPrompt.ts` — same via `LANDING_GOAL_TO_INTENT` (:106 table, :343 injection); hero output spec gains `cta_subtext`.
- `src/modules/prompt/buildStrategyPrompt.ts` — buildBusinessContext (:62 area): append the intent's emphasis line (strategy phase should weight sections/objections by goal).
- `src/modules/audience/service/strategy/promptsService.ts` — `## Landing Goal` block (:57-59): append emphasis line.
- `src/modules/goals/copyGuidance.test.ts` — NEW: table totality (all 18 intents), formatter snapshot.
- `src/modules/audience/product/promptBranch.test.ts` — extend if guidance line assertions exist.

**Steps:**
1. Author the table (e.g. `free-trial`: cta "Start free trial", subtext "X days free, no credit card required — only when offer states terms; else omit", emphasis "address trial-terms objections"; `enquiry` for manufacturer: emphasis MOQ/specs; `follow-social`: cta "Follow on Instagram" etc.).
2. Re-point both `getGoalCtaGuidance` (keep signatures/fallbacks — legacy callers unchanged).
3. Prompt injections + hero `cta_subtext` output instruction ("omit unless the offer explicitly supports it — do NOT invent terms").
4. Tests.

**Verification:** `npx tsc --noEmit` · `npm run test:run -- copyGuidance copyPrompt promptBranch generation` (generation-contract fixture must stay green — `cta_subtext` optional so frozen fixtures pass) · manual: `DEBUG_AI_PROMPTS=true`, generate SaaS free-trial → prompt carries guidance; hero shows subtext.

---

## Phase 4 — M1: form auto-seed + place + wire at generation

**Goal:** For M1 goals, generation produces a page with the form already created (`content.forms`), **placed and rendered** — the seed writes the placement/render-slot mapping consumed by `FormPlacementRenderer`/`formPlacement`, so a real form section renders on the page and the hero GOAL_REF's `#form-section` anchor exists in exported HTML and scrolls to it — and wired to the CTA. Not just a wired button. FormBuilder remains the editor. **Includes `subscribe-newsletter`, treated as M1 email capture (resolved open-question #4; Phase 1's writeback override stamps it `mechanism='M1'`).**

**Files touched:**
- `src/modules/audience/service/formTemplates.ts` — re-key `TEMPLATES_BY_GOAL` by `GoalIntent`; add templates for ALL M1 intents: enquiry, request-quote, book-call, book-me, enroll, apply, lead-magnet, waitlist, request-demo, rsvp (rsvp: name/email + attendee count select; book-me: event date + type) **+ `subscribe-newsletter` (email required + name optional)**. Keep `getServiceFormTemplate(goal: ServiceGoal)` as a thin legacy wrapper (maps via `SERVICE_GOAL_TO_INTENT`) so existing callers compile untouched; new `getFormTemplateForIntent(intent)`.
- `src/modules/goals/seedGoalForm.ts` — NEW plain module: `seedGoalForm(finalContent, goal)` — when `goal.mechanism === 'M1'` (or intent = `subscribe-newsletter` — belt-and-suspenders; after Phase 1's override the mechanism is genuinely M1): instantiate template (`form-${Date.now()}` id, matching `formActions.createForm` conventions) into `finalContent.forms`, write the placement record exactly as the manual placement path does (whatever `formPlacement.ts` persists — placement/render-slot mapping that `FormPlacementRenderer` reads to render the form section), write `buttonConfig: { type:'form', formId, behavior:'scrollTo' }` into the CTA section's `cta_text` elementMetadata (matching `ButtonConfigurationModal` shape incl. `cta_embed=form:${formId}`), leave hero primary as GOAL_REF (scale-04 M1 already resolves hero → `#form-section` anchor + formId). Idempotent no-op when forms already exist or mechanism ≠ M1.
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — call `seedGoalForm` in `buildFinalContent` (goal from phase-1 `legacyGoalToBriefGoal`).
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — same.
- `src/modules/goals/seedGoalForm.test.ts` — NEW: M1 seeds form + placement + wiring; subscribe-newsletter seeds email-capture form; M2–M5 no-op; idempotence; buttonConfig + placement shapes match `formPlacement`/`FormPlacementRenderer` reader expectations.
- `src/modules/audience/service/formTemplates.test.ts` (create if absent) — template per M1 intent + newsletter, field types ⊆ `MVPFormFieldType`.

**Steps:**
1. Templates + re-key + legacy wrapper. **Grep ALL `getServiceFormTemplate` callers + any `SERVICE_FORM_TEMPLATE_GOALS` references** (known: `FormBuilder.tsx`; confirm no others) before re-keying — avoid silent field-drop regression.
2. `seedGoalForm` (study `formActions.ts` + `formPlacement.ts` + `FormPlacementRenderer.tsx` reader shape before writing — buttonConfig AND placement record must be byte-compatible with the manual path; the goal is a *rendered, scrolled-to* form, not just a configured button).
3. Wire both GeneratingSteps.
4. Tests.

**Verification:** `npx tsc --noEmit` · `npm run test:run -- seedGoalForm formTemplates normalizeCtas formPlacement` · manual (acceptance): consultant book-call wizard run → editor shows the form RENDERED on the page + hero CTA scrolls to it; publish → confirm form renders in exported HTML, `#form-section` anchor resolves (hero click scrolls), submit → `FormSubmission` row + lead email (RESEND env); subscribe-newsletter goal → email form seeded. Regeneration paths (`fullPageRegeneration`) intentionally untouched — note in audit.

---

## Phase 5 — M2: deterministic WhatsApp prefill

**Goal:** WhatsApp goal ⇒ `wa.me/{phone}?text=` with the exact template "Hi {businessName}, I found your website — interested in {offer}", built from Brief slots, NO AI, editable in the editor.

**Files touched:**
- `src/modules/goals/whatsappPrefill.ts` — NEW plain module: `buildWhatsappPrefill(facts) → string` — reads `facts.businessName` / `facts.offer` (classify.ts keys), graceful degradation (no offer → "Hi {businessName}, I found your website and I'm interested."; no facts → "Hi, I found your website and I'm interested.").
- `src/modules/brief/bridge.ts` — `legacyGoalToBriefGoal` gains optional `facts` arg: when M2 + WhatsApp, set `param.message = buildWhatsappPrefill(facts)` and compose `destination = wa.me/{phone}?text={encoded}` — the message is materialized at writeback (deterministic, inspectable, editable).
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` + `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — pass businessName/offer facts into the writeback call.
- `src/modules/goals/goalToDestination.ts` — M2 case: if resolved dest is `whatsapp` without `msg` but `goal.param?.message` present → attach it (covers Briefs written by other paths, e.g. classify).
- `src/app/edit/[token]/components/modals/LandingGoalsModal.tsx` — edit surface: when the current goal is M2/WhatsApp, show a "Prefilled WhatsApp message" textarea bound to `param.message` (persists via saveDraft brief passthrough, recomposes `destination` `?text=`).
- `src/modules/goals/whatsappPrefill.test.ts` — NEW: exact template string, degradation cases, no network/AI.
- `src/modules/goals/goalToDestination.test.ts` — param.message attachment case.
- `src/utils/resolveCtaHref.test.ts` — wa.me href with encoded message (extend, don't replace).

**Steps:** 1. Prefill module + tests. 2. Writeback materialization. 3. Resolver enrichment. 4. Goal-modal message field. 5. Href test.

**Verification:** `npx tsc --noEmit` · `npm run test:run -- whatsappPrefill goalToDestination resolveCtaHref bridge` · manual: WhatsApp goal → published hero href = `https://wa.me/<n>?text=Hi%20<name>...` exactly; edit message in modal → republish → new text.

---

## Phase 6 — Shared-block infrastructure + M3 store-badges  ⚠️ **HUMAN GATE (before implementing)**

**Gate:** approve the shared-block architecture (design call #2): new home `src/modules/generatedLanding/sharedBlocks/`, split edit/published registries mirroring the componentRegistry split, deterministic section injection at generation. This is the first template-agnostic block in the codebase — sign off before it lands.

**Goal:** `storeBadges` section type: Play Store + App Store badge row (Kathaworld class), rendered identically by both renderers in ANY template; injected at generation when intent = `download-app` and store links exist in `param.links` (captured by Phase 1's intent-specific branch); badges link out (M3), hero primary already resolves external via scale-04.

**⚠️ Lowercase section-type keys:** both renderers' `extractSectionType` (edit AND published, via their `typeMap`) LOWERCASE the section type — `storeBadges-<uuid>` → `storebadges`. `resolveSharedBlock`/`resolveSharedBlockPublished` must therefore key on the lowercased type (`storebadges`) or add explicit `typeMap` entries — otherwise the shared block silently won't resolve. Applies equally to `followStrip` → `followstrip` in Phase 7.

**Files touched:**
- `src/modules/generatedLanding/sharedBlocks/registry.ts` — NEW: **edit twins ONLY** — `sharedBlockRegistry: Record<string, Component>` keyed by section type (imports `.tsx` twins); `resolveSharedBlock(sectionType)`. Imported ONLY by `componentRegistry.ts`. Never imports a `.published.tsx` file.
- `src/modules/generatedLanding/sharedBlocks/registry.published.ts` — NEW: **published twins ONLY** — parallel map importing `.published.tsx` twins; `resolveSharedBlockPublished(sectionType)`. Imported ONLY by `componentRegistry.published.ts`. Never imports a `'use client'` file (firewall: this keeps edit twins out of the static-markup path).
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.tsx` — NEW ('use client'; links come from section content elements; renders badge anchors).
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/StoreBadges.published.tsx` — NEW (server-safe twin, identical markup; anchors carry `data-lessgo-cta` + `data-lessgo-cta-role="secondary"`).
- `src/modules/generatedLanding/sharedBlocks/StoreBadges/badgeArt.tsx` — NEW plain module (NO 'use client'): inline SVG badge components (Google Play / App Store official-style badges — no public/ asset, no buildAssets change, no cross-origin concerns in exported HTML). Shared by both twins — firewall-safe because it's a plain module.
- `src/modules/generatedLanding/componentRegistry.ts` — `getComponent`: check `resolveSharedBlock(sectionType)` BEFORE template dispatch (imports `sharedBlocks/registry.ts` only).
- `src/modules/generatedLanding/componentRegistry.published.ts` — parallel shim via `resolveSharedBlockPublished` (imports `sharedBlocks/registry.published.ts` only).
- `src/modules/goals/injectGoalSections.ts` — NEW plain module: `injectGoalSections(sections, sectionLayouts, content, goal, ctx)` — for `download-app` with ≥1 store link in `brief.goal.param.links` (exactly where Phase 1 writeback persisted them): append `storeBadges-<uuid>` after hero, layout `SharedStoreBadges`, content elements `{ appstore_url, playstore_url, badge_label? }` derived from links (URL host sniff: play.google.com / apps.apple.com; one link → one badge). Deterministic, no AI.
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — call injector in `buildFinalContent`.
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — same (writers can ship apps too; cheap symmetry).
- `src/modules/sections/sectionList.ts` — add `storeBadges` SectionMeta entry (so section-name/labels UIs don't show raw keys).
- `src/modules/audience/product/elementSchema.ts` + `src/modules/audience/service/elementSchema.ts` — minimal `storeBadges` element entries (`appstore_url`, `playstore_url` manual_preferred) so editor toolbars/element APIs don't choke on the unknown type.
- `src/modules/goals/injectGoalSections.test.ts` — NEW (must include: Phase-1-shaped `param.links` with both stores → TWO badge hrefs, Kathaworld acceptance).
- `src/modules/generatedLanding/sharedBlocks/__tests__/storeBadges.parity.test.tsx` — NEW: edit vs published markup parity + href + beacon attrs (test file may import both twins — tests aren't in the published path).

**Steps:**
0. **Grep readers that `switch`/branch on section type** (drag-drop, section-settings menus, regen menus, delete handlers, label switches, `getSurfaceForSection`) — enumerate every place a new section type must be tolerated or added; don't rely on `sectionList` + `elementSchema` entries alone.
1. Split registries + shims — key on the **lowercased** type per the note above (verify against both `extractSectionType` implementations); verify `getSurfaceForSection` isn't called for shared types, or defaults safely — shared blocks self-set `data-surface="neutral"` and style via CSS vars only.
2. Badge SVG art module.
3. Block twin pair (identical layout; links from section content elements).
4. Injector + GeneratingStep wiring + sectionList/elementSchema entries.
5. Tests (parity test should exercise resolution through the registries with a real `storeBadges-<uuid>` id, catching any case mismatch).

**Verification:** `npx tsc --noEmit` · `npm run test:run -- injectGoalSections storeBadges componentRegistry dispatch` (template-dispatch regression suite must stay green) · `npm run build` (published CSS picks up block classes) · manual: download-app goal + both store links in wizard → editor + published both show TWO badges linking out on all 4 core templates (Kathaworld acceptance).

---

## Phase 7 — M4: follow-strip shared block

**Goal:** `followStrip` section: social-icon row rendered from injected socialProfiles content (writers class); hero primary = social Destination (scale-04 M4 already resolves); strip anchors are beacon-tagged conversions. **`follow-social` ONLY — `subscribe-newsletter` is M1 and handled by Phase 4 (resolved).**

**Files touched:**
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.tsx` — NEW ('use client' twin).
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/FollowStrip.published.tsx` — NEW (identical markup; anchors carry `data-lessgo-cta`, `data-lessgo-cta-role="primary"` on the goal platform, `target=_blank rel` via `externalLinkProps`).
- `src/modules/generatedLanding/sharedBlocks/FollowStrip/socialIcons.tsx` — NEW plain module (NO 'use client'): inline SVG icons for the `SOCIAL_PLATFORMS` set (instagram, facebook, twitter/x, linkedin, youtube, tiktok, threads, pinterest, telegram, website fallback) — firewall-safe, shared by twins.
- `src/modules/generatedLanding/sharedBlocks/registry.ts` — register `followStrip` edit twin (lowercased key `followstrip` — see Phase 6 lowercase-key note).
- `src/modules/generatedLanding/sharedBlocks/registry.published.ts` — register `followStrip` published twin (same lowercase-key rule).
- `src/modules/goals/injectGoalSections.ts` — extend: intent `follow-social` (M4) with links (from `param.links`, falling back to `brief.socialProfiles`): append `followStrip-<uuid>` after hero; content elements `{ strip_heading (manual_preferred, default "Follow along"), profile URLs materialized as links_json (JSON-string array of {platform,url} via inferPlatform) }`. Materialized at injection ⇒ renderers never need the Brief. Note: later edits via `SocialProfilesPanel` do NOT auto-sync the strip (documented limitation; strip URLs editable as section elements).
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — pass socialProfiles/param into injector call (arg only; injector wired in phase 6).
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — same arg.
- `src/modules/sections/sectionList.ts` — `followStrip` SectionMeta entry.
- `src/modules/audience/product/elementSchema.ts` + `src/modules/audience/service/elementSchema.ts` — `followStrip` entries.
- `src/modules/goals/injectGoalSections.test.ts` — extend (assert `subscribe-newsletter` does NOT inject a strip).
- `src/modules/generatedLanding/sharedBlocks/__tests__/followStrip.parity.test.tsx` — NEW: parity + hrefs + beacon attrs + platform icon mapping.

**Steps:** 0. Re-run the section-type-switch grep (from phase 6 step 0) for `followStrip`. 1. Icons module. 2. Block twins. 3. Injector extension + register in BOTH registry files (lowercased `followstrip` key, per Phase 6 note — else silent non-resolution). 4. Schema/list entries. 5. Tests.

**Verification:** `npx tsc --noEmit` · `npm run test:run -- injectGoalSections followStrip dispatch` · `npm run build` · manual (acceptance): writer fixture, goal follow-social + Instagram → hero primary href = instagram profile, strip renders in editor AND published, clicking strip link fires `cta_click` beacon (network tab on published page).

---

## Phase 8 — Intent-first wizard goal step (unhide + extend)  ⚠️ **HUMAN GATE (after: UX sign-off)**

**Goal:** GoalStep (both routes) shows 3–4 `likelyIntents` from the businessType entry (first consumer of `businessTypes.config.likelyIntents`), AI pre-selects from `goalIntentGuess`, full 18-intent list behind "Other". Store keeps a legacy goal alongside (mapped) so ALL downstream generation plumbing is untouched.

**Files touched:**
- `src/hooks/useProductGenerationStore.ts` — add `goalIntent` + setter (persist alongside `landingGoal`).
- `src/hooks/useServiceGenerationStore.ts` — same alongside `goal`.
- `src/modules/brief/bridge.ts` — `ProductPrefill`/`ServicePrefill` gain optional `goalIntent` (from `brief.goal.intent`); forward maps INTENT_TO_* stay for the legacy mirror; add per-audience legacy fallback for unmapped intents (product → `signup`, service → `book-call`) in a `intentToLegacyGoal(intent, audience)` helper.
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx` — rewrite: options = `likelyIntents` for the businessType (manufacturer flow → `manufacturer`, else `saas`; brief.businessType when prefilled wins), rendered via `goalIntentMeta` labels + OptionCard; pre-select store/prefill `goalIntent`; "Other" expands full `goalIntents`; on pick set `goalIntent` + mirrored legacy `landingGoal`; then `GoalParamFields` (phase 1) as today.
- `src/app/onboarding/service/[token]/components/steps/GoalStep.tsx` — same (businessType from brief prefill, else serviceType→businessType via existing map: agency/consultancy→agency, consultant, coaching→coach).
- `src/app/onboarding/product/[token]/page.tsx` — hydrate `goalIntent` from prefill.
- `src/app/onboarding/service/[token]/page.tsx` — same.
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — writeback uses store `goalIntent` when present (reverse map only as fallback).
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — same.
- `src/modules/brief/bridge.test.ts` — prefill goalIntent + fallback cases.

**Steps:** 1. Store fields. 2. Bridge prefill + fallback helper — before touching the intent↔legacy maps, **grep all `getServiceFormTemplate` callers + `SERVICE_FORM_TEMPLATE_GOALS` references** again (phase 4 re-keyed them; confirm the legacy wrapper still covers every call site — no silent field-drop). 3. GoalStep rewrites (keep OptionCard grid look; "Other" = simple expand, no modal). 4. Writeback preference. 5. Tests.

**Verification:** `npx tsc --noEmit` · `npm run test:run -- bridge` · `npm run test:e2e -- generation` (wizard flow spec must pass in mock mode) · manual: manufacturer sees enquiry/request-quote first; SaaS sees demo/trial/signup/waitlist; "Other" reveals all; scrape-prefilled project lands pre-selected. **Gate: user reviews wizard UX before proceeding.**

---

## Phase 9 — Acceptance fixtures + parity QA  ⚠️ **HUMAN GATE (final acceptance before merge)**

**Goal:** Encode the spec's acceptance criteria as tests; run the manual parity checklist.

**Files touched:**
- `src/modules/goals/__tests__/acceptance.scale05.test.ts` — NEW fixture-driven suite:
  - writer/follow-social → GOAL_REF resolves Instagram social Destination; injected followStrip present; published markup carries beacon attrs.
  - kathaworld/download-app (both store links via `param.links`) → storeBadges section with TWO badge hrefs (Play + App Store).
  - saas/free-trial → guidance table yields subtext line; GOAL_REF → external redirect.
  - consultant/book-call → `seedGoalForm` output: form in `content.forms`, placement record present (renders via `FormPlacementRenderer`), CTA wired, hero anchor `#form-section`.
  - subscribe-newsletter → writeback stamps `mechanism='M1'` (override, not vocab M4); email-capture form seeded (M1 path); hero GOAL_REF resolves `#form-section` anchor; NO followStrip injected.
  - whatsapp goal → exact prefill template string in resolved href, zero AI-provider imports (static assertion on module graph not required — prefill module has no client/AI imports by construction; assert string equality).
- `src/utils/normalizeCtas.test.ts` — extend: GOAL_REF with param-composed destinations across M1–M4.
- `docs/task/scale-05-goal-machinery.plan.md` — progress log final update (orchestrator).

**Steps:** 1. Fixtures (reuse frozen-fixture patterns from generation-contract tests). 2. Extend normalizeCtas suite. 3. Full local gates.

**Verification:** `npx tsc --noEmit` · `npm run test:run` (FULL suite) · `npm run build` · manual `/manual-test` subset: editor↔published parity for hero subtext, storeBadges, followStrip on meridian + hearth; form submit → FormSubmission + lead email; wa.me link opens with prefilled text on a phone. **Gate: user signs off acceptance + merges (no-PR workflow: build/tsc/tests green locally before push).**

---

## Landmine checklist (applies to every phase)

- Dual-renderer parity: every block change = `.tsx` + `.published.tsx`, identical layout/classes; shared helpers in plain modules only (NEVER import from a 'use client' file into a published twin). Shared-block registries are SPLIT (registry.ts = edit-only, registry.published.ts = published-only) — never merge them.
- Shared-block registry keys are LOWERCASE (`storebadges`, `followstrip`) — both `extractSectionType` implementations lowercase the type; a cased key = silent non-resolution (Phase 6 note).
- No `prisma db push`; no schema.prisma change is expected at all in this feature (Brief/content are JSON columns).
- `npm run build` (not bare `next build`) whenever published-block classes/CSS or assets change (phases 2, 6, 7, 9).
- Extend existing test files (`resolveCtaHref`, `normalizeCtas`, `goalToDestination`, `destinationShim`, `legacyHrefShim`) — don't replace.
- Legacy enums (`landingGoals`, `serviceGoals`) untouched; all new keys are `GoalIntent`.
- `subscribe-newsletter` mechanism is OVERRIDDEN to M1 at the writeback layer (design call #6) — never derive it from `goalIntentMeta[...].mechanisms[0]` (frozen vocab says M4), and never edit vocabulary.ts to "fix" it.

## Unresolved questions

1. Shared-block home `src/modules/generatedLanding/sharedBlocks/` + split edit/published registries OK? (gate at phase 6)
2. cta_subtext scope: 4 core templates only, bespoke (surge/lumen/granth/vestria) deferred — OK?
3. Follow-strip placement: after hero OK, or footer-adjacent?
4. ~~subscribe-newsletter mechanism~~ — **RESOLVED (orchestrator): M1 form (email capture) via Phase 4 auto-seed, enforced by an intent-specific writeback override (vocab meta stays M4, untouched).**
5. Store badges: inline SVG "official-style" art acceptable vs downloading official badge assets?
6. RSVP `param.date`: collected + stored only (no rendering) in this feature — OK?
7. Phase 4 seeds forms for BOTH audiences at generation — product too, or service-only first?
