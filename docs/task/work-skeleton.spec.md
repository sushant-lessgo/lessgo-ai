---
tier: full
tier-why: dual-renderer block surface + registry/dispatch + published output — mandatory-full territory; the foundational layer three committed skins ride on
---

# work-skeleton — spec (phase D1 of the work vertical)

## Problem / why
Every template today owns its markup → weeks per look (atelier: 32 files), and parity/
editor/publish QA re-paid per template forever. Demand wants many looks (warm 35% vs
our 7% supply). templatePlan T9 ruled the skeleton layer; this build creates the FIRST
skeleton (work engine) + Atelier as skin #1, for Kundius delivery.

## Goal
One work skeleton: the complete un-styled work site — every work-core section as a
single-source block with a layout library, behaviors, token-bound styling hooks, and
content plug-points. Plus Atelier as the first template: values + selections, ZERO
markup. Gate: a second skin (Kontur) lands in ~1 day.

## What a skeleton IS (agreed boundary — the one-sentence rule)
**Needs new HTML → skeleton. Doable by changing values or picking existing options →
template.** Grey-box test: same wireframe = same skeleton. ONE work skeleton; its
sections each hold a layout library (header's 5 arrangements = 5 options INSIDE one
skeleton, never 5 skeletons). A second work skeleton = escape hatch only (a design
needing 3+ structurally alien sections) — expected NEVER.

## Agreed shape (2026-07-14/15)

### Derivation (ruled: option 2 — lint before freeze)
Skeleton shapes derived from Atelier's delivered 5-pager BUT linted against Kontur +
Pulse before freezing each block: "can their version of this section be reached by
tokens + a variant?" No → the block gets a variant SLOT now (slot ≠ built variant).
The skeleton is the universal work-site frame; Atelier is skin #1, never the source of
truth. Canonical layout vocabularies come from classic patterns + the 13 designer
systems (free variant source — port, don't invent).

### D1 inventory (ruled: workhorse sections get canonical sets — "never stuck")
| Section | Built in D1 | Notes |
|---|---|---|
| Header | all 5 arrangements (logo/nav/buttons perms) + fixed/unfixed behavior | one parametric block |
| Hero | image-bg · LeftTextRightImage · AllCenter + **slider** (Kundius picked it) | video-bg = declared SLOT (capability, publish-weight implications — build on first demand) |
| Work gallery | 2–3 (grid · masonry · strip) | renders GROUP REFERENCES, never embedded photo lists (phase-A shape) |
| Proof | 2–3 curated shapes (testimonials default · logos · results) | per phase-A proof-shapes ruling |
| Prices, story, contact, FAQ, tail | 1–2 each | grow on demand |
Interactive behaviors (slider, lightbox, fixed header) = ONE skeleton-level published
JS asset (lumen.v1.js pattern, owned by skeleton — every skin inherits).

### Template contract (Atelier = skin #1)
tokens (bounded by skeleton-declared ranges) + palette set + layout/device selections +
imagery treatment. ZERO markup, ZERO components — enforced by conformance test. Old
atelier module (main): HARVEST as raw material (its 8 .core.tsx + tokens), build
skeleton blocks fresh under the skeleton module; old module untouched until Kundius
sign-off, then deleted.

### Editor integration (ruled: reuse, add only what's missing — governed by toolbarPlan.md)
`docs/tracks/toolbarPlan.md` = the toolbar standard; skeleton SERVES it (its dependency
section: action list informs skeleton's editable-surface contract; skeleton unblocks
rich toolbars). D1 obligations:
- **Design ▾ landing surface built NOW, panel UI later:** blocks read a user-level
  style-token layer (background · spacing · corners · border · shadow · opacity per
  section) from birth — never retrofit. TWO token surfaces: template tokens (skin,
  bounded) + user style tokens (Design ▾ writes). Skeleton declares both.
- **Header block shell-compliant from birth** (shared logo/menu primitives, zero
  renegade UI) — the work skeleton IS toolbarPlan's pilot vehicle; this answers its
  open question #1 (don't port Logo/Menu per-template — build once on skeleton).
- Header sticky toggle = toolbarPlan's Header toolbar (Beta); D1 only exposes the surface.
- Rich Portfolio toolbar = Final per toolbarPlan. D1 adds only the minimal
  **"manage photos" → library board jump** (two-doors rule) — a link, not a toolbar.
- All blocks attribute-driven (`data-element-key`/`data-section-id`) so Text/Image/
  Section/Link toolbars auto-consume.

### Blocks
Single-source `.core.tsx` (granth pattern) — one file emits edit + published renderers.
Token-driven styling via CSS vars only (skeleton declares var names + valid ranges).
data-surface convention kept. Variant machinery = scale-09 (manifest, variant-aware
resolve, distinctness guard, editor swap).

## Scope OUT (non-goals)
- Kontur/Pulse skins themselves (Kontur = the gate spike, own micro-effort after D1; Pulse = trio completion later)
- Work library board + ingestion UI (D2 — D1 only CONSUMES the group shape from phase A)
- Copy/prompts (C), onboarding (E), toolbar UI work (F/editorPlan)
- Video-bg hero build, retro-collapse of any existing template
- New editor actions beyond the confirmed gap list

## Constraints
- T9 guardrails all apply: token bounds declared, compatibility matrix where axes interact, sampled screenshot harness (BOTH renderers), distinctness guard for variants
- Registry: templateId resolves → { skeletonId, tokens, selections } — no DB/schema change
- Copy firewall untouched: copy/engine never sees skeletonId
- Published/client boundary + dual-renderer parity rules absolute (single-source makes parity structural, harness proves it)
- Multi-page: pages per phase-A archetypes; blog/forms/legal = attachment points only
- Kundius NL/EN twin: skeleton blocks must not PRECLUDE twin-field rendering (lumen data-en/data-nl pattern as reference) — but bilingual wiring is the concierge patch, not D1 scope

## References
- `docs/tracks/toolbarPlan.md` — the toolbar standard this skeleton must serve (Design ▾ token vocabulary, shell anatomy, renegade list)
- `docs/tracks/templatePlan.md` T9 + reshape — the ruling this implements
- `template-design/designer-workspace/atelier/` + `delivery/` — canonical Atelier design source
- Kontur + Pulse design files (designer-workspace) — lint targets
- `src/modules/templates/granth/` — .core.tsx single-source pattern (proven)
- scale-09 variant machinery (blockManifest.ts, swap.test.ts, distinctness guard)
- `src/modules/templates/atelier/` — harvest source + anti-pattern reference
- `src/modules/engines/workSections.ts`, `workPages.ts`, `workFacts.schema.ts` — phase-A contracts (MERGED — build against these)
- `docs/tracks/workEndtoEnd.md` steps 7/8 — product promises this must keep

## Open exploration questions
- Registry seam: cleanest way for templateId→skeleton resolution to coexist with current TemplateModule contract (dispatch firewall intact)
- What scale-09's variant manifest needs to also carry SLOTS (declared-not-built variants)
- Existing editor action inventory vs the work gap list (confirm gallery-reference + header-behavior are the only adds)
- Screenshot-harness plumbing: what exists from templateConformance/parity tests to extend vs build

## Candidate human gates
- Block-shape freeze after the Kontur+Pulse lint (founder reviews the lint verdict per section)
- Kundius parity QA sign-off (editor == published, real content)
- **The Kontur spike verdict (the architecture gate): second skin in ~1 day, zero markup — pass → skeleton thesis proven; fail → stop, rethink before E/F**
- Old atelier module deletion (after Kundius sign-off only)

## Acceptance criteria
- [ ] Work skeleton module: all 8 must-sections as single-source blocks w/ D1 inventory table above; optional sections per contract
- [ ] Header: 5 arrangements + fixed toggle work in editor AND published, all skins
- [ ] Hero slider works published (skeleton JS asset), video-bg slot declared
- [ ] Gallery blocks render group references from workFacts shape (fixture-fed)
- [ ] Atelier skin: tokens+palettes+selections only — conformance test proves zero markup/components in template dir
- [ ] Token bounds declared + a skin setting out-of-range values fails loud (test)
- [ ] User style-token layer (Design ▾ vocabulary) lands: writing e.g. section radius/background via the token surface renders in BOTH renderers (UI panel itself out of scope)
- [ ] Header edited via the toolbar shell (logo + menu through shared primitives; zero renegade UI in skeleton blocks)
- [ ] Sampled screenshot grid green: layouts × skin, editor + published renderers
- [ ] Existing templates/engines byte-identical behavior (no retro impact)
- [ ] tsc + test:run + build green; Kundius pages render with her real content fixture
- [ ] Kontur spike executed post-merge: ~1 day, zero markup → verdict recorded in templatePlan

## Pilot / smallest slice
Slice = Home page only: skeleton's hero + header + gallery + proof + contact blocks,
Atelier values, Kundius fixture, both renderers, screenshot-compared. Founder eyeballs
against the designer's Atelier HTML. Gate passes → remaining sections/pages.
