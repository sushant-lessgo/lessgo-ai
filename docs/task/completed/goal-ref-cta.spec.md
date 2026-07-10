# goal-ref-cta — spec

## Problem / why
QA findings F5/F6/F23 (`reports/scale-1-10-findings.md`): the GOAL_REF model specced in
`docs/tracks/scalePlan.md` §5/D12 was built wrong. Copy generation resolves the goal
destination ONCE and snapshots it per-element (`dest: {kind:'section',anchor:'form-section'}`)
— exactly the "per-element copied config" §5 identifies as why goal was a dead wire.
Symptoms:
- **F5 (P1)**: hero + header primary CTAs carry no `cta` metadata at all → fall through to
  template default `#cta` (points at another button). Only the cta-section button hits the goal.
- **F6 (P2)**: where metadata exists it's a resolved snapshot, not `GOAL_REF` — goal change
  can never re-point.
- **F23 (P1)**: multipage M1 — form lives on `/contact`, snapshot resolver guesses same-page
  anchor `#contact`, which doesn't exist on home. Published page's primary CTA scrolls nowhere
  (verified live on `qa-scale-vestria`). No `dest:{kind:'page'}` ever written.

## Goal
Primary CTA buttons store `dest: 'GOAL_REF'` and resolve against the Brief's goal at
render/publish time. Changing the goal re-points every primary automatically; on multipage the
resolver targets the page that actually holds the conversion (cross-page `page` dest), never a
dead same-page anchor. Every primary on the page (hero, header, cta section) resolves
identically.

## Scope OUT (non-goals)
- Links: GOAL_REF is **buttons only; links explicit-only** (scalePlan §9 decision 7). No link changes.
- Secondary CTA defaults (D14: none) and secondary machinery.
- Post-generation goal-editor UI (no reachable one exists today — separate feature; acceptance
  uses programmatic goal change instead).
- Beacon/analytics changes (placement attribution already specced elsewhere; F9 is separate).
- ButtonConfigurationModal discoverability (F6 side-note) — only ensure detach-from-GOAL_REF
  data shape works if the modal already writes it.
- Place-intent (M-order/menu) CTA machinery (scalePlan §9 decision 8: P3).
- Data migration of existing projects (see Constraints: dual-read shim only).

## Constraints
- `CTAButton = { role, dest: 'GOAL_REF' | Destination, formId? }` per scalePlan §5; destination
  vocabulary already defined (`section | page | external | whatsapp | call | email | download | social`).
- `resolveCtaHref` stays the ONE dumb resolver; published pages stay static HTML (resolution at
  export time, not client JS).
- Migration = dual-read shim per §5: raw `href` (`#x`→section, `/x`→page, url→external) and old
  `buttonConfig` map losslessly at read; new writes use the new shape only. NO data migration.
- Dual-renderer law: edit `.tsx` and `.published.tsx` must resolve identically (F1 was the
  cautionary tale). Resolution helper must live in a plain module (published/client boundary).
- Copy invariant: copy depends on engine + Brief only — GOAL_REF resolution is a render concern;
  the copy prompt must not resolve or emit destinations.
- M1 resolution: single-page → anchor of the seeded form section; multipage → `page` dest to the
  page containing the form section. M3 → external url from `goal.param`; M2 → whatsapp/call from
  param; M4 social → platform url from param. Param-less (F14's "Skip for now") → resolver must
  degrade gracefully (no dead href; acceptable: disabled/`#`+documented).
- Base branch: `fix/qa-quick-fixes` (contains F14 goalParamSkipped + F1 form fixes this work
  touches adjacent code to) until it merges to main.

## References
- `docs/tracks/scalePlan.md` §5 (CTA vs Link table, CTAButton shape, migration shim), D12/D14/D16,
  §9 decision 7.
- `reports/scale-1-10-findings.md` F5, F6, F23 — includes live DB/blob evidence and repro tokens
  (`I9HwKOYo9jsm` single-page meridian, `9knkYn8_QZpE` multipage vestria).
- `src/modules/goals/injectGoalSections.ts`, `seedGoalForm.ts` — where goal machinery already
  runs at generation; the seeding side is correct (F1 fixed the render side).
- `src/types/destination.ts` — Destination + Link types already exist.
- Existing `resolveCtaHref` (grep) — extend, don't fork.

## Open exploration questions
- Where exactly does generation write `elementMetadata.cta_text.cta` today, and why do hero/header
  elements get none (F5) while the cta section gets a snapshot (F6)?
- What reads `buttonConfig` today (editor click behavior, publish export) — full reader list for
  the dual-read shim.
- How does the published exporter know the sitemap (for `page` dest → pathSlug) on multipage?
- Does ButtonConfigurationModal currently write `dest`/`buttonConfig`, and from which entry points?

## Candidate human gates
- None irreversible (no schema change, no migration). Suggested single gate: manual editor↔published
  parity check on the two repro projects before merge.

## Acceptance criteria
- [ ] Generation writes `dest:'GOAL_REF'` (+ `role:'primary'`, `formId` when M1) on every primary
      CTA element's metadata — hero, header, cta section alike. No resolved snapshots persisted.
- [ ] Single-page M1: all primaries resolve to the form section anchor (repro `I9HwKOYo9jsm` shape).
- [ ] Multipage M1: home-page primaries resolve to the contact page path (e.g. `/p/<slug>/contact`),
      not `#contact` (repro `9knkYn8_QZpE` shape). Published HTML verified.
- [ ] M3 with param resolves to the external URL; param-less goal produces no dead href.
- [ ] Programmatic goal change (Brief edit + re-resolve) re-points every GOAL_REF primary; a button
      with an explicit Destination (detached) is untouched.
- [ ] Legacy shape (raw `href`, old `buttonConfig`) still renders identically via dual-read shim —
      regression test on a frozen legacy fixture.
- [ ] Edit and published renderers produce identical hrefs (parity test).
- [ ] `tsc` + full `test:run` green.

## Pilot / smallest slice
Phase 1 = resolver + GOAL_REF write path on single-page product (meridian) only, with the
dual-read shim; verify on repro shape. Then multipage `page` dest; then service/other engines.
