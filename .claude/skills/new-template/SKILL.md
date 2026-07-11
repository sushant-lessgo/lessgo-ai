---
name: new-template
description: >-
  Decision gate + build workflow for template work in Lessgo (the middle tier of
  audienceType → templateId → variant+palette). Use FIRST when a lead/business
  can't be served for a design/style/capability reason, to decide whether the
  answer is a capability block-pair on an existing flagship (path C), a brand-new
  template (path D), or an engine build (path E) — and to refuse "new template"
  when a capability path fits. Then guides the shared build core: design kit →
  art-direction/tiles → founder taste-pick → design → handoff lint → agent port
  via /feature → templateConformance → screenshot parity → parity QA. Covers the
  evergreen dual-renderer landmines tests can't fully catch. NOT for standing up a
  new audience type.
---

# Template work — decide first, then build

This skill is thin ON PURPOSE. Everything derivable from code (layout maps, export
names, schema locations, section lists, contract keys) lives in the code and its
generated design kit — pointers below. Prose that mirrors code rots every scale
phase; the kit and conformance suite are the live source of truth.

---

## 1. Decision gate — run this BEFORE proposing any template

A business fails the serve gate for exactly one diagnosable reason. The gate's
failed clause tells you WHICH rung to build (`docs/tracks/scalePlan.md` §7 build
ladder). **Never jump to a new template when a cheaper rung serves.**

| Rung | Failed clause (what's missing) | Build action | Cost |
|---|---|---|---|
| A | businessType entry missing | config list entry | hours, no code |
| B | goal.mechanism machinery missing | platform feature (click system) — all templates benefit | days, once ever |
| **C** | **capability missing, engine HAS a template** | **block pair(s) on that engine's FLAGSHIP + declare the capability** | days/block |
| **D** | **engine has a template but accumulated STYLE demand, or engine has NO template** | **new template (this skill's build core)** | weeks |
| E | copyEngine not live | new engine | biggest, rare — separate decision/escalate |

**The refusal rule (scalePlan §7, D7): never D when C works.** A capability gap
(gallery, catalog, video-hero, store-badges, blog, packages, map-hours, bilingual,
lead-form, multipage) is a BLOCK CONTRACT — add the block pair to the engine's
flagship template and declare the capability in `templateMeta`/manifest (kept
honest by `templateConformance`). Do NOT build a "photographer template" for a
gallery gap. If someone asks for a new template, first prove the need is a genuine
STYLE gap, not a capability gap:

- **Capability gap** (empty capability, engine already has ≥1 template) → **path C**.
  Add block pair(s) to the flagship; done. STOP — do not create a template.
- **Style gap** (an empty `designStyle` cell / a demand-board style signal the
  existing templates can't satisfy) → **path D**, the build core below.
- **Engine missing** (`copyEngine` not live) → **path E**. Out of this skill —
  escalate as a separate engine decision; do not build a template on a dead engine.

When in doubt between C and D, C wins. The demand board ranks *capability gaps, not
template counts* — one capability build unblocks several business types.

---

## 2. The build core (paths C and D share it)

Both a flagship capability block-pair (C) and a whole new template (D) go through
the same pipeline. D runs all of it; C runs the subset that touches the flagship
(design kit → lint the added markup → port → conformance → parity) without the
full art-direction/taste-pick unless the new blocks introduce a style.

1. **Design kit** — `npm run kit:generate` (thin CLI over `src/modules/engines/designKit.ts`).
   Derives, from the LIVE contract, the sections-in-order, every required slot +
   card capacities, knob ranges to design, edit-primitive per slot, and the
   self-contained format/axes/class-prefix/font constraints the designer must hit.
   Derived, not hand-written — regenerate after any contract change. This replaces
   every layout map / element list this skill used to hardcode.
2. **Art-direction** — pull references from the anchor library
   (`docs/product/anchorLibrary.md`): concrete named anchors, plus the BANNED list
   (existing template fingerprints + default-mode bans — Inter, purple gradients,
   glassmorphism, rounded-2xl grids, emoji icons). A new template must not collide
   with a shipped template's fingerprint.
3. **Hero style tiles** — 3–5 hero-only style tiles, each from a DIFFERENT anchor
   (divergence, not variations of one). Designer produces static HTML per the kit's
   format block.
4. **Founder taste-pick** — human gate. Founder picks one tile. Taste is human by
   design (D6: machine facts, human taste); no AI auto-pick.
5. **Full design expansion** — the picked tile → the full design system as ONE
   self-contained static HTML (Meridian precedent; instructed to plain HTML/CSS,
   never Tailwind/React), covering every section the kit lists + all axes
   (`:root` tokens, `[data-palette]`/`[data-variant]`/`data-knob-*`/`[data-surface]`).
6. **Handoff lint** — `npm run kit:lint <file.html>` (over `src/modules/templates/handoffLint.ts`)
   BEFORE any port: all engine core sections present, every required contract slot
   representable, axes structured, fonts ⊆ self-hosted, fully self-contained (no
   external stylesheet/script/font URLs). Fix reds before building.
7. **Port / build via `/feature`** — the module port (HTML → tokens/palettes/
   variants/blocks + dual-renderer pairs + registry/picker wiring) is a normal
   phased `/feature` build, not hand-work in this skill. The kit + the module
   contract (pointers in §4) are the build's inputs.
8. **`templateConformance(templateId)` green** — the designer's bar gate
   (scalePlan §11.3: no partial templates). One call asserts block-pair resolution,
   variant distinctness, collection families, knob-set truthfulness, looks
   truthfulness, and the editor-basics machine-checkable subset. Add one line to
   enroll a template.
9. **Screenshot parity spec** — `e2e/parity.spec.ts` pixel-diffs edit-band vs
   published-band per section (the #1 dual-renderer trap, automated). Green +
   the seeded `?parityBreak=1` negative control fires.
10. **Parity QA sign-off** — human gate, per template, permanent. The `/manual-test`
    editor-basics subsection covers the visual/interactive affordances jsdom can't
    assert (logo/image upload, collection add/remove/reorder, Button Settings, nav/
    footer/social links, form config, live palette/variant/knob/look switching).

**Flexibility surface** (design to these, don't hardcode them):
- **Knobs** — `src/modules/templates/knobs.ts` (standard axes: buttonShape,
  cardStyle, density, typePairing, texture/mood). A knob = `data-knob-<axis>` attr
  → CSS var; **blocks NEVER branch on a knob** (CSS-token only → dual-renderer safe
  by construction). Default value emits NO CSS (byte-identical for knob-unaware
  projects). The kit lists the ranges to design.
- **Named looks** — `templateMeta.looks` (id, label, blurb, knob bundle + palette/
  variant refs). ≥3 curated looks per knob-bearing template surface in the picker;
  one skeleton × palettes × looks = many distinct sites. Zero copy-regen on swap
  (render-side only).
- **Generation spread** — deterministic seeded variety (block-variant, starting
  palette tie-break, starting look) across same-niche sites; copy untouched.

---

## 3. Evergreen landmines — KEEP these in your head (tests can't fully catch them)

These are hard-won and only partially machine-checkable. Everything else in this
skill points at code; THESE are the judgment you carry into the build.

- **Dual-renderer discipline (the #1 trap).** Every block is a PAIR: `.tsx` (edit,
  `'use client'`, hooks/contentEditable) and `.published.tsx` (server-safe, no
  hooks, flat props). They MUST render identical layout/CSS. A mismatch = "right in
  editor, wrong when published" (or vice-versa). Update both, always. The parity
  spec (step 9) catches CSS drift; `renderParity.meridian.test.tsx` catches content
  drift — but write them right the first time.
- **Published/client boundary.** NEVER import a non-component value (a `*_STYLES`
  string, a helper fn) from a `'use client'` `.tsx` into a `.published.tsx`. On the
  server it resolves to a client reference, not the value → empty published CSS or a
  500. Fails SILENTLY (build stays green, only the live `/p/[slug]` breaks). See
  [[project_published_client_boundary]]; the global
  `publishedClientBoundary.test.ts` walks every published import graph.
- **Per-block CSS in a PLAIN `styles.ts`.** Put block CSS in `<Block>/styles.ts`
  (a plain module, NO `'use client'`), import into BOTH files. Never `export const
  STYLES` from the `'use client'` `.tsx` — same boundary bug as above.
- **Prefix every ported class** (e.g. `tp-`). Bare `.nav`/`.btn`/`.card` collide
  with the editor's own UI in edit mode and silently restyle toolbars.
- **Margin-collapse through `data-surface`.** The published renderer wraps each
  section in a `data-surface` div. Use padding INSIDE the surface, never
  `margin: Npx 0` on the outer element — margins collapse through the wrapper and
  expose the page background as a seam. Blocks must NOT paint their own full-bleed
  section background; let the surface wrapper do it.
- **Self-hosted fonts only** (CSP blocks Google Fonts). New family → woff2 in
  `public/fonts/` + `@font-face` in `src/styles/fonts-self-hosted.css`; verify
  ZERO `fonts.googleapis.com`/`gstatic.com` on the live page. Variable families:
  use the axis-preserving variable woff2 (a static instance kills the opsz axis).
- **Behaviors = ONE shared minified asset**, not per-block `<script>`s. Port
  designer JS into `src/lib/staticExport/<template>Behaviors.js` → `buildAssets.js`
  → `<template>.v1.js`, injected by `htmlGenerator.ts` gated on templateId. Blocks
  emit only markup + hook attrs. Behaviors run on PUBLISHED only — verify on
  `/p/[slug]`, not `/preview`.
- **Two-identifier discipline (the #1 silent build-green/runtime-broken source).**
  Each section carries a lowercase `type` (section-id prefix, `resolveBlock` key,
  `sectionRules` key, schema `sectionType`) AND a PascalCase `LayoutName`
  (`elementSchema` key, section `layout` field). Wrong `type` → placeholder block;
  wrong `LayoutName` → empty block. Neither throws. Keep `type` a single lowercase
  word (compound/camelCase gets mangled by `extractSectionType`). Prefix bespoke
  `LayoutName`s (layout names are GLOBAL across the merged schema and PRODUCT WINS
  TIES — a reused name is silently shadowed). Guard with a registration smoke test.
- **Bespoke §13 mode.** A template for ONE paying client (hand-written copy + real
  photos, never reused): register the id + a `registry.ts` loader entry so it
  renders, but do NOT add it to the picker catalog/order (keeps it unselectable);
  set `templateId` on that project by hand (bypasses the persona gate); seed copy +
  every `manual_preferred` image project-scoped — NEVER bake a seed into a shared
  persona/template default. Skip picker + AI-generation wiring; you still need the
  full module + every boundary rule above. See [[project_before_customer_2]].

---

## 4. Pointers — the live sources (do NOT restate these in prose; they rot)

Read these when you build; they replace the code-derived tables this skill used to
carry.

| Need | Live source |
|---|---|
| Sections in order + slots + capacities + format + knob ranges | `npm run kit:generate` → `src/modules/engines/designKit.ts` |
| Block-pair map, capacities, requiresAssets, variants (pure data) | `src/modules/templates/blockManifest.ts` |
| The content contract each block must read (element keys/shapes) | `src/modules/engines/elementContracts.ts` (+ audience `elementSchema.ts` for legacy-layout engines) |
| Registry loader / contract keys the module must export | `src/modules/templates/registry.ts` |
| Standard knob axes + values | `src/modules/templates/knobs.ts` |
| Template registration data (capabilities, designStyles, `looks`) | `src/modules/templates/templateMeta.ts` |
| Handoff HTML validation before build | `npm run kit:lint` → `src/modules/templates/handoffLint.ts` |
| The designer's-bar gate (single call per template) | `templateConformance(templateId)` (`src/modules/templates/templateConformance.ts`) |
| Dual-renderer visual/CSS parity | `e2e/parity.spec.ts` (+ `?parityBreak=1` negative control) |
| Dual-renderer content parity | `src/modules/templates/__tests__/renderParity.meridian.test.tsx` |
| Anchors + banned fingerprints | `docs/product/anchorLibrary.md` |
| Build ladder / decision gate authority | `docs/tracks/scalePlan.md` §7 |
| Manual editor-basics + parity QA checklist | `.claude/skills/manual-test/SKILL.md` (editor-basics subsection) |

**Audience extension (beyond a skin) and new audience types are OUT of scope here.**
Adding section types / multi-page / collections is an audience-level, AI-first
change to `src/modules/audience/**` (coordinate with the PO; `docs/tracks/multiPagePlan.md`
is the authority). A brand-new audience type (e.g. `ecommerce`) is a separate,
larger plan. Neither belongs in the template build core above.
