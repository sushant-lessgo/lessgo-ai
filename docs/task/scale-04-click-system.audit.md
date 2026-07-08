# scale-04 Phase 1 — audit

## Files changed
- `src/types/destination.ts` (new) — Destination union, CTAButton, Link, type guards
- `src/utils/destinationShim.ts` (new) — `toDestination` + `LegacyButtonConfig`
- `src/utils/resolveCtaHref.ts` (rewritten) — added `resolveDestination`, wrapper now routes through shim; kept `externalLinkProps` unchanged
- `src/utils/destinationShim.test.ts` (new) — mapping table + resolver-per-kind
- `src/utils/resolveCtaHref.test.ts` (new) — wrapper byte-identical parity net
- `src/types/core/content.ts` — additive `cta?: CTAButton` on `elementMetadata` value

## Per-file

### src/types/destination.ts
`Destination` = discriminated union on `kind` (`section|page|external|whatsapp|call|email|download|social`). `CTAButton{role,dest:'GOAL_REF'|Destination,formId?}`, `Link{dest,source}`. Guards `isDestination/isGoalRef/isCTAButton/isLink` are plain predicates (server-safe). Guards distinguish new shapes from legacy `buttonConfig` (which has `type`, not `role`/`source`).

### src/utils/destinationShim.ts
Plain module (no `'use client'`). `LegacyButtonConfig` is the superset of the 3 divergent scout interfaces (all fields optional). `toDestination` dispatches: string→`classifyString`; `isCTAButton`/`isLink`→`.dest`; else legacy `type` switch (`page`→page, `link`/`link-with-input`→`classifyString(url)`, `form`→`undefined` per D-D, default→`undefined`). `classifyString` order: `#`→section(anchor without `#`), `/`→page, `tel:`→call, `mailto:`→email, wa.me/api.whatsapp.com→whatsapp, default→external (verbatim).

### src/utils/resolveCtaHref.ts
`resolveDestination(dest)` is the new dumb core. Wrapper `resolveCtaHref(buttonConfig, forms, fallback='#cta')` keeps the exact legacy signature.

## Byte-identical reasoning (the point of Phase 1)
Old wrapper had 5 branches; each maps 1:1:
- `!buttonConfig` → `fallback`. Preserved verbatim (first line).
- `type:'form'` → formId check + `forms?.[formId]` check → `'#form-section'` else `fallback`. Kept INLINE in the wrapper, character-for-character (D-D — this check is not pure so the shim never sees it).
- `type:'page'` → old `pathSlug || fallback`. New: `toDestination`→`page{pathSlug: pathSlug ?? ''}`→`resolveDestination`→`pathSlug` string; wrapper `resolveDestination(dest) || fallback` reproduces `pathSlug || fallback`.
- `type:'link'|'link-with-input'` → old `url || fallback`. New: `classifyString(url ?? '')`→some Destination→`resolveDestination` round-trips the url verbatim (external default guarantees any string round-trips; empty→`''`→`|| fallback`). Note `classifyString` may classify `#x`/`/x`/`tel:` etc. urls, but each round-trips to the identical string, so href output is unchanged.
- else (unknown/absent type) → old `fallback`. New: `toDestination`→`undefined`→wrapper returns `fallback`.

`externalLinkProps` is untouched.

Whatsapp is the one non-verbatim reconstruction: `resolveDestination(whatsapp)` emits canonical `https://wa.me/<number>[?text=<enc>]`. For canonical stored inputs (the LinkTargetPopover writes verbatim, users type `https://wa.me/<n>`) this round-trips byte-identically. A NON-canonical stored whatsapp link inside a legacy `type:'link'` buttonConfig (e.g. `api.whatsapp.com/send?...` or `+`-encoded text) would resolve to the canonical form and thus differ from the old verbatim output. This is a deliberate D-D directive (classify wa.me even in the legacy link path). Logged under Deviations/risks.

## Deviations
- **link-with-input formId not returned by `toDestination`.** D-D says "fold into external{url}+formId". `toDestination`'s return type is `Destination|'GOAL_REF'|undefined` with no formId slot; formId lives on `CTAButton` separately. `toDestination` emits only the url Destination (href-lossless — formId is irrelevant to href). Conservative, matches the stated return signature.
- **Whatsapp canonical reconstruction** (above) — non-canonical legacy whatsapp URLs stored as `type:'link'` would change output. Real legacy data is canonical wa.me strings, so byte-identity holds in practice. Flagged for reviewer.
- `section` anchor stored WITHOUT leading `#` (resolver re-prepends). Round-trips `#x`→`#x`.

## Test results
- `npx tsc --noEmit`: clean, no errors.
- `npm run test:run`: 69 files passed / 1 skipped; 945 passed / 2 skipped. Existing dispatch/golden/parity suites all green → confirms zero behavior change at the 26 untouched published readers.

## For the impl-reviewer to scrutinize
1. Whatsapp non-canonical round-trip edge (above) — confirm acceptable per D-D, or restrict wa.me classification to the raw-string/Link path only.
2. `content.ts` uses an inline `import('@/types/destination').CTAButton` type to stay additive without adding a top-level import; confirm this is acceptable style here.
3. `type:'form'` returning `undefined` from `toDestination` — verify no other current caller relies on the pure shim seeing form (only the wrapper calls it in Phase 1).

---

## Phase 1 fix — whatsapp verbatim-preservation guard (2026-07-08)

### Files changed
- `src/utils/destinationShim.ts` — legacy `type:'link'`/`'link-with-input'` branch now guards whatsapp.
- `src/utils/resolveCtaHref.test.ts` — added whatsapp verbatim-parity rows.

### What changed
Byte-identity violation: the old `resolveCtaHref` returned `buttonConfig.url` VERBATIM for `type:'link'`, but the new shim re-classified the url and, when it matched `wa.me`/`api.whatsapp.com`, reconstructed a canonical `https://wa.me/<n>[?text=]` — mangling real stored non-canonical whatsapp links (domain rewrite, dropped `&utm_*`, scheme upgrade, substring matches). The write path (`ButtonConfigurationModal`) stores `config.url` with no normalization, so such links are real.

Fix: in the legacy link branch, after `classifyString`, if `d.kind === 'whatsapp'` return `{ kind: 'external', url }` with the VERBATIM url (round-trips byte-identical through `resolveDestination`). `formId` behavior for `link-with-input` unchanged (rides on the CTAButton, not the href). Bare-string / new-write classification into whatsapp is UNCHANGED — only the legacy buttonConfig link branch preserves verbatim.

### Tests
Added two rows asserting `resolveCtaHref({type:'link', url})` returns the input verbatim for `https://api.whatsapp.com/send?phone=1234&text=Hi` and `https://wa.me/1234?text=x&utm_source=y`.

`npx tsc --noEmit` green. `npm run test:run` green (946 passed | 2 skipped).

### Deviations
None. Applied the reviewer's suggested shape adapted to actual var/type names.

### Open risks
None known — the guard is scoped to the legacy link branch only.

---

# scale-04 Phase 2 — audit

## Files changed
- `prisma/schema.prisma` — CONFIRM ONLY, no edit. `Project.brief Json?` present at L36, backed by migration `20260707191204_add_project_brief`. No migration generated.
- `src/app/api/saveDraft/route.ts` — accept optional `brief`, validate against `BriefSchema.partial()`, merge over existing brief, persist to `Project.brief`.
- `src/app/api/loadDraft/route.ts` — select + return `brief` in response.
- `src/types/store/state.ts` — MetaSlice gains optional `goal?` + `socialProfiles?` (Brief mirrors).
- `src/hooks/editStore/coreActions.ts` — `setGoal` action (goal setter).
- `src/hooks/editStore/persistenceActions.ts` — `save()` ships `brief` payload; `loadFromDraft` hydrates `goal`/`socialProfiles` from `apiResponse.brief`.
- `src/modules/goals/goalToDestination.ts` (new) — mechanism→Destination resolver (widened return).
- `src/modules/goals/goalToDestination.test.ts` (new) — 15 per-mechanism tests.

## goalToDestination mechanism mapping (D-E widened return `{ dest, formId? } | undefined`)
- M1 on-site form → `{ dest: {kind:'section', anchor:'form-section'}, formId }` where `formId` = first key of `ctx.forms` (undefined if none — passes through to legacy reader's own forms check).
- M2 direct channel → `toDestination(goal.destination)` (reuses the phase-1 shim string classifier): `wa.me`→whatsapp, `tel:`→call, `mailto:`→email, else external. No formId.
- M3 redirect → `{kind:'external', url}` verbatim.
- M4 subscribe/follow → `{kind:'social', platform: inferPlatform(url), url}`; unrecognized host → `{kind:'external', url}`.
- M5 anchor → `{kind:'section', anchor: dest.replace(/^#/,'')}`.
- No goal / no mechanism / missing-or-empty destination (M2–M5) → `undefined` (caller falls back to legacy).
- Array `destination` → first non-empty string entry.

## brief column confirmation
`Project.brief Json?` pre-existed (schema L36 + migration `20260707191204_add_project_brief`). `npx prisma migrate status` → "Database schema is up to date!". NO migration created this phase.

## Deviations (in-scope judgment calls)
- **Optional MetaSlice fields.** Made `goal?`/`socialProfiles?` OPTIONAL rather than required. Required fields would force initialization in `createInitialState` (`src/stores/editStore.ts`) — a file NOT in Files-touched. Optional keeps the change fully additive within scope; loadFromDraft still assigns them explicitly (`goal` = null when absent).
- **`setGoal` not added to `actions.ts`.** The `EditStore` action interface (`src/types/store/actions.ts`) is out of scope, so `setGoal` is present on the runtime store (spread in `editStore.ts`) but not on the typed surface. It is unused this phase (write path is phase 4), so tsc stays green. Phase 4 should add its signature to `actions.ts` when it wires the write path.
- **Invalid `brief` is skipped, not rejected.** saveDraft validates `body.brief` and, on validation failure, silently skips the brief write (keeps the rest of the draft save) rather than returning 400 — conservative: never fail an autosave over an optional passthrough field. BriefSchema is already all-optional so `.partial()` is belt-and-suspenders matching the plan wording.
- **`brief` read from raw `body`, not `validationResult.data`.** `DraftSaveSchema` strips unknown keys (same reason `baseline` is read from `body`), so `brief` is read from the raw body and validated separately against `BriefSchema`. No edit to `src/lib/validation.ts` (out of scope).

## Test / tsc results
- `npx tsc --noEmit` — clean.
- `npm run test:run` — 961 passed / 2 skipped (70 files). New `goalToDestination.test.ts`: 15/15 pass.
- `npx prisma migrate status` — up to date; brief migration already present.

## Round-trip reasoning (manual)
save→load: `save()` builds `brief = { goal, socialProfiles }` (omitting empties) and POSTs it; saveDraft merges over existing `Project.brief` and persists. `loadDraft` selects+returns `brief`; `loadFromDraft` sets `state.goal = apiResponse.brief?.goal ?? null` and `state.socialProfiles = apiResponse.brief?.socialProfiles`. A saved goal round-trips. `/preview/[token]` uses the same edit-store hydration, so it inherits `brief` too (relevant to phase 3).

## Open risks / notes for reviewer
- `setGoal` is currently untyped on `EditStore` (see deviation) — phase 4 must add it to `actions.ts` before calling it type-safely.
- M1 formId = "first form on the project" is a heuristic (goal carries no formId). Fine for the phase-3 bridge (legacy reader re-checks form existence), but if a project has multiple forms the primary always wires to the first — revisit if per-CTA form selection is needed.
- `inferPlatform` is best-effort host matching; unrecognized socials degrade to `external` (still a working link), never throw.

### Phase 2 — impl-review verdict: SHIP (loops 1)
Non-blocking carry-forward notes:
1. **Phase 4:** add `setGoal` signature to `src/types/store/actions.ts` when wiring the write path (currently runtime-only, dead code, tsc-green).
2. **Phase 4/6:** `save()` builds briefPayload only when `goal || socialProfiles` truthy → setting goal back to `null` won't persist a clear. Fine now (no goal-edit UI), fix when editing lands.
3. **Phase 3 (IMPORTANT):** `goalToDestination` M1 returns `{dest: section{form-section}, formId: undefined}` when no form resolves (key present, value undefined) whereas M2–M5 omit formId. `normalizeCtas` MUST detect form-ness via this pair shape (presence of the form-section anchor / formId key), so a missing-form M1 still maps to `{type:'form'}` (→ legacy reader's own fallback), NOT `{type:'link', url:'#form-section'}`. Per D-E: do NOT special-case the anchor string; rely on the widened-return pair.
