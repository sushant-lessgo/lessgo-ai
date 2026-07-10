# social-posts — implementation audit

## Phase 1 — Brand-context accessor (pure, tested)

### Files changed
- `src/modules/social/types.ts` (new)
- `src/modules/social/brandContext.ts` (new)
- `src/modules/social/brandContext.test.ts` (new)
- `src/modules/social/README.md` (new)

### What was built
A pure, read-only `src/modules/social/` module. `buildBrandContext(project)`
distills a Project row into a normalized `BrandContext` (businessName, oneLiner,
category, goal, offer, audience, brandTone, facts, features[], testimonials[],
socialProfiles[]) drawing from `Project.brief`, `Project.content.onboarding`
(confirmedFields / featuresFromAI / hiddenInferredFields.brandTone),
`Project.content.finalContent` sections, and `inputText`/`title`. It normalizes
BOTH testimonial shapes (product collection array vs service flat block) and
folds features/services collections into `{feature,benefit}` pairs.
`summarizeBrandContext(ctx)` renders a compact, section-omitting prompt block.
Every accessor is null-safe; array fields are always arrays.

### Key implementation decisions / ambiguities resolved
- **finalContent has TWO storage modes.** The plan referenced
  `Project.content.finalContent.content`, but current editor drafts use
  page-store mode (`finalContent.pages[pageId].content`) — confirmed in
  `src/lib/testimonials/applyToPage.ts`. `collectSections()` scans BOTH (all
  pages + flat mirror) so testimonials/features are found regardless of mode.
  Conservative: merge both, page slices win. Logged as in-scope decision.
- **Feature field names.** Onboarding `featuresFromAI` uses `{feature,benefit}`,
  but content-section feature/service collections use `{title,description}`
  (verified in `audience/{product,service}/elementSchema.ts`). Normalizer maps
  `title→feature`, `description→benefit`. Onboarding `featuresFromAI` is
  preferred; content sections are a fallback only when onboarding has none (avoids
  duplicating the same features from two sources).
- **`goal` is a string.** `Brief.goal` is an object `{intent,mechanism,...}`;
  rendered as `"intent · mechanism"`. Onboarding `landingPageGoals` confirmed
  value preferred when present.
- **businessName** resolves `confirmedFields.productName` → `businessName` →
  `project.name` → `project.title`. (Note: prisma `Project` has `title`, not
  `name`; both are accepted on the loose input type so phase 4's separate
  `findUnique` can pass either.)
- **Input type is loose** (`BrandContextInput`: all optional, `content: unknown`)
  so a bare `{ brief }`, a raw prisma row, or `{}` all type-check and never throw.
- Testimonials require both `quote` AND an author name to be emitted (a bare
  service testimonials section with empty defaults yields `[]`, not a junk entry).

### Verification
- `npx tsc --noEmit`: clean for this module. One PRE-EXISTING unrelated error
  remains — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'`
  (asset import, not touched by this phase, present before my changes).
- `npx vitest run src/modules/social/brandContext.test.ts`: 8 passed.
- `npm run test:run`: 104 files passed / 1 skipped; 1765 tests passed / 3 skipped.
  No regressions.
- `git status`: only `src/modules/social/` is new — exactly the 4 phase-1 files.

### Notes for phases 2-7
- **finalContent dual storage mode** (above) — any later code reading page content
  must handle `finalContent.pages[*].content`, not just flat `.content`.
- **Content feature/service collections use `title/description`, not
  `feature/benefit`** — already normalized in brandContext; keep in mind if any
  later phase reads sections directly.
- **Prisma `Project` display field is `title`, not `name`** — the plan's phase-4
  `findUnique` select list mentions `name`; use `title` (or add both). The
  accessor tolerates either.
- `Brief.goal.destination` and `Brief.facts` are loose (`z.record`) — carried
  verbatim; no schema assumptions made.

### Phase 1 follow-up — section-fallback coverage

- **Gap closed:** the `extractFeaturesFromSections` fallback (title→feature,
  description→benefit) was previously unexercised — every existing fixture either
  supplied `featuresFromAI` (product) or an empty features result (service/bare).
- **Fixture added** (`brandContext.test.ts`, case `(e)`
  `sectionFeaturesFallbackProject`): onboarding OMITS `featuresFromAI` entirely so
  the fallback fires, and a page-store `services-svc00001` section carries a
  `services` collection of `{ id, title, description }` items. Section key
  exercised: `services-*`; collection element key: `services`; item keys:
  `title` / `description` (matches `audience/service/elementSchema.ts` IconServiceCards).
- **Assertion is failable:** asserts exact mapped strings —
  `features[0].feature === 'Brand Strategy'`, `features[0].benefit === 'Position you to win'`
  (plus the second item). Swapping title/description in the normalizer, or dropping
  the fallback, turns it red (features would be `[]` or reversed).
- Only `src/modules/social/brandContext.test.ts` was touched. This file now has 9
  tests (was 8). Full suite: 1766 passed / 3 skipped (was 1765/3). `tsc` clean
  aside from the known unrelated `app/page.tsx` / `founder.jpg` error.
