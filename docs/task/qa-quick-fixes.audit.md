# F1 fix — auto-seeded lead form renders zero fields (edit twins)

## Files changed
- `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.tsx` — fix + comment
- `src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.tsx` — fix
- `src/modules/generatedLanding/sharedBlocks/__tests__/leadForm.parity.test.tsx` — corrected mock shape + regression test
- `src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.editStore.test.tsx` — new regression test

## What changed

### LeadForm.tsx (shared, SharedLeadForm — the M1 seed path)
- Line 27: `store.content?.forms?.[formId]` → `store.forms?.[formId]`. The edit store keeps
  forms top-level in the FormsSlice (`state.forms`, `formActions.ts:22`); `store.content` is
  the section map only, so the old read was always `undefined` → 0 fields + fallback "Submit".
- Updated the header comment that described the old (wrong) `content?.forms` slice.

### VestriaLeadForm.tsx
- Line 24: identical one-line fix. Its symptom was subtler: because `form` was always undefined
  it silently fell back to `DEFAULT_VESTRIA_LEAD_FIELDS` (7 generic fields + "Send request"),
  ignoring the seeded M1 form.

Published twins (`*.published.tsx`) were NOT touched — they correctly read `props.content?.forms`.

### Grep sweep
Searched all non-published block twins for `content?.forms` / `store.forms`. Only the two named
edit twins had the bug. `TechPremiumContact.tsx` uses hardcoded `DEFAULT_CONTACT_FIELDS` (a
different pattern, does not attempt a store read) — left untouched. All other `content?.forms`
readers are `.published.tsx` files.

### Tests
- `leadForm.parity.test.tsx`: the pre-existing mock nested `forms` under `content.forms`,
  mirroring the bug — that is why the existing edit-twin render assertion (line 114) passed
  despite the defect. Moved `forms` to the store top level (real shape) and added a
  `fields.length === form.fields.length` field-count regression asserting the edit twin renders
  one `.lg-fld` per seeded field and the seeded submit label (not the "Submit" fallback tell).
- New `VestriaLeadForm.editStore.test.tsx`: renders the Vestria edit twin against a top-level
  seeded store (block/primitives/core mocked to a passthrough to isolate the store read),
  asserting it uses the seeded 3-field form + custom label rather than the 7-field default.

## Deviations from plan
- The plan named a single render test; I added the Vestria regression too since the fix touched
  that twin and it had no store-seeded coverage. Conservative, in-scope (test files only).
- Also corrected the existing `leadForm.parity.test.tsx` mock shape (it encoded the bug). Without
  this, the F1 fix would have made that file's existing edit-twin assertion fail. In scope.

## Test results
- `npx vitest run` on both files: 2 files, 10 passed.
- `npx tsc --noEmit`: clean.
- Did NOT run the full suite (parallel agents on disjoint files, per instructions).

## Open risks
- The Vestria test mocks the core/primitives/block hook; it verifies the store-read + field
  selection path (the F1 locus) but not full core layout parity (already covered by
  `vestria/coreParity.test.ts`).
- Both twins cast `store as any`, so the corrected slice is not type-checked; relies on the
  runtime FormsSlice contract in `state.ts:445`.

---

# F18 + F12 + F28 + F30a — four small independent fixes

## Files changed
- `src/app/edit/[token]/components/ui/BlockVariantSelector.tsx` (F18)
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` (F18)
- `src/utils/tabManager.ts` (F12)
- `src/lib/normalize.ts` (F28)
- `src/lib/normalize.test.ts` (F28, new)
- `src/hooks/editStore/pageActions.ts` (F28)
- `src/app/dashboard/blog/[slug]/[postId]/components/BlogPostEditor.tsx` (F28)
- `src/lib/email/sendLeadNotification.ts` (F30a)
- `src/lib/email/sendBlogPostNotification.ts` (F30a)
- `src/lib/email/sendLeadNotification.test.ts` (F30a, test added)

## F18 — Layout button on a single-eligible-variant section
- Added `eligibleVariantCount(templateId, layoutName, section)` to `BlockVariantSelector.tsx`,
  reusing the exact filter the modal uses (`getVariantSetForLayout` → `deriveEditorAssetFacts` →
  `set.variants.filter(v => v.layoutName === current || isBlockEligible(v, { assetFacts }))`),
  returning the count (current variant always counted).
- `SectionToolbar.tsx` gates `showChangeLayout` on `eligibleVariantCount(...) > 1` (was
  `hasMultipleVariants(...)`), passing `content[sectionId]`. Meridian hero with no photo (only
  `TerminalHero` eligible; `EditorialPhotoHero` needs `requiresAssets:['photos']`) now hides the
  button — no dead one-card modal. `hasMultipleVariants` left exported (unused, harmless).
- `content`/`templateId` already in scope from `useEditStore()`. No deviations.

## F12 — TabManager throws on unload
- Added a `channelClosed` flag. `sendMessage` early-returns when the channel is null/closed and
  wraps `postMessage` in try/catch for the close-mid-call race. `destroy()` sets the flag before
  `channel.close()` and is guarded against double-destroy. Removes the 3 `InvalidStateError`
  Sentry reports per unload.

## F28 — consolidate slugify
- `normalize.ts` `slugify` rewritten to the canonical impl: `normalize('NFKD')` + strip combining
  marks + lowercase + `[^a-z0-9]+`→`-` + trim edge hyphens. Verified: `Widget & Co.`→`widget-co`,
  `Café Crème`→`cafe-creme`, `A/B Testing`→`a-b-testing`, `Turbine Blades  &  Discs!!`→
  `turbine-blades-discs`.
- `pageActions.ts`: dropped the local `slugify`, imports the canonical one. Call sites pass typed
  strings and keep `|| 'item'` fallbacks; old `.trim()` behavior subsumed by edge trim.
- `BlogPostEditor.tsx` ('use client'): local `slugify` now `canonicalSlugify(s).slice(0, 80)`,
  preserving the 80-char blog cap. `normalize.ts` is server-safe (no 'use client'/server-only) —
  safe client import.
- Grepped all `slugify` callers: `collections.ts` / `multiPageAssembly.ts` / `classify.ts` already
  import from `normalize.ts`, and their tests recompute via the same function → stay consistent.
  `blog/schemas.ts::slugifyTitle` is separate (out of scope, untouched). `normalizeIVOCKeys`
  shares the function; IVOC cache is dormant (extractor removed scale-08) so the keying shift is
  inert.
- Added `src/lib/normalize.test.ts`: the 3 report cases + orphan/repeated-hyphen collapse, edge
  trim, casing consistency, empty-result cases.
- **Deviation:** combining-mark strip written as a literal `[̀-ͯ]` class (edit tooling normalized
  the `̀-ͯ` escape). Behavior verified by unit tests + Node.

## F30a — observability for failed notification emails (scoped)
- `sendLeadNotification.ts`: on non-OK Resend response, added `Sentry.captureException` (level
  `warning`, tags `{area:'email', op:'sendLeadNotification'}`, extra `{status, body:slice(0,300),
  pageId, formName}`) alongside the existing `logger.warn`. Matches repo pattern
  (`publish/route.ts`, `middleware.ts`); no-op when DSN unset.
- `sendBlogPostNotification.ts`: same per-subscriber non-OK capture. Recipient email omitted (PII);
  traces via `publishedPageId` + `postSlug`.
- Observability half only — NO DB fields/migrations, NO dashboard UI (F30b, tracked separately).
- Added a non-OK Sentry-capture test to `sendLeadNotification.test.ts` (mocks `@sentry/nextjs`).

## Test results
- `npx vitest run normalize.test.ts sendLeadNotification.test.ts sendBlogPostNotification.test.ts
  collections.test.ts multiPageAssembly.test.ts classify.test.ts` → **6 files, 71 passed**.
- `npx tsc --noEmit` → clean for all touched files. Only errors are in
  `src/hooks/useWizardStore.ts` (`goalParamSkipped`/`setGoalParamSkipped`) — NOT touched here,
  owned by a parallel agent. Full suite not run (parallel agents active).

## Open risks
- F28 changes slug output shape for *future* slug derivation only; existing persisted slugs are
  untouched (nothing re-derives on load). Intended.
- F18 derives asset facts via the same presence-proxy heuristic the modal uses, so button
  visibility and modal contents stay in lockstep.
