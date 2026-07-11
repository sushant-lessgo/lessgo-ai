# template-factory — spec

Template-addition pipeline + per-template flexibility (looks/token knobs).
Agreed 2026-07-10. Two halves, one system: (A) repeatable ~1-week pipeline
demand-signal → shipped template; (B) deep parameter space per template so few
templates ≠ same-looking sites (D7: variety = parameters over template count;
evidence: Shopify Dawn ~590k stores, 4 verified same-niche Divi dentists).

## Problem / why
- `/new-template` skill is 640 lines of prose mirroring code — already wrong
  (predates scale-07 engine contracts, scale-08 deletions, scale-09
  blockManifest/variant dispatch; missing surge/vestria/granth/lumen). Rots
  every scale phase.
- Template addition today = weeks of interpretive porting; public beta needs
  ~1 week per demand signal.
- Claude design converges to same-y visuals (mode: Inter/gradients/rounded
  cards) — variety must be manufactured, not hoped for.
- Public-beta sameness fear is real but is a PICKER-presentation + parameter-
  depth problem, not a template-count problem. 50 hand-built templates =
  permanent conformance/QA liability × every future platform change.

## Goal
A template is added through a contract-shaped pipeline (kit → design → lint →
agent port → conformance green → parity QA) in ~1 week of mostly-agent work,
and every template ships with a deep tokenized parameter space (block variants
× palettes × type variants × look knobs) presented in the picker as curated
named LOOKS — hundreds of visibly different starting points from few skeletons.

## The pipeline (agreed shape — what, not how)
0. **Decision gate** (skill leads with it): capability gap → block pairs on the
   engine's flagship + declare capability (scalePlan §7 path C — never D when C
   works); style gap (empty designStyle cell / demand-board signal) → new
   template (path D); engine missing → path E, separate decision.
1. **Design kit** — DERIVED from code (engine contract): required core
   sections in order, per-section element slots + optionality + card min/max,
   format constraints (one self-contained static HTML, `:root` tokens,
   `[data-palette]`/`[data-variant]`/`[data-surface]` axes, class prefix,
   self-hosted-font list, knob RANGES to design — see flexibility below).
   Derived ⇒ can't rot.
2. **Art-direction brief** — deliberate per-template, where variety is made:
   concrete reference anchors (not adjectives) drawn from a curated growing
   ANCHOR LIBRARY; banned list = existing templates' style fingerprints
   (derivable from designStyles/templateMeta) + default-mode bans (Inter,
   purple gradients, glassmorphism, rounded-2xl grids, emoji icons); explicit
   typeface + token decisions made by founder.
3. **Session protocol** — divergence where cheap: art-direction only → 3–5
   hero-only style tiles from DIFFERENT anchors → founder picks (D6 taste
   moment) → THEN kit introduced → full design expansion. Never one-shot.
   Reference images/moodboards as anchors when tiles converge.
4. **Handoff lint** — before build: all core sections present, every required
   slot representable, axes structured right, fonts hostable. Fail → back to
   design while fixes are one prompt.
5. **Build** — clone donor → port → block pairs → declarations; runs through
   `/feature` agent pipeline; definition of done = parameterized
   `templateConformance(templateId)` single-call suite (core-set coverage =
   designer's bar, consumes ⊆ contract, resolve + distinctness both modes,
   capability honesty, published/client boundary, knob-set present). Adding a
   template = add one line; red tests ARE the checklist.
6. **Register & serve** — List 3 entry `{copyEngines, capabilities,
   designStyles, looks}`; serve gate + picker pick it up automatically.

## Flexibility (looks / token knobs)
- Every knob = CSS token set by data-attr axis (the `data-palette`/`data-variant`
  mechanism extended). Blocks NEVER branch on a knob (no per-block conditionals
  — D9 at CSS level; combinatorial QA otherwise). Token-written blocks are
  correct under every combination for free, dual-renderer safe.
- Standard knob set (per template, conformance-assertable): button shape
  (`--btn-radius` square/rounded/pill), card style (hairline/shadow/flat),
  density (spacing multiplier), type pairing (existing variant axis),
  texture/mood.
- **Presets, not sliders:** users pick curated named LOOKS (bundles of knob
  values), never raw knobs (D6; also the quality moat). Picker presents looks
  as the "many templates" surface.
- Design kit demands knob RANGES from the design phase (button system at all 3
  radii, light+dense spacing) so ranges are designed, not retrofitted.
- Generation SPREAD: deterministic variety in starting palette/blocks/look for
  new sites in the same niche (eligibility filter already picks blocks — add
  spread), so no two same-niche customers start identical.
- Compounds multiplicatively with scale-09 block variants: 3 heroes × 5
  palettes × 3 looks = 45 distinct salons from one skeleton.

## Editor-basics contract (added 2026-07-11 — founder: "logo upload missing, link
## configure missing — have we defined the basics?")
The universal editor affordances EVERY template must support, frozen as a list and
enforced in `templateConformance()` (machine-checkable part) + `/manual-test` (the
rest). Today these live only as skill prose (§3f) — skippable, hence the recurring
misses. The v0 contract:
1. Header logo upload (change/remove, wordmark fallback, `logo_image` element).
2. Every contract text element wrapped in the template's Editable (no dead text).
3. Every image slot wired to `uploadImage`/`bulkUploadImages` (replace/remove).
4. Every button/CTA opens Button Settings (link/goal configure, GOAL_REF).
5. Nav + footer links editable via `LinkTargetPopover`.
6. Collections (cards, gallery items, list rows): add / remove / reorder.
7. Social links editable.
8. Form blocks accept the form-builder field config.
9. Palette/variant/knob switching live without breaking edited content.
Enforcement split decided at build: items assertable by rendering edit-blocks in
jsdom (Editable wrappers present per contract element, logo/img/button wiring)
go into `templateConformance()`; visual/interactive rest goes into the parity QA
+ a `/manual-test` editor-basics subsection. Conformance failure = template not
done (designer's bar extends to the EDITOR, not just the render).
Playwright screenshot-diff: render each block edit-mode vs published, pixel-
diff. Automates the #1 trap (dual-renderer parity); shrinks the human gate to
a visual taste pass. Highest-leverage single build for template throughput.

## Skill rewrite (thin)
- Rewrite `/new-template`: decision gate first, then workflow (kit → design →
  lint → build → conformance → parity QA), covering BOTH paths (flagship
  capability blocks + new template) with one build core.
- Keep ONLY evergreen hard-won landmines tests can't fully catch: dual-renderer
  discipline, plain `styles.ts` rule, class prefixing, margin-collapse through
  `data-surface`, self-hosted fonts, behaviors asset, two-identifier
  discipline, bespoke §13 mode.
- DELETE every fact derivable from code (layout maps, export names, schema
  locations) — point at `blockManifest.ts`/`elementContracts.ts`/`registry.ts`
  instead. Prose that mirrors code rots.

## Scope OUT (non-goals)
- Mass template production ahead of demand; any template-count target.
  Capacity ~1/week, utilization on demand-board evidence only.
- Free-form styling knobs/sliders exposed to users (curated presets only).
- Migrating lex/lumen/granth/techpremium to manifests/knobs (defer; legacy
  name-map fallback stands per scale-09 Q6).
- New copy engines (path E) — separate decision when demand forces it.
- AI taste-scoring / auto-picking looks (D6: machine facts, user taste).
- Marketplace / third-party template submissions.
- Retrofitting knob ranges onto every existing template at once — flagship(s)
  first, rest on demand.

## Constraints
- After scale-09 phases 6–7 land (they're the first exercise of variant-adding;
  their friction feeds the skill rewrite).
- Bundle firewall sacred: kit generator + manifests + meta = pure data; no
  template component imports in selection/generation paths.
- Designer handoff format stays ONE self-contained static HTML (Meridian
  precedent) — Claude design must be instructed to it, not Tailwind/React.
- Copy never knows templateId (§3 invariant); knobs/looks are render-side only,
  zero copy-regen on swap.
- Conformance = the designer's bar gate (scalePlan §11.3: no partial templates,
  ever).
- Solo-founder economics: taste-pick and parity sign-off stay human; everything
  else agent-executable.

## References
- `src/modules/templates/blockManifest.ts` — pure-data declaration idiom the
  kit/meta extend.
- `src/modules/engines/elementContracts.ts` — contract source the design kit
  derives from.
- `src/modules/templates/conformance.test.ts` + `blockManifest.test.ts` —
  suites to consolidate into `templateConformance(templateId)`.
- `.claude/skills/new-template/SKILL.md` — current skill; landmines §3f/§3g/§10
  are the evergreen keep-list.
- `Meridian - Modern Tech.html` — the handoff exemplar the kit points at.
- Hearth/meridian `tokens.ts` + `ThemeInjector` — the data-attr → CSS-var knob
  mechanism to extend.
- `docs/tracks/scalePlan.md` §6 (capability honesty test), §7 (C-beats-D
  table), §11.3 (designer's bar), D6/D7/D9/D11.
- `docs/task/scale-09-block-variants.plan.md` — variant/distinctness patterns
  conformance must absorb.
- Prior art evidence: Shopify Dawn (~590k stores), Divi same-niche dentists
  (kemmetdental / cedarvillagedentistry / ayottedental / dcdentalclinical),
  Squarespace Brine family (≈50 "templates", one codebase).

## Open exploration questions
- `templateMeta.ts` current shape vs List 3 registration entry — how much of
  `{copyEngines, capabilities, designStyles, looks}` already exists?
- How are variant axes bundled today in each template's `variants.ts` — can
  they decompose into orthogonal knobs without breaking existing projects'
  stored `variantId`?
- Picker surfaces (StyleStep / ServiceThemePopover / product picker absence) —
  where do named looks slot in; what's stored on Project (lookId vs knob set)?
- Playwright infra: can e2e harness drive edit-mode blocks per section
  in isolation for screenshot diff, or page-level diff only?
- Kit generator: enough to be a skill step reading schemas, or does slot
  extraction need a small script?
- Anchor library home: docs file vs template-design/ (gitignored)?

## Candidate human gates
- Style-tile pick per template (founder taste, by design).
- Knob decomposition of existing variant axes (touches live projects' stored
  variant/palette — verify no visual change on existing customer sites).
- Picker UX change to looks (customer-facing surface).
- Parity QA sign-off per new template (per-template gate, permanent).
- Skill rewrite review (process doc — founder reads before it governs builds).

## Acceptance criteria
- [ ] Decision gate documented; skill refuses "new template" when capability
      path fits (per §7 table).
- [ ] Design kit generated from engine contract for trust + thing + work
      engines (work-engine grammar formalized by the atelier spec feeds it);
      contains sections/slots/capacities/format/knob-ranges; regenerating after
      a contract change updates it (derived, not hand-written).
- [ ] Anchor library exists with ≥15 anchors + banned-list derivation from
      existing template fingerprints.
- [ ] Handoff lint catches a deliberately broken HTML (missing section,
      missing required slot).
- [ ] `templateConformance(templateId)` single call covers: core-set coverage,
      consumes ⊆ contract, resolve + distinctness both modes, capability
      honesty, published/client boundary, standard knob set, **editor-basics
      contract (machine-checkable subset)**.
- [ ] Standard knob set tokenized on ≥1 flagship; ≥3 named looks presented in
      picker; look swap = zero copy change, both renderers correct.
- [ ] Screenshot parity diff runs against one template and fails on a seeded
      parity break.
- [ ] `/new-template` rewritten thin (gate + workflow + evergreen landmines;
      zero code-derivable facts).
- [ ] End-to-end drill: ONE new template from demand signal → live, founder
      time = taste-pick + 2 gates only. **Drill = `atelier` (work engine,
      Kundius — templatePlan on-demand queue #1), replacing the hypothetical
      salon/trust drill.** Executed via `docs/task/atelier-template.spec.md`
      AFTER this build; this spec's deliverables (kit, lint, conformance,
      parity diff) must be ready for it. ≤1-week wall-clock measured on the
      atelier port phase only (its i18n dependency doesn't count against the
      pipeline claim).

## Pilot / smallest slice
Two thin slices, either order:
1. **Knobs pilot:** tokenize button-shape + density on hearth, 3 named looks,
   picker presents them. Proves flexibility mechanism + look storage.
2. **Pipeline drill:** run the drill template end-to-end through kit → design →
   lint → agent port → conformance. Proves the ~1-week claim + the kit/lint
   artifacts. (Drill = atelier, per acceptance criteria — design step already
   done via the KP direction tiles; lint runs retroactively over the approved
   HTML.)
Decision gate after both: measure "10 generated same-niche sites — any two
same at thumbnail?" → invest in more variants/knobs vs more templates based on
the answer, not feeling.
