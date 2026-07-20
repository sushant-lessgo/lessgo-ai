---
tier: full
tier-why: reopens the frozen work-core contract + dual-renderer skeleton blocks + generation (copyPrompt/parseCopy/regen) + onboarding facts + editor primitives
---

# work-contract-wave2 — spec

## Problem / why
D1 work-skeleton shipped Atelier with a FROZEN content contract; the implementer correctly refused to invent fields, so several designer-HTML features have nothing to bind to (audit `docs/task/completed/work-skeleton.audit.md` L881-886 + scattered). Result: packages cards render without image/bullets/flag, about has no portrait/signature, hero slider JS ships but starves on a single image, header is text-wordmark-only. These gaps cap the fidelity ceiling of EVERY work skin (Atelier today, Kontur/Pulse later) — and Kundius (paying client) sees them.

Frame chosen: **engine contract completeness** (not an Atelier-only patch). Every field becomes part of the work-core contract: generated/ingested/editable for all work customers.

## Goal
Close the Wave-2 contract gaps so the work engine's contract covers the delivered designer shapes. Atelier reaches designer parity on packages/about/hero/header; future skins inherit the same fields. Each field has a declared **source lane** and graceful-empty behavior.

## Scope IN — fields + lanes

| Section | Field | Source lane |
|---|---|---|
| Packages | per-tier image | MediaAsset picker |
| Packages | feature/bullet list | facts-verbatim (onboarding asks) or AI-drafted from facts |
| Packages | "most booked" flag | manual toggle |
| Packages | category label | facts-verbatim |
| About | portrait image (4:5) | MediaAsset picker |
| About | signature line | manual/facts, default = name |
| About | badge text (distinct from eyebrow) | AI-drafted, editable |
| Hero | slides[] (image collection) | MediaAsset picker (multi-select). Slider JS (`work.v1.js`) already shipped; bails <2 slides today |
| Hero | 2nd CTA (label+href) | manual/AI |
| Header | `logo_image` | MediaAsset picker (text wordmark stays default) |
| Footer | link columns + contact block | **DERIVED from live page list + facts — NO contract field** (stays correct when CMS detail pages change the page set) |

## Scope OUT (non-goals)
- EN/NL bilingual twin-field — ruled concierge patch, not contract.
- Gallery per-group span signal (true varied-span masonry) — polish; current grid mosaic mirrors Atelier's own `.atl-mosaic`.
- Header absolute-over-hero overlay geometry — page/section-stack RENDERER concern, separate spec if ever.
- No new sections, no new slots, no manifest changes.
- No Kontur/Pulse skin work (Kontur 1-day spike runs AFTER this merges — it is the architecture gate for further skeleton rollout).
- No CMS/Collection machinery — packages/hero-slides are contract fields per the cms-collections boundary rule (packages = 2-4 tiers not a catalog; slides = bare image wall = gallery FIELD not Collection).

## Constraints
- **Sequencing: start after `cms-collections` merges** (minimum: after its Phase-2 render contract freezes). Both reopen work-skeleton + editor surface; no parallel run (shared-contract coordination rule).
- **All image fields ride the `MediaAsset` media-library picker** — same pipeline as CMS item fields. No parallel upload path.
- Skeleton invariants hold: skins stay zero-markup (`skinPurity`), blocks stay single-source `.core.tsx`, token bounds fail loud, screenshot parity gates stay green (`parity.spec.ts` <3% bands), existing non-work templates byte-identical.
- **Graceful-empty for every field** — old drafts / sparse facts render exactly as today (no crash, no ugly hole). Existing Kundius draft must render unchanged until fields are filled.
- AI-lane fields flow through the per-engine builders: `copyPrompt.ts` + `parseCopy.ts` AND scoped regen (`scopedRegen.ts` reuses the same builders — new elements must regenerate cleanly).
- Facts-lane fields need their onboarding/wizard facts asks (work journey); manual-lane fields need editor affordances via existing edit primitives (declared once at skeleton level).
- No `prisma/schema.prisma` change expected (content JSON only) — if planning discovers one, that's a human gate.
- Contract vocabulary: `workElementContract` is the element source of truth; `elementSchema` is derived — update both sides, keep copy firewall (audience code imports no skeleton module).

## References
- `docs/task/completed/work-skeleton.audit.md` L855-893 — the exact gap list, per-section MISSING notes, no-invent-fields guardrail.
- `template-design/designer-workspace/atelier/` — target designer HTML: `.atl-pack` (image/bullets/flag/category), `.atl-split-art` + `.atl-sign` + `.atl-badge` (about), `.atl-cover` 5-slide slider, `.atl-nav`, 3-col index footer.
- `docs/task/cms-collections.spec.md` — boundary rules (Collection vs Gallery-field), MediaAsset reuse, detail-page fan-out that footer derivation must track.
- `src/modules/skeletons/work/` — blocks to extend (Packages/About/Hero/Header/Footer cores), `tokenContract.ts`, `resolveWorkBlock.ts`.
- `src/modules/audience/work/` — `copyPrompt.ts`, `parseCopy.ts`, `injectPraise.ts`, `elementSchema.ts` (lane wiring precedent).
- `src/lib/staticExport/workBehaviors.js` → published `work.v1.js` — slider already handles multi-slide; asset-versioning contract (`scripts/buildAssets.js`): semantic JS change = NEW filename.

## Open exploration questions
- Hero slides default: auto-derive from `works` group covers (zero authoring for photographers), user-overridable via picker — worth it in v1 or manual-pick only?
- Where do facts-lane asks land in the work wizard (which step owns packages bullets/category)?
- Footer derivation source of truth for "live page list" once CMS detail pages exist — pages store vs multiPageAssembly output?
- Does the packages serif-price need a token (Atelier price is serif; display face is Bricolage) — token addition or leave?
- `regenerate-story` (about Sugarman interview) — does badge/signature participate or stay excluded?

## Candidate human gates
- Final field list sign-off before contract freeze (this table IS the proposal).
- Any migration touching the live Kundius project content (prod, paying customer).
- New published-asset filename if `work.v1.js` semantics change (immutability contract).
- Auto-escalate gate if a prisma schema change surfaces (none expected).

## Acceptance criteria
- [ ] Atelier packages render designer-parity cards: per-tier image, dash-bullet list, "most booked" flag chip, category label — and render cleanly when all four are empty.
- [ ] About renders 4:5 portrait + signature + badge with its OWN text (no eyebrow reuse); graceful without portrait.
- [ ] Hero slider runs multi-slide in editor AND published (arrows/dots/autoplay) from user-picked slides; single-image drafts render the static slide exactly as today.
- [ ] Header renders `logo_image` when set; text wordmark default unchanged.
- [ ] Footer columns/contact derive from live page list + facts; stay correct when a CMS collection adds detail pages.
- [ ] AI-lane fields generated on fresh atelier generation AND regenerable (section + element regen); facts-lane fields flow from wizard facts verbatim.
- [ ] All image fields use the MediaAsset picker.
- [ ] Existing drafts (incl. Kundius) render byte-identical until new fields are filled.
- [ ] Gates green: `tsc`, `test:run` (skinPurity/coreParity/renderParity/tokenContract/conformance), `build`, `parity.spec.ts` all bands <3%, non-work templates untouched.

## Pilot / smallest slice
**Phase 1 = Packages quad end-to-end** (contract field → wizard facts ask → AI/facts lane → editor primitives → both renderers → parity band). Proves the full lane-wiring pattern on one section. Decision gate: founder eyeballs packages cards vs designer HTML. Then About → Hero slides → Header logo → Footer derivation, same pattern each.
