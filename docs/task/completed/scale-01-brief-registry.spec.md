# scale-01 — Brief record, self-describing registry, goal enums

Source: scalePlan §2 (3 lists + Brief), §3 invariants, §6 enums, §7 capability vocab, §11.3/4/8. Depends: none. **Pure data layer + tests — zero funnel behavior change.**

## Goal
Everything downstream (router, gate, wizard, generation) reads one persisted Brief and queries one self-describing template registry. This spec creates both, empty of behavior.

## Scope IN
1. **Brief record** — persisted per project (new `brief Json` column on `Project` or new model; coder picks, migration via `prisma migrate dev`):
   `{ businessType, copyEngine, category, goal{intent, mechanism, destination/param}, facts, proofAvailable, socialProfiles[], structure{mode, pages[]}, designStyleHint, templateShortlist[], confidence }`
   Typed contract in `src/types/` + zod schema. Readers come in later specs.
2. **Goal enums** (frozen, coder-maintained — §11.2): 18 intents incl. place intents now (§11.8), `buy`→`buy-via-link` (D16); 5 mechanisms M1–M5. One module, e.g. `src/modules/goals/vocabulary.ts`.
3. **Capability vocab** (closed enum, §7): `multipage · gallery · catalog · map-hours · bilingual · video-hero · store-badges · lead-form · packages · blog`.
4. **Registry metadata** — extend `src/modules/templates/registry.ts` entries with `{ copyEngines[], capabilities[], designStyles[], retired? }`. Loader-only today (inventory #12). Declaring metadata for the 7 live templates IS the audit (§11.3):
   - meridian: thing · tech/minimal · caps: lead-form
   - vestria: thing · editorial/craft · caps: multipage, lead-form, catalog(? verify collections wiring)
   - hearth: trust · warm/human · lead-form
   - lex: trust · authority/professional · lead-form
   - surge: trust · bold/performance · lead-form, packages, case-studies→(map to `packages`/`blog`? coder verifies actual blocks)
   - granth: work · literary/quiet · blog(?)
   - lumen: work · bespoke-off-funnel flag (D4) — registered but never in shortlists
   - techpremium: `retired: true` (§11.4) — out of every catalog/shortlist
5. **Engine-core section sets, frozen** (§3): `thing-core` = meridian's 7 · `trust-core` = hearth's list · `work-core` = granth/lumen. One module, e.g. `src/modules/engines/coreSections.ts`.
6. **Conformance tests** (Vitest, dispatch-regression pattern): (a) every non-retired template implements ALL its engines' core sections in its block map; (b) every declared capability's blocks exist. Red test = can't ship (designer's bar).
7. **businessType list v0** — config module `{ key, label, copyEngine, requiredCapabilities[], defaultStyle, wizardFields (labels/examples), extractionSchemaKey, likelyIntents[3-4] }`. Seed entries matching what templates serve today: saas, manufacturer, agency, consultant, coach, writer. (Melting manufacturerFlow into this = spec 08; v0 entries just exist + are tested for shape.)

## Scope OUT
Router, gate, wizard, any UI, any behavior keyed off the new data (specs 02+). No deletion of existing routing confetti yet.

## Acceptance
`tsc` + `test:run` + `build` green · conformance tests pass for all 7 declarations · fit-query helper `fit(template, brief)` (scalePlan §7 hard-fit: `engine ∈ engines ∧ required ⊆ capabilities`) implemented + unit-tested against fixture briefs (photographer→0 match, saas→meridian+vestria, agency→hearth/lex/surge) · zero runtime behavior change (existing e2e passes untouched).

## Open questions
1. Brief storage: `Project.brief Json` vs new table — coder decides (lean: column; it's 1:1 and read-heavy).
2. vestria `catalog` + granth `blog` declarations: verify blocks actually exist before declaring (conformance test decides).
