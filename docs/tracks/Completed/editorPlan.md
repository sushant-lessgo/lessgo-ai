# editorPlan — world-class editing

Status: AGREED DIRECTION 2026-07-11 · **Priority #1 after `feature/i18n-phase-1` merges** (founder
ruling: "this is my number 1 worry — cheap, deep, everything"). Runs BEFORE template-factory
(factory consumes this track's editing contract) and BEFORE scale §5/§6 implementation (their UI
lands on this track's toolbar shell — build it once).

Evidence base: `reports/perf-editor-throttled6x-2026-07-11.md` (77% idle saturation ·
ElementDetector loop · CRITICAL silent edit-loss) + toolbar-system review 2026-07-11 (3 competing
positioning systems, per-toolbar duplicated lock/anchor machinery, whole-store subs in all 5
toolbars, stubbed buttons: alt-text discards silently, FormToolbar ~90% dead).

## Why this is priority

scalePlan makes the editor the customer's primary surface: T3 pixels (logos/photos/screenshots)
land in the editor after reveal (§8) · block swap is an editor action (D18) · §5 button modal +
THE one link popover are editor components · proof-truth needs-review flags surface here ·
universe's shared-edit propagation is an editor-semantics guarantee. Self-serve ("founder watches,
hands off") dies if the editor silently loses a keystroke or has buttons that lie.

## The core architectural correction

Today's editor is built like a **generic DOM builder** (MutationObservers discovering editables,
anchor registries tracking rects, transition locks smoothing selection races, watchdogs logging
their own bugs). But Lessgo pages are **generated from a schema we own** — sections → elements,
engine contract, keys known at render time. A schema-driven editor deletes that entire class of
machinery:

1. **Selection is data, not DOM discovery.** `{sectionId, elementKey}` in the store. Wrappers know
   their key as a React prop; click sets state; selected element renders its own ring. DELETE:
   ElementDetector remains, useGlobalAnchor, useTransitionLock, toolbarWatchdog, toolbarSingleton,
   selectionPriority TTL caches, 2 of 3 positioning systems.
2. **One commit path with a guarantee.** Typing stays in uncontrolled contentEditable (locked:
   cursor safety). Commit = a store transaction; **blur flushes synchronously, always** —
   persistence (localStorage/server) is async BEHIND the committed store write, never a starvable
   timer in front of it. Kills the silent-edit-loss class structurally.
3. **One toolbar shell.** Single floating container (`@floating-ui/react` — decided) owning
   positioning/dismissal/keyboard/arrow; per-type action sets as config. **Every action works or
   doesn't exist** — no stubs, enforced by review convention.
4. **Edits are data ops.** `setText/setImage/collectionOp/...` — pure store transactions. Enables:
   ops-based undo (inverse ops replace 50 full deep-copy snapshots — the 677 MB heap fix),
   i18n locale-keyed edits, universe propagation (replay op on sibling variants).
5. **Trust is visible and tested.** Save-state chip (Saved ✓ / Saving… / Retrying) + dirty-guard
   on close + Playwright edit-persistence spec (type → blur → reload → assert) under CDP CPU
   throttle — the net that catches edit-loss before customers do.

## The edit-primitive vocabulary (closed, code, ~10 ever — D9/D10 applied to editing)

**Editing behavior lives in platform primitives; templates only DECLARE which primitive each slot
uses — they never implement editing.** Same shape as copy engines: primitives are code and few,
templates are data and many. (The ×6 LinkTargetPopover duplication is what violating this costs.)

| Primitive | Serves | Standard UI (built once) | Store op |
|---|---|---|---|
| `text` | headlines, sublines, captions, labels | inline contentEditable + text toolbar | `setText(section, key, value, locale)` |
| `image` | single slots, portraits, screenshots | image toolbar: upload/stock/edit/alt/remove | `setImage(key, assetRef)` |
| | | ⚠ alt-text (2026-07-11 finding): NO published renderer reads a user alt field today (all hardcode `alt=""` or derive from sibling text); dead toolbar control removed in phase 2. Alt = REQUIRED part of `image`/`imageCollection` primitives in phase 3: canonical store = `elementMetadata[key].alt`, BOTH renderers read it via shared primitives (fallback: sibling-derived), never 40 hand-edited blocks. | |
| `imageCollection` | hero slider · portfolio grid · gallery · logo wall | collection panel: bulk upload, drag-reorder, remove, per-item alt/caption/category; min/max from block capacity | `collectionOp(add/remove/reorder/replaceItem)` |
| `logo` | header/footer logo — **site-scoped** (one value, nav+footer derive) | upload/remove + wordmark fallback | `setLogo(assetRef)` |
| `button` | CTAs | inline text + Button Settings modal (§5 GOAL_REF/Destination) | `setButtonConfig` |
| `link` | nav, footer, cross-page, social | THE one shared link popover (§5 — deletes 6 template copies) | `setLink` / derived |
| `collection` | cards: features, packages, FAQ, testimonials | add/remove/reorder within cardCount range; items = composites of the above | `collectionOp` on card arrays |
| `form` | form blocks | form-builder modal attach (shape finalized by §6) | `setFormConfig` |
| section-level | move/dup/delete/add · block swap (D18) · regen | section toolbar + LayoutChangeModal | exists |
| site-level | palette/knob/look · template swap · social profiles · locale | style panel / pickers | exists |

**Edit-time data ≠ runtime behavior** (the generalizing law): nobody edits "a slider" — they edit
an `imageCollection`; the block renders it as a slider (published behavior JS is a render concern,
zero editing code). Marquee = `text` rendered as marquee; quote rotation = `collection` rendered
rotating. Atelier's hero slider: block declares `slider_images: imageCollection(min 4, max 6,
aspect)` → standard collection editor → template dev writes NO upload code.

### Template editing contract (feeds template-factory)

- **Kit generator** emits per-slot primitive assignments — designer + porting agent know how every
  slot edits before code exists.
- **`templateConformance()`** asserts per-slot: every consumed element mounts its declared
  primitive (jsdom-checkable) — upgrades editor-basics v0 from prose to assertions. Forgotten
  logo upload = red test, not founder discovery.
- **Extension law** (new template needs an edit that doesn't exist): handoff lint requires every
  slot to map to a primitive. Unmappable → (a) re-express via existing primitive (almost
  everything visual is data + render behavior), or (b) **new primitive = platform build first**
  (rung-B logic: build once, all templates benefit). Never a template-local editing hack.

## Phases (each independently shippable)

| Phase | What | Gate |
|---|---|---|
| 0 | **perf-04** (`docs/task/perf-04-elementdetector-loop.spec.md`, specced) — kill ElementDetector loop; re-test edit-loss ×5 at 6× | edit-loss verdict decides phase-1 depth |
| 1 | **Trust** — synchronous-flush commit path (InlineTextEditorV2 commit audit) + save-state chip + throttled Playwright persistence spec | zero lost edits at 6×, spec in CI-runnable form |
| 2 | **Truth** — wire alt-text (one store call), DELETE FormToolbar (form-builder modal stays reachable; rebuild post-§6), wire-or-remove section "Regenerate Content" | no control that no-ops |
| 3 ✅ BUILT | **Shell + primitives** — schema-driven selection · floating-ui shell + action-set configs · selector-ize all toolbar store access · build `imageCollection` + `logo` primitives (atelier needs both) · DELETE anchors/locks/watchdog/singleton/legacy positioning · BUILT 2026-07-11 on `feature/editor-phase-3-shell-primitives` (`imageCollection` proven on vestria catalogue grid via upgraded injected `E.List`/`E.Img` + alt law; founder manual QA pending) | net-negative LOC; idle <10% at 6×; toolbar QA |
| 4 ✅ DONE | **Store finish** (`docs/task/editor-phase-4-store-finish.{spec,plan,audit}.md`) — collapsed the 4 access layers into ONE selector-first `useEditStore(selector?)` hook (+ `useEditStoreBootstrap` for `EditProvider` only); deleted `useEditStoreLegacy`/`useEditStoreGlobal`/dead compat shims; selector-ized all 70 bare whole-store call sites in 6 hot-first batches; ESLint `no-restricted-syntax` now bans bare `useEditStore()`. Ops-based undo **descoped** to universe/i18n (named-op mutation discipline preserved untouched — it's the propagation prerequisite, tackled there). Perf: renders/keystroke ↓, heap flat (see baseline doc). Gates A/B/C founder-approved 2026-07-14. | heap flat while typing; undo/redo QA — MET |
| 5 | **scalePlan surface** — §5 button modal + THE link popover · T3 placeholder-slot fill flow · social profiles editor · proof needs-review badges | lands ON the new shell (the reason this track precedes §5 implementation) |

Phases 0–3 unblock template-factory/atelier (kit + conformance consume the contract; atelier's
slider is the `imageCollection` proving case). Phase 4 unblocks universe + i18n assisted mode.
Phase 5 IS part of scale implementation, sequenced here.

> **Known dead code — KEPT (founder ruling 2026-07-14):** 6 never-mounted modals surfaced during
> phase-4's B5 batch — `CountdownConfigModal`, `TaxonomyModalManager`, `LandingGoalsModal`,
> `ElementPicker`, `DeviceToggle`, `PrivacyPolicyEditor` — are retained for now (deletion deferred,
> not part of the store-finish scope). Their store access was selector-ized like everything else.

## Decisions locked (2026-07-11)

1. `@floating-ui/react` adopted for all toolbar/popover positioning.
2. FormToolbar deleted now; form-editing UX rebuilt only after scale §6 (goal→form) defines it.
3. ~~Ops-based undo in phase 4 (not deferred to universe — it's also the heap fix).~~ **Superseded (2026-07-14):** phase 4 delivered the heap fix via selector-ization alone; ops-based undo **descoped** back to universe/i18n (its real driver = shared-edit propagation). Named-op mutation discipline preserved untouched, so ops-undo remains a clean future add.
4. Queue: this track = #1 after i18n-phase-1; template-factory + atelier run AFTER phases 0–3;
   scale §5/§6 UI waits for the shell (phase 5).
5. No UX layout change (locked earlier: cost driver was store writes, not editable surface).
   InlineTextEditorV2 stays uncontrolled (cursor-jump history).

## Out of scope

Renderer/dual-pair changes · collaborative/multiplayer editing · blog editor (separate surface) ·
freeform styling controls (D6: curated looks only) · mobile editing UX.

## References

- `reports/perf-editor-throttled6x-2026-07-11.md` — evidence (loop attribution, edit-loss repro).
- `docs/task/perf-04-elementdetector-loop.spec.md` — phase 0, specced.
- `docs/task/template-factory.spec.md` — editor-basics v0 (WHAT) → this track's contract (HOW).
- `docs/task/atelier-template.spec.md` — first template born under the contract (slider case).
- `docs/tracks/scalePlan.md` §5/§6/§8-T3/D18 — the editor surface scale demands.
- `docs/tracks/universePlan.md` — shared-edit propagation (ops requirement).
- `src/app/edit/[token]/README.md` — current editor architecture.

## Unresolved questions

1. Phase 1 commit-path fix: patch InlineTextEditorV2's existing commit chain vs rewrite commit
   layer (decide after phase-0 edit-loss re-test).
2. ~~Phase 3/4 boundary: selector-ize during shell build or all-at-once in store finish.~~
   **Resolved:** phase 3 did the toolbars, phase 4 did the rest (the ~70 remaining bare
   whole-store call sites, in hot-first batches).
3. Save-state chip placement + copy (small taste gate at build).
4. `imageCollection` per-item caption/category schema — align with portfolio grid contract slots
   at kit-generation time.
