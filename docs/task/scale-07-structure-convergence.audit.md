# scale-07 structure convergence — implementation audit

## Phase 1 — Engine-owned section grammar (behavior-preserving wiring)

**Files changed**
- `src/modules/engines/sectionGrammar.ts` (new) — the engine-owned grammar: `buildSectionList()`
- `src/modules/engines/sectionGrammar.test.ts` (new) — exhaustive equivalence matrix vs pre-grammar behavior
- `src/modules/audience/product/sectionSelection.ts` (edit) — `selectProductSections` delegates to grammar via temporary `extras`
- `src/modules/audience/service/sectionSelection.ts` (edit) — `selectServiceSections` delegates to grammar; ordering maps become grammar ordering data

### Grammar API (as settled)

```ts
buildSectionList({ engine, brief?, ordering?, gates?, extras? }) → string[]
```

- `engine: CopyEngine` → core from `engineCoreSections` (frozen scale-01 contract).
- `ordering?: readonly string[]` — resolved MIDDLE order (caller resolves awareness → order via its map; grammar stays template-free / firewalled — zero template/templateMeta/registry imports). Omitted ⇒ core minus header/footer.
- `gates?: SectionGates` — `{ hasTestimonials?, showPackages?, hasClientLogos?, hasCaseStudies? }`. Filter law verbatim from old `selectServiceSections`: `testimonials`→hasTestimonials, `packages`→showPackages (`format !== 'quote-only'`), `logos`→hasClientLogos, `casestudies`→hasCaseStudies; everything else (incl. surge `about`/`stats`) always passes. Defaults: asset flags `?? false`, `showPackages ?? true` (mirrors `undefined !== 'quote-only'`).
- `extras?: readonly string[]` — full-list verbatim override for meridian/vestria pilot lists. Marked `@deprecated — removed in scale-07 phase 2`.
- `brief?` — reserved, unused in phase 1 (phase-2 capability sections).
- Wrap: header/footer prepended/appended iff present in the engine core (`[header, ...body, footer]` for thing/trust; work core has no header — untouched/unwired this phase).

### Rewire details

- **Service:** `AWARENESS_MIDDLE_ORDER` / `SURGE_MIDDLE_ORDER` kept in place as data; selector resolves `orderMap[awareness] ?? orderMap['search-aware-comparing']` (fallback preserved) and calls the grammar with `engine:'trust'` + ordering + gates. Public signature (`ServiceSectionSelectionInput` incl. `goal`) unchanged.
- **Product:** `MERIDIAN_PILOT_SECTIONS` / `VESTRIA_PILOT_SECTIONS` exports kept; selector passes the chosen list through `extras`. Signature unchanged.
- Callers (`parseStrategyProduct.ts`, `parseStrategyService.ts`, mock generators) untouched. `work` engine NOT wired.

### Byte-identical proof (fixture approach)

`sectionGrammar.test.ts` — 123 tests:
1. **Frozen reference impl** — verbatim copy of the pre-rewire `selectServiceSections` logic + both ordering maps, frozen inside the test file; the live selectors are asserted equal to it across the full matrix.
2. **Literal anchors** (7) — hard-coded expected arrays pinning the reference itself (trust baseline, no-testimonials+quote-only, cold order, surge all-on 11-list, surge nothing-on quote-only, meridian/vestria pilot lists verbatim).
3. **Trust default matrix** — {undefined, hearth, lex} × 4 awareness × hasTestimonials × format(quote-only|packages) = 48 cases.
4. **Surge matrix** — 4 awareness × hasClientLogos × hasCaseStudies × hasTestimonials × format = 64 cases; each also asserts logos/casestudies/testimonials/packages gating booleans and always-on `about`/`stats`.
5. Awareness-fallback case (cast out-of-range value ⇒ comparing order) + product `extras` pass-through (fresh-array, verbatim).

### Deviations

- Plan sketch left `extras` semantics open (append vs override). Vestria's pilot order interleaves extras between core sections, so append can't reproduce it — implemented `extras` as full-list verbatim override (conservative, exactly reproduces current output; deleted in phase 2 anyway).
- Trust matrix widened to ×3 templateIds (undefined/hearth/lex) beyond the plan's "hearth/lex" wording — free coverage of the undefined branch.
- Added the awareness-fallback test (not in the plan matrix) to lock the `?? 'search-aware-comparing'` behavior.

### Test results

- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — `Test Files 91 passed | 1 skipped (92)` · `Tests 1389 passed | 2 skipped (1391)` — existing section-selection/wizard/trust tests green unchanged (no existing test edited).
- `npx vitest run src/modules/engines/sectionGrammar.test.ts` — `Test Files 1 passed (1)` · `Tests 123 passed (123)`.

### Open risks

- Grammar's no-`ordering` default path (core-minus-header/footer middle) is not exercised by any production caller yet — first real consumer is phase 2.
- `brief` param is a placeholder (`unknown`); phase 2 types it when capability resolution lands.
