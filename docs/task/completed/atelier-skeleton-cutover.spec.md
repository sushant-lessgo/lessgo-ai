---
tier: full
tier-why: registry loader re-point + publish path (skeleton dual-renderer `.core.tsx`, the `work.v1.js` embed in htmlGenerator, published parity) + serve-gate/template-meta re-key + deleting a whole template dir. Prod-rendering + publish surfaces → full pipeline.
---

# atelier-skeleton-cutover — spec

The deferred "phase-9" cutover. Re-points the `atelier` templateId onto the work-skeleton and retires the old atelier skin.

## Problem / why
`atelier` still loads the **old** 32-file atelier skin (`registry.ts:115`), whose gallery reads a `works:{id,title,caption,image}[]` shape. The work copy engine emits `work.elements.groups`, which **only the work-skeleton gallery consumes** — old atelier has zero `groups` consumers. So today: the work vertical's grouped output renders nowhere on `atelier`, the skeleton skin is stuck behind a DEV-ONLY `atelier2` alias, and the old `templates/atelier/` (a 32-file anti-pattern the skeleton was built to replace) sits duplicated. The E2 ingestion feature surfaced this as the structural blocker to its reveal. Founder confirmed (2026-07-17) **no precious atelier draft exists** (Kundius will be built from scratch), so this drops from a delicate paying-customer migration to a straightforward re-point + delete.

## Goal
`atelier` renders through the work-skeleton (single-source `.core.tsx`), consuming the work engine's `groups` — so grouped work + the whole work vertical (E2 ingestion, copy engine) light up on the real, selectable `atelier` look. The DEV-ONLY `atelier2` staging id and the old `src/modules/templates/atelier/` are gone. Any stray old-`atelier` project degrades gracefully to neutral skeleton defaults — never a crash. No content migration, no new skin features.

## Scope OUT (non-goals)
- **Content migration** of old-shape (`works` collection) data into `groups` — chosen (a): accept orphaning, guarantee graceful fallback to skeleton defaults instead. Nothing precious exists.
- **Any new skeleton/skin capability, block, or design change** — pure cutover; the skeleton + Atelier fidelity are as already banked.
- **Building Kundius's actual site** — separate, from scratch, later.
- **Other skins** (Kontur/Pulse/Lumen) and the Kontur spike — separate.
- **Onboarding / editor / billing** — untouched (independent of the running fleet).
- **New picker UX** — beyond making `atelier` a normal selectable work look (flip `bespoke` off).

## Constraints
- **End state:** the `atelier` templateId's registry loader points at the work-skeleton; the `atelier2` staging id is removed (it was always a temporary dev alias); `src/modules/templates/atelier/` is deleted. One canonical `atelier` = skeleton.
- **Graceful fallback is load-bearing:** an existing Project stored with old `atelier` layouts must render neutral **skeleton defaults**, not error/500. Prove it with a dispatch test (old stored `Atelier*` layouts → skeleton defaults).
- **Scout safety-check BEFORE committing:** confirm no real/paying project is on `templateId=atelier` that this would silently blank. (Founder: Kundius from scratch; naayom is techpremium. Verify, don't assume.)
- **Visibility:** flip `bespoke` off `atelier` — it becomes a normal selectable **work look** (it's one of the launch looks-trio), not a hidden/exclusive id.
- **Re-key every dispatch/meta site consistently** (per the E2 plan-review's enumerated blast radius): `registry.ts` loader, `blockManifest.ts`, `skeletons/ids.ts` (drives the `work.v1.js` embed in `htmlGenerator`), the conformance resolver map, `fit.ts` shortlists, `service.ts` / serveGate / templateMeta. Missing one = a half-cutover that renders or embeds wrong.
- **Publish parity is the gate:** edit == published for an `atelier` (skeleton) page, including the `work.v1.js` embed and any published CSS — verified against a **real published page**, not just unit output (published changes need the full build).
- **Firewall intact** — no `templateId`/`skeletonId` in prompts; the copy engine already emits `groups` template-agnostically. This is a render/dispatch cutover only.
- Green gates before merge: `tsc`, `test:run`, `npm run build`, `lint`; plus screenshot parity + a publish smoke.

## References
- `src/modules/templates/registry.ts:115` — the `atelier` loader to re-point; how templateIds map to loaders.
- `src/modules/skeletons/work/` + `atelier2` skin (`skinPurity.test.ts`, the DEV-ONLY id) — the target skeleton + the current staging alias to fold into `atelier`.
- `src/modules/skeletons/ids.ts` + `htmlGenerator` `work.v1.js` embed — the publish-path wiring keyed on the skeleton id.
- `blockManifest.ts`, conformance resolver map, `fit.ts`, `service.ts` / serveGate / templateMeta — the dispatch/meta sites to re-key (E2 plan-review enumerated these).
- `AtelierWorkGallery.core.tsx:25-37` (old `works` shape) vs the skeleton gallery's `groups` consumer — the divergence being resolved.
- `orchestrator.md` Founder pile "work-skeleton NEXT STEPS → phase-9 cutover" + memory `project_work_vertical` — the plan §Phase 9 recoverable from git history; the E2 mailbox finding that forced this.
- `work-skeleton` merge (`713d29ef`) + its `skinPurity.test.ts` / screenshot-parity harness — the parity proof pattern to reuse.

## Open exploration questions (feeds scout)
- The safety-check: are there any Project rows on `templateId=atelier` today, and are any real (vs test/dev)? (Confirms (a) is safe.)
- Exact set of dispatch/meta sites keyed on `atelier` vs `atelier2` — is the E2 plan-review's list complete, or are there other readers (e.g. picker inventory, defaults, palette/variant maps)?
- How does the skeleton fall back when a stored layout id is an old `Atelier*` the skeleton doesn't know — is there an existing default path, or does it need adding?
- What exactly does `bespoke` gate (serveGate? picker visibility? both?), and what's the flip.
- Does removing the `atelier2` id break any dev-only test/harness that referenced it?

## Candidate human gates
- **Publish parity eyeball** — a real `atelier` (skeleton) page: edit == published, `work.v1.js` present, styling intact.
- **The prod-rendering re-point itself** — `atelier` is a real templateId; founder go before merge/deploy (this rides the current unpushed bundle or its own deploy — founder's call at merge).
- **Deleting `src/modules/templates/atelier/`** — irreversible dir removal (recoverable via git, but confirm the disposition).

## Acceptance criteria
- [ ] `atelier` renders via the work-skeleton, consuming the work engine's `groups` (grouped work shows on an `atelier` page, edit + published).
- [ ] `atelier2` staging id removed; `src/modules/templates/atelier/` deleted; no dangling references (`tsc` + grep clean).
- [ ] All dispatch/meta sites re-keyed (registry, blockManifest, skeletons/ids → `work.v1.js` embed, conformance, fit, service/serveGate/templateMeta) — no half-cutover.
- [ ] A Project stored with old `atelier` layouts renders neutral **skeleton defaults**, not a crash/500 — covered by a dispatch test.
- [ ] Scout safety-check confirmed no real project on `atelier` is silently blanked.
- [ ] `atelier` is a normal selectable work look (`bespoke` off).
- [ ] Publish parity verified on a real published `atelier` page (edit == published, `work.v1.js` embed correct) via the full build.
- [ ] `tsc` + `test:run` + `build` + `lint` green.

## Pilot / smallest slice
Not phased in the usual sense — it's one atomic cutover, but sequence the **riskiest sub-slice first**: re-point `atelier` → skeleton + prove the graceful-fallback dispatch test + a publish parity smoke **before** deleting `templates/atelier/`. If parity or fallback fails, that's the fail-fast gate; deletion of the old dir is the last, irreversible step once green. Decision gate = publish parity eyeball on a real `atelier` page.
