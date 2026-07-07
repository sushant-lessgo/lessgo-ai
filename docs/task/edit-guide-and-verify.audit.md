# edit-guide-and-verify — implementation audit

## Phase 1 — Derivation layer (split scan, derive curated tasks)

### Files changed
- `src/hooks/useReviewState.ts` (modified)
- `src/hooks/useReviewState.test.ts` (created)

### What changed — `src/hooks/useReviewState.ts`
New exports:
- `GuideTaskId = 'add_logo' | 'link_ctas' | 'replace_stock_photos' | 'add_contact'`
- `interface GuideTask { id; label; done; present; target? }`
- `interface GuideSurfaces { headerSectionId; footerSectionId; primaryCtas[]; hasImageElement; firstImageTarget; stockItems[] }`
- `function deriveGuideTasks(content, surfaces, globalSettings?) : GuideTask[]` — pure, always returns exactly the 4 curated tasks.

New store state fields: `needsReviewItems`, `guideTasks`, `remainingCount`, `allComplete`.

New helpers (module-local): `unwrapContentValue` (string / `{content}` unwrap), `isPrimaryCtaLinked` (mirrors `ctaHandler.ts:20-51` — V2 `elementMetadata[key].buttonConfig` link+url, legacy `sectionData.cta` fallback).

`initFromContent`:
- Signature gained an optional 4th param `globalSettings?: { logoUrl?: string }` (backward compatible; existing 3-arg caller unaffected — logo check falls back to header `logo_image` until Phase 2 wires it).
- Collects surface facts during the existing single scan: `headerSectionId`, `footerSectionId`, `primaryCtas` (elementKey `cta_text`), `hasImageElement` + `firstImageTarget` (non-logo image elements only).
- Deleted the unconditional `__logo__` push (old `:201-205`) and `__contact__` push (old `:215-219`); replaced with content-derived task presence/done.
- After the scan: `needsReviewItems = items.filter(type==='needs_review')` (Feature 2, isolated & intact); `stockItems = items.filter(type==='stock_image')` fed into `deriveGuideTasks`; `remainingCount = guideTasks.filter(t=>t.present && !t.done).length`; `allComplete = remainingCount===0`.

The `needs_review` category and all other `reviewItems` remain intact and exposed (only the two config pushes were removed). Existing actions (`confirmItem`, `getElementReviewStatus`, etc.) untouched.

### Auto-check signals (per Design decisions)
- `add_logo`: present = header exists; done = `globalSettings.logoUrl` truthy OR header `content[headerId].elements.logo_image` non-empty.
- `link_ctas`: present = ≥1 primary `cta_text`; done = ALL present primary CTAs linked (first unlinked keeps it open); target = first unlinked CTA (else first).
- `replace_stock_photos`: present = a non-logo image element exists; done = no `stock_image` scan items remain (reuses scan output, no raw collection re-read); target = first stock item (else first image).
- `add_contact`: present = footer exists; done = footer `contact_email` OR `contact_address` non-empty.

### New shapes
- `guideTasks: GuideTask[]` — always length 4; UI gates on `present`.
- `needsReviewItems: ReviewItem[]` — the `needs_review` subset, reserved for Feature 2 markers.

### Deviations
- Logo "done" treats any non-empty `logo_image` as done (per plan's literal "non-empty"), including a placeholder value. Chose the plan-literal signal rather than layering placeholder detection to avoid scope creep. Low risk; Phase 3 UI + Phase 2 `globalSettings` wiring will refine.
- Did NOT hoist the Phase-5 `resolveElementValue` collection resolver (per the explicit constraint). Stock-photo "done" derives from the categorized `stock_image` scan items; no collection-keyed value is read raw in Phase 1.
- `firstImageTarget`/`hasImageElement` exclude keys containing `logo` so a logo-only header does not make the photos task "present".

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run src/hooks/useReviewState.test.ts` — 12 passed (asserts each task's present/done for logo set/unset, CTA linked/unlinked incl. legacy + any-unlinked, stock vs replaced, contact empty/email/address; asserts exactly 4 task ids, no 5th).
- `npm run test:run` — 52 passed | 1 skipped (53 files); 682 passed | 2 skipped (684 tests).

### Open risks
- No UI consumes the new shapes yet (Phase 3); `reviewItems` still backs the current pill/checklist, whose `totalCount` dropped by 2 (removed `__logo__`/`__contact__`) — cosmetic only until UI rewire.
- `globalSettings` not yet threaded into `initFromContent` at the call site (Phase 2) — logo done relies on header `logo_image` in the interim.
