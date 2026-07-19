# engineDecider — scout findings (condensed, for the planner)

> 5 read-only scouts. All `src/` paths verified present in the worktree.
> **The designer handoff folder is UNTRACKED and lives ONLY in the main repo checkout, NOT the worktree:**
> `C:\Users\susha\lessgo-ai\docs\Design\Lessgo AI UI redesign\design_handoff_lessgo_app\Engine Decider\`
> (`README.md` = the design spec; `Lessgo Engine Decider.dc.html` = annotated reference, do NOT reproduce verbatim). Read from that absolute path.

## ⚠️ Big scope discovery — much of the "backend" is ALREADY built
- **Persona gate is already retired** in `src/app/api/start/route.ts` (scale-02). It's now a pure creator (upserts User, plan, Token, Project → returns `/onboarding/{token}`). The classifier is GONE; access-gating already relocated to `decideServe → manual → /api/demand-lead`. Residual only: back-compat `personaToAudienceType`/`audienceType` plumbing (route.ts ~:50-53,67-69) to clean up. **The spec's "persona-gate split" is ~90% done** — verify + finish cleanup, don't rebuild.
- **D5 demand board backend already exists:** `DemandLead` Prisma model + `POST/PATCH /api/demand-lead` (`{userId, input, briefDraft, missing, email, phone, fasttrack}` + founder email). serveGate `manual` outcome already collects rung tags; place/quick-yes already tagged `rungE:<engine>` and can never serve. D5 work = the UI + wiring the demand tag, not new backend.
- So the true build weight is: **the `ambiguous` state + the 6 UI screens + entry-carrythrough + rail engine field + routing wiring.**

## 1. classify.ts (`src/modules/brief/classify.ts`) + confidence
- `resolveEngine` (L133-147): input `Pick<EntrySignals,'businessTypeGuess'|'tiebreaker'>` → returns `{engine: ResolvedEngine; source}`. **ALWAYS a single engine — never ambiguous/unknown.** Lookup `businessTypes[key].copyEngine` (source `lookup`) else 5-rung tiebreaker ladder; `'none'`/unknown silently collapse to `'thing'` (L144). **This single-engine collapse is the #1 thing to change.**
- `ResolvedEngine` (L34) = `CopyEngine | 'place' | 'quick-yes'` (5-value; wider than schema's 3).
- `EntrySignals` (L63-90): raw AI output — `businessTypeGuess: string|null`, `businessTypeConfidence: number`, `tiebreaker`, category, prefill echoes. **AI never emits the engine** (schema forbids it, prompt L137-150). Firewall intact.
- `EntryFacts` (L97-113): carrier at `brief.facts.entry`; holds `resolvedEngine: ResolvedEngine` (single), classificationSource, tiebreaker, prefill.
- `applyBusinessTypeCorrection` (L240-260): the ONLY sanctioned correction path — re-resolves engine (lookup), resets `facts.entry`, re-parses BriefSchema. Called by `ConfirmBriefStep.tsx:51`.
- `buildBriefDraft` (L184): calls resolveEngine, sets `brief.copyEngine` only if engine ∈ {thing,trust,work} (`isSchemaEngine`); sets `brief.confidence`. Callers = `/api/v2/understand` + `/api/v2/scrape-website` (the de-facto entry-classify API; **no dedicated /api/entry-classify route exists**).
- **Confidence** = AI self-report number (`businessTypeConfidence`, 0-1, no Zod min/max). `LOW_CONFIDENCE_THRESHOLD=0.6` (L31) consumed in EXACTLY ONE place: `ConfirmBriefStep.tsx:36` to pre-open the businessType chooser. **Decoupled from engine resolution + serve gate.** (Q3: today confidence gates only a UI chooser, not resolution — so "low confidence" ≠ "ambiguous engine". A deterministic "is the guess a known-unambiguous type?" rule would be cleaner; resolve at plan.)
- `entryClassify.schema.ts`: AI returns businessTypeGuess, businessTypeConfidence, category, goalIntentGuess, tiebreaker(5 rungs), structureHint, designStyleHint, platformNeeds + prefill. Compile-time parity guard vs `EntrySignals` (L98-99).
- `/api/brief/confirm` (route.ts): validates BriefSchema, auth+assertProjectOwner, **re-runs `decideServe(brief)` authoritatively** (L71). serve→writes Project + redirects `/onboarding/{token}`; manual→no write, returns missing/outOfIcp. Never reads engine directly.

## 2. businessTypes registry (`src/modules/businessTypes/config.ts`)
- `BusinessTypeEntry` (L27-72): flat `copyEngine: CopyEngine` (single committed), + requiredCapabilities, defaultStyle, wizardFields, extractionSchemaKey, voiceHint?(thing-only), likelyIntents, structureDefault, requiredCollections?.
- 9 keys: saas/manufacturer/app→thing; agency/consultant/coach→trust; writer/photographer/designer→work.
- **Add `ambiguous` via discriminated union** on `BusinessTypeEntry`: `{engineState:'committed'; copyEngine}` | `{engineState:'ambiguous'; candidateEngines[]; priorEngine}`. Candidate type wants `ResolvedEngine` but that's in classify.ts → **import-cycle risk** (config is deliberately import-light, header L14-17). Resolve where the engine union/type should live.
- Canonical enum: `src/types/brief.ts:16` `copyEngines=['thing','trust','work']` (CLOSED at 3; place/quick-yes reserved, only exist as `ResolvedEngine` literals + tiebreaker targets).
- **The only two authoritative `businessTypes[key].copyEngine` readers = `classify.ts:137` (resolveEngine) + `:244` (applyBusinessTypeCorrection).** Both must learn "entry may not commit to one engine." Other readers: product/voice.ts:122 (voiceHint), admin/page.tsx:176,536, templates/fit.ts (reads resolved `brief.copyEngine`). Many tests assert every entry has a valid copyEngine — will need updating.

## 3. Onboarding entry + O1 + the seam (`src/app/onboarding/[token]/...` + journey)
- Entry owner: `src/app/onboarding/[token]/page.tsx` (`EntryOnboardingPage`) — a LOCAL step machine, `EntryStep = 'input'|'confirm'|'manual'|'wizard'|'journey'`, all state in React `useState` (NO store) — `rawInput`, `briefDraft`, `step` (page.tsx:84,107-113).
- Capture: `EntryInputStep.tsx` — one field (one-liner OR URL); URL→`/api/v2/scrape-website`, text→`/api/v2/understand`, both `entry:true`; on success `onSuccess(rawInput, briefDraft)` (L169) → page stashes + advances to `'confirm'` (page.tsx:234-242). One-liner lives in `Brief.facts.entry` (`entry.oneLiner ?? entry.rawInput`).
- **O1 duplication:** if classified engine has a journey seam, page branch (b) renders `JourneyEntryStep` (=work journey STEP 01) instead of `ConfirmBriefStep` (page.tsx:185-206). `JourneyEntryStep` **re-presents the one-liner in an editable Textarea** seeded from the captured value — `useState(()=>entryOneLiner(briefDraft))` (**JourneyEntryStep.tsx:80**), the `<Textarea>` at **:240-251** ("Describe what you're launching"). Editing re-runs `/api/v2/understand` (another UNDERSTAND credit, `reclassify()` :128-142). **That second screen IS the O1 duplication.**
- **Journey seam contract:** `src/components/onboarding/journey/engines/types.ts` — `interface JourneyEngineSeam` (L363-419): `engine`, `rail` (JourneyRailAdapter: toVM/applyEdit/appendNote), `enrichDraftForConfirm(draft)` (STEP01 pre-confirm mutation), `steps.showWork`/`steps.questions(vm,ctx)`/`steps.plan`, `preflight`, `runGeneration`, `resolveResumeStep`. Lazy step body via `JourneyStepConfig.loadStep?` (dynamic import). `questions()` returns closed 4-kind union `text|group|price|choice` (L230-278).
- **Registry (dispatch firewall):** `engines/registry.ts` `journeySeamRegistry: Partial<Record<CopyEngine, JourneySeamLoader>>` — **ONLY `work` wired**; `loadJourneySeam(engine)` returns null for others. thing/trust declared-but-unimplemented. Eligibility is **template-gated** not engine-gated (granth = work-engine template NOT allow-listed → keeps WizardShell) — leaf `@/lib/journeyEngines` (`hasJourneySeam`/`isJourneyEligible`), page.tsx:43,142,185.
- **Generic wizard `WizardShell.tsx`:** functional post-confirm wizard for all engines. Steps are SLOTS (not numbered): `identity`(Basics: name+oneLiner) · understanding · goal · offer · proof · style · structure · generating. Per-engine skips via `slotsForEngine()`. **"Step 2" = the `understanding` slot** (2nd after `identity`). Store = `useWizardStore` (`src/hooks/useWizardStore.ts`); holds `engine` (from brief.copyEngine, hydrate L916,939) + `fields['oneLiner']` (seeded from brief.facts.entry, L477-499,972-982). **Enter-at-step-2 with no re-ask: value is pre-hydrated + a `goToSlot(slot)` action exists (L1047-1050) but starts at slot 0 (L965) and NO caller wires an enter-at-slot-N path.** So plumbing exists, just unwired — IdentitySlot currently re-surfaces the one-liner.
- Legacy `useProductGenerationStore`/`useServiceGenerationStore` = retired, not consumed by unified path.

## 4. serveGate / persona gate / schema / demand
- `serveGate.ts` `decideServe(brief)` (L175) → `{outcome:'serve',audienceType,templateId,shortlist}` | `{outcome:'manual',missing,tags,outOfIcp}`. serveable = businessType known ∧ in-ICP (not checkout/ordering) ∧ `facts.entry.resolvedEngine ∈ {thing,trust,work}` (`bridgeable`, reads getEntryFacts NEVER brief.copyEngine) ∧ non-empty shortlist. place/quick-yes rejected via rungE (L227-230) → always manual.
- **`/api/start`:** persona gate ALREADY retired (comment :4-9). Pure creator now; classifier gone; access-gate relocated to serve gate. Residual back-compat: `persona?personaToAudienceType(persona):'product'` (:52-53), plumbing :67-69.
- `BriefSchema.copyEngine`: `src/types/brief.ts:16` enum {thing,trust,work} (CLOSED); Zod `src/lib/schemas/brief.schema.ts`; writing place/quick-yes THROWS (guarded by isSchemaEngine). Readers: templates/fit.ts, journeyEngines.ts, useWizardStore.ts, wizard/waterfall.ts. Serve-gate reads `facts.entry.resolvedEngine` instead.
- **Voice:** product/voice.ts (voiceHint-keyed, thing-only), service/voice.ts `selectServiceVoice` (archetype-keyed). Both ASSUME resolved engine (dispatch via resolveCopyEngine).
- **D5 backing store EXISTS:** `POST/PATCH /api/demand-lead` → `DemandLead` model `{userId,input,briefDraft,missing,email,phone,fasttrack}` + founder email. `missing` = serve-gate tags (free-form). `/api/brief/confirm` manual outcome writes nothing to Project; client routes to demand capture.
- Ambiguous ripple spots (assume resolved engine): serveGate.ts:243, classify.ts:136-146, journeyEngines.ts:30,44, bridge.ts:293,315 (briefToProduct/ServicePrefill), voice modules, brief/confirm/route.ts:71 (authoritative re-decideServe — where a "revisable belief" re-classification would branch).

## 5. Designer handoff — the 6 screens (read full README from main-repo path above)
- **D1 One-line in:** radial-bg composer (max-w 700) + live rail RIGHT; 2-tab segmented ("Describe your business"/"Use my current site"); orange Continue; 3 example one-liner→engine-tag rows. Submit → classify → rail engine field spinner→resolved.
- **D2 Known & unambiguous → don't ask (~80%):** rail engine confirmed (green check); centered "You're a photographer — so we'll lead with your work.", change-affordance, blue CTA, auto-continue micro-note. Zero questions. (Kundius→work.)
- **D3 Almost sure → one-tap confirm:** "Sounds like people hire you for your experience — is that right?" primary "Yes — that's it" card + secondary "something else"(→D4). Rail engine dashed "confirming now…". (Feenstra coach→trust.)
- **D4 Buyer-decision question (KEY):** fires for unknown OR ambiguous-known. Rail engine amber "Could go two ways". "When someone lands on your site, what makes them reach out?" 5 option rows, prior pre-selected + "best guess" caption, footer "Continue with Work". (Cirkel Studio→ambiguous, prior=work.)
- **D5 Demand board (place/quick-yes, not built):** rail neutral card + amber "DEMAND LOGGED · #PLACE" chip. "We don't build restaurant sites yet — but we're close." email capture + "Keep me posted & call me" + go-back. **Does NOT write brief.copyEngine.** (Kanji Ramen→place.)
- **D6 Engine set → hands off:** rail Work engine set+revisable; 6-dot step tracker. "ENGINE SET — WORK" + belief-lifecycle card (Inferred→Revised in ingestion→Committed at plan gate) + dark "Handing off to the Work journey" banner + Continue.

### State model (verbatim)
`oneLiner:string` · `entrySignals:{businessTypeGuess,confidence,tiebreaker}` · `resolvedEngine:'work'|'trust'|'thing'|'place'|'quick-yes'|null` · `engineStatus:'resolving'|'known'|'almost-sure'|'ambiguous'|'confirmed'` (drives which of D2/D3/D4 renders) · `engineCommitted:boolean` (false until plan gate) · `demandTag?:string` (D5) · `EntryFacts` (rail: name/whatYouDo/where/whatYouSell+engine; unresolved→striped placeholder).
Transitions: resolving→(known|almost-sure|ambiguous) after classify; ambiguous/almost-sure→confirmed on pick; confirmed→committed at plan gate; ingestion contradiction can reset confirmed→ambiguous.

### "HOW YOUR SITE WINS" rail field (3 states keyed on engineStatus)
Resolving (blue label + spinner, dashed border) · Set/known (white card, blue border+icon chip+name, green check when confirmed) · Ambiguous (amber label+help icon, amber border/bg "Could go two ways"). Below card: **"Change how buyers decide" link → reopens D4 anytime before plan gate** (present on all screens).

### D4 5 options → engine
- "They see my work and love it." → **work** (photo_library) [Cirkel prior + "best guess"]
- "They trust my experience & track record." → **trust** (verified)
- "They understand what my product does." → **thing** (widgets)
- "They see my space, menu, or location." → **place** (storefront) — **SOON**, dashed → D5
- "They already know me — I just need them to act." → **quick-yes** (bolt) — **SOON**, dashed → D5

### Design tokens (§Design Tokens)
Primary blue `#006CFF`, dark-blue text `#003E80`; orange CTA `#FF6B3D`; amber `#c47d1a`(bg `#fbf1e0`/`#fdf7ec`, border `#f0dcb4`); green `#16a34a`; dark panel `#0b1830`; canvas `#e7e7ea`, rail `#fafafb`, main `#f7f8fa`; text `#191922`/muted `#7b7b86`. Striped placeholder `repeating-linear-gradient(135deg,#eef0f4 0 8px,#e6e8ee …)`. Type: Onest (UI), JetBrains Mono (eyebrows/tags), Material Symbols Rounded. Radii 5-20, frame 18. Shell 1280×840, 320px left rail, 58-60px top bar.

### Existing components to reuse (verified in worktree)
- Shell: `journey/JourneyShell.tsx`, `JourneyTopBar.tsx`
- Rail: `journey/UnderstoodRail.tsx` (+.test.tsx) — extend with "HOW YOUR SITE WINS" engine field
- Entry: `EntryInputStep.tsx`, `journey/JourneyEntryStep.tsx`
- Cards/options: `onboarding/shared/OptionCard.tsx` (D4 rows), wizard slot cards
- Work handoff (D6→Steps 2-6): `journey/steps/` + `engines/work/`
- Resolver/registry/serve/schema: classify.ts, businessTypes/config.ts, serveGate.ts, serveMatrix.ts, entryClassify.schema.ts — all present.

## Answers to the spec's open exploration questions
1. **Q3 confidence gate:** Today it's AI self-report `0.6`, consumed in ONE UI spot only, decoupled from resolution. A deterministic rule ("is businessTypeGuess a known-unambiguous type?") is cleaner + matches E3 doctrine + the new `ambiguous` registry state. **Recommend deterministic; keep the design's confidence bar as pure visual.** (Planner: decide + note.)
2. **ambiguous registry shape:** `{prior + candidates[]}` confirmed viable; no consumer needs candidates-only. Discriminated union on BusinessTypeEntry. Watch import-cycle for the engine union type.
3. **Generic wizard functional for thing/trust from step 2?** YES functional; "step 2" = `understanding` slot. Enter-at-slot-N plumbing exists (`goToSlot` + pre-hydrated oneLiner) but UNWIRED — needs wiring so IdentitySlot doesn't re-ask.
4. **Ingestion overturn:** deferred (scope OUT); rail "change how buyers decide" reopen is the manual path; auto re-propose deferred.
5. **Persona-gate access check:** ALREADY moved to serve gate (scale-02). Only residual back-compat cleanup remains in /api/start.
