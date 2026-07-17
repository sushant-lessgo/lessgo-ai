# toolbar-standard-beta — audit

Branch: `feature/toolbar-standard-beta` (verified via `git branch --show-current` before any edit).

---

## Phase 1 — t2 shell chrome + slots + ToolbarButton + migrate Text/Section/Image/Element

### Files changed

- `src/app/edit/[token]/components/toolbars/ToolbarButton.tsx` (**new**) — shared toolbar primitives.
- `src/app/edit/[token]/components/toolbars/ToolbarShell.tsx` — owns the t2 chrome + trailing slots.
- `src/app/edit/[token]/components/toolbars/actionSets.tsx` — `designMenu` trailing-slot metadata.
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` — chrome stripped, buttons migrated.
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — chrome stripped, buttons migrated.
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx` — chrome stripped, buttons migrated (reskin only).
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx` — chrome stripped, buttons migrated.
- `e2e/toolbar-dispatch.spec.ts` (**new**) — 6-test dispatch/anatomy net. ⚠️ **not registered** — see Blocker.
- `docs/task/toolbar-standard-beta.audit.md` (this file).

`FloatingToolbars.tsx` was in the Files-touched list "only if the mount needs adjusting" — it did not
(it is a 1-line `<ToolbarShell />` mount), so it is untouched.

**Published-side: clean.** `git status` shows zero `.published.tsx` / `.core.tsx` / renderer /
registry files. `linkTargetPublished.test.tsx` is byte-untouched and green. Independent
confirmation: ui-foundation's published-HTML snapshot guard (`uiFoundationIsolation.test.tsx`)
passes unchanged, i.e. published output is byte-identical.

### What changed, per file

**`ToolbarButton.tsx` (new).** Four primitives, all presentation:
- `ToolbarButton` — `{icon, label, trailing, onClick, disabled, disabledTitle, variant, active, 'data-action' (required)}`, forwardRef, rest-props spread (TextToolbarMVP needs `onMouseDown`/`onPointerDown`). Variants `default | emphasis | danger`.
- `ToolbarDivider` — replaces four ad-hoc `w-px h-6 bg-gray-200`/`bg-gray-300`.
- `ToolbarLabel` — the leading status chip (dot + name + optional badge).
- `ToolbarChromeContext` / `useHideToolbarChrome` — the chrome-visibility channel (see Decisions).

Conventions now standardised: `data-action` on **every** button (previously only SectionToolbar
tagged it), and disabled = muted + `cursor-not-allowed` + `disabledTitle` + **`aria-disabled`**
(which existed nowhere in the codebase before).

**`ToolbarShell.tsx`.** Now wraps `{toolbarBody}` in the t2 chrome (dark `#191922` pill, radius 11,
`p-[5px]`, `shadow-[0_10px_24px_-10px_...]`) and renders the trailing slot group after it:
Design ▾ (disabled + lock glyph + "why" tooltip) and the Ask AI slot (**not rendered** — phase 5).
`FloatingArrow` recoloured `fill-white` → `fill-[#191922]` to match. Chrome constraints honoured:
**no `overflow-hidden`** and **`relative`** (both now enforced by a mutation-proven e2e test).

**`actionSets.tsx`.** `ActionSetEntry` gains `designMenu: 'disabled' | 'hidden'` (+ exported
`TrailingSlotState`); all four entries set `'disabled'`. `component` remains a module-level constant
— no entry maps to a locally-defined component (stable element type → no remount → no local-state loss).

**`ElementToolbar` / `SectionToolbar` / `ImageToolbar` / `TextToolbarMVP`.** Each lost its
`bg-white border border-gray-200 rounded-lg shadow-lg` box and its `flex items-center px-3 py-2`
row; each keeps its own inner `<div ref={toolbarRef}>` because the refs, `data-toolbar-type`,
`data-editor-id` and (critically) TextToolbarMVP's `onMouseDown`/`onMouseUp` `preventDefault`
(which stops the toolbar stealing the text selection) are all load-bearing. Buttons → `ToolbarButton`.
TextToolbarMVP additionally lost its hard-coded `height: 52px` (the shell's pill self-sizes).

### Gating semantics — preserved exactly (verified by reading, not assumed)

| Gate | Status |
|---|---|
| `CHROME_HIDDEN_ACTIONS` (move/dup/delete hidden on chrome sections) | untouched |
| `eligibleVariantCount(...) > 1` → Section Layout | untouched |
| `canConvertToForm()` → Button Settings | untouched |
| `hasTextContent()` → Edit Text | untouched |
| `regenLocaleLocked` → Regenerate / sparkle disabled | untouched |
| Delete only for flat keys (`!elementKey.includes('.')`) | untouched |
| Image Replace/Stock → `MediaPickerModal`; Edit → `SimpleImageEditor` | untouched (reskin only) |
| **No** new Image actions (Link deferred, ruling 5) | honoured — asserted in e2e |
| **No** Section Background action (D-1) | honoured — asserted in e2e |
| Ask AI slot hidden (phase 5) | honoured — asserted in e2e |

### Decisions + Deviations

1. **Delete NOT hoisted into the shell's trailing slot (deviation from step 4).** Step 3's `trailing`
   metadata is a *pure* `(selection, target)` function; it cannot carry the store-bound handlers the
   Delete actions need (`useSectionCRUD`, `confirmDialog`, `content`/`setSection`). Hoisting them
   would be a real refactor of behaviour — which step 4's own "preserve ALL current gating semantics…
   no behavior change this phase" forbids. **Conservative option taken:** each toolbar still renders
   its own Delete last, now as `ToolbarButton variant="danger"`. Consequence: the anatomy is
   `[element actions incl. Delete] · [Design ▾]`, not `… · [Design ▾] · [⋯/Delete]`. `designMenu`
   metadata is added *and consumed*; `trailing`/`deleteAction` deliberately NOT added as dead fields
   — they should land in the phase that has a consumer.
2. **Chrome-visibility context (net-new mechanism, not in the plan).** SectionToolbar has a state the
   plan didn't account for: while a section regenerates (and for 3s after) it renders a fixed
   bottom-right progress card and **no toolbar**. With the chrome hoisted, that would leave an empty
   dark pill carrying only the disabled Design ▾ hovering over the section — a visible regression.
   The shell can't derive this (`showCompletionMessage` is SectionToolbar's local 3s state), so a
   `useLayoutEffect`-based context (pre-paint, no flash) lets a body drop the chrome. It lives in the
   leaf `ToolbarButton.tsx`, not `ToolbarShell.tsx`, to avoid the cycle
   ToolbarShell → actionSets → SectionToolbar → ToolbarShell.
3. **Status label kept, as a `ToolbarLabel` primitive (partial deviation from step 4's "strip the
   status dot/label rows").** Its *content* is store-derived per toolbar (SectionToolbar's
   validation-colour dot + completion % + "Shared · all pages" badge; ElementToolbar's element key),
   and the registry's resolvers are pure. Stripping it outright would delete user-facing information
   (a behaviour change); moving it to metadata would need store reads in the registry. The *look* is
   unified here, which is the phase's actual goal. Phase 2's "Footer label" requirement also needs it.
4. **Disabled colour = `#5a5a66`, not the `text-gray-300` precedent I was told to standardise on.**
   All three legacy conventions were written for a **white** toolbar. On the t2 dark `#191922` pill,
   `text-gray-300` (#d1d5db) is *brighter* than the enabled `#b8b8c2` — a disabled button would read
   as the most prominent action in the set. The *convention* (muted + `cursor-not-allowed` +
   `disabledTitle` + `aria-disabled`) is standardised as instructed; only the hex is dark-appropriate
   (`#5a5a66` is the handoff's own lock/muted tone).
5. **Handoff conflict, flagged for the phase-2 gate.** The handoff's Beta frame (`t2b`) removes
   Design ▾ **entirely** ("held back… removed from toolbars for launch"). The plan (step 2 + D-3) says
   render it **disabled/greyed**. I followed the **plan**. Worth a nod at the founder gate — designer's
   Beta intent was "gone", ours is "greyed".
6. **Arbitrary Tailwind values, not tokens.** The t2 dark-toolbar palette has no `app-*` token and
   `tailwind.config.js` is out of scope, so colours are arbitrary values (`bg-[#191922]` etc.).
   Per `src/components/ui/README.md` this is the safe direction (no stock key mutated → no
   editor↔published divergence). `font-app-sans` IS used. Worth a token pass later.
7. **Existing SVG icon maps kept.** The handoff uses Material Symbols, but `AppIcon` needs glyphs
   added to `icons.txt` + a font-subset regeneration — out of scope. Icons inherit `currentColor`
   and read correctly on the dark pill.
8. **`variant: 'danger'` added to Element/Image Delete.** SectionToolbar already had it; the other
   two rendered Delete in plain grey. Presentation-only unification.

### Verification

**`npx tsc --noEmit`** → **clean, zero output.**
(Note: on the first run it emitted one pre-existing, out-of-scope error —
`src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — caused by a missing
generated `next-env.d.ts` in this fresh worktree. Confirmed pre-existing by `git stash -u` → same
error on a clean tree; it disappeared once the dev server regenerated `next-env.d.ts`.)

**`npm run test:run`** → **209 passed | 1 skipped (210 files); 3546 passed | 18 skipped (3564 tests).**
Includes `linkTargetPublished.test.tsx` (green, byte-untouched) and the ui-foundation published-HTML
snapshot guard (green ⇒ published output byte-identical).

**`npx eslint src/app/edit/[token]/components/toolbars e2e/toolbar-dispatch.spec.ts`** →
**0 errors, 3 warnings**, all pre-existing `react-hooks/exhaustive-deps` on code I did not author.
No bare `useEditStore()` introduced (selector + `useEditStoreApi()` convention followed; the ESLint
ban would have errored).

**`npx playwright test e2e/toolbar-dispatch.spec.ts`** → **cannot run as-invoked: "Total: 0 tests in
0 files"** — see Blocker. Run through an equivalent throwaway config: **7/7 passed (1.4m)**:

```
✓ 1 [setup] › auth.setup.ts › authenticate
✓ 2 text target: one shell, format actions, no Ask AI (19.7s)
✓ 3 section target: one shell with the section action set (6.3s)
✓ 4 image target: reskin only — no Link action (8.0s)
✓ 5 Design ▾ renders disabled and inert (4.2s)
✓ 6 dropdown panels are not clipped by the chrome box (4.2s)
✓ 7 Esc dismisses the shell (4.4s)
7 passed (1.4m)
```

Two anti-theatre corrections made while writing it, both worth recording:
- The image case originally ran on the meridian seed and **skipped itself green** — meridian emits no
  `[data-image-id]` at all (those blocks are hearth/surge/lex per ImageToolbar's own note). It now
  seeds a **second, hearth** draft and asserts the exact 5-action set.
- The panel-clipping test originally used `boundingBox()` + `toBeVisible()` and **passed even with
  `overflow-hidden` added to the chrome** — `overflow` clips paint, not layout geometry. Rewritten to
  hit-test via `document.elementFromPoint`. **Mutation-verified both ways:** with `overflow-hidden` →
  fails ("panel is painted but unreachable"); reverted → passes.

### ⚠️ BLOCKER — `playwright.config.ts` registration (out of my Files-touched)

`playwright.config.ts` `testMatch` is an explicit **allowlist**; its own comment warns an
unregistered spec "silently matches no project and gives false confidence: the suite goes green
having never run it". `npx playwright test e2e/toolbar-dispatch.spec.ts --list` → **0 tests**.
The spec needs `/toolbar-dispatch\.spec\.ts/` added to the `authed` project (it is authed +
seeded). **I did not make that edit** — the file is not in phase 1's Files-touched list. Precedent:
ui-foundation phase 1 hit this and the orchestrator added the file post-hoc. Raised in the mailbox
(`.claude/mailbox/toolbar-standard-beta.md`). Phases 2/3/4 all extend this spec, so it compounds.

Verified without touching any repo file: a throwaway root config reusing the real one with only
`projects` overridden (deleted after use; `git status` clean).

### Open risks / what I did NOT verify

- **No manual dev check performed.** The plan's manual items (text variations panel opens
  un-clipped; toolbar local state survives shell re-renders while scrolling) were not done by hand.
  The clipping half is now covered by the mutation-proven e2e test; the **local-state-survival half
  is unverified** — I preserved the module-level-constant invariant that protects it, but did not
  observe it.
- **Visual fidelity vs the t2 handoff is unverified by eye.** Values were transcribed from the
  handoff HTML (pill `#191922`/r11/p5, actions r7/`6px 9px`, idle `#b8b8c2`, hover `#2c2c38`,
  divider `#33333f`, danger `#ff7a7a`), but nobody has looked at it rendered. **The dark toolbar is
  a big visual change from today's white one** — worth an early founder glance rather than waiting
  for the phase-2 gate.
- **The `form` action set is still absent**, so a form selection renders nothing (unchanged from
  today, and phase 2's job).
- **Section e2e asserts a subset, not equality** — `change-layout` is conditional on
  `eligibleVariantCount > 1` and the move/dup/delete set varies by chrome-ness, so exact equality
  would be seed-fragile. The invariants (`add-element`, `design-menu` present; `ask-ai`,
  `background` absent) are asserted.
- **ToolbarLabel on a section shows `sectionId` capitalised** (e.g. `Hero-a1b2c3d4`) — pre-existing
  behaviour, carried over unchanged, but it looks rough in the new chrome.

---

## Phase 1 — fix pass (impl-review round 1: `fix first`, 1 blocking issue)

### Files changed (fix pass)

- `playwright.config.ts` — registered `toolbar-dispatch.spec.ts` in the `authed` project's `testMatch`.

### BLOCKING ISSUE 1 — e2e spec was never registered (FIXED)

`playwright.config.ts`'s `authed` project uses an explicit **allowlist** `testMatch` (its own comment
at :52-56 warns about exactly this failure mode). The phase-1 spec was unlisted, so it matched no
project and ran zero tests — the suite would have gone green having never executed it. Phases 2/3/4
all extend this spec, so this would have compounded into fake QA.

I originally refused this edit as out-of-scope (`playwright.config.ts` was not on phase 1's
Files-touched). The orchestrator has since **authorized and required** it, adding the file to
phase 1's Files-touched. Fix applied: added `/toolbar-dispatch\.spec\.ts/` to the **`authed`**
project (correct choice — the spec needs a Clerk session + seeded project; `public` would fail).

**Proof 1 — `--list` through the real config (was previously "Total: 0 tests in 0 files"):**

```
$ npx playwright test e2e/toolbar-dispatch.spec.ts --list
Listing tests:
  [setup] › auth.setup.ts:9:6 › authenticate
  [authed] › toolbar-dispatch.spec.ts:97:7 › toolbar dispatch (phase 1: one shell, curated actions) › text target: one shell, format actions, no Ask AI
  [authed] › toolbar-dispatch.spec.ts:126:7 › toolbar dispatch (phase 1: one shell, curated actions) › section target: one shell with the section action set
  [authed] › toolbar-dispatch.spec.ts:143:7 › toolbar dispatch (phase 1: one shell, curated actions) › image target: reskin only — no Link action
  [authed] › toolbar-dispatch.spec.ts:162:7 › toolbar dispatch (phase 1: one shell, curated actions) › Design ▾ renders disabled and inert
  [authed] › toolbar-dispatch.spec.ts:183:7 › toolbar dispatch (phase 1: one shell, curated actions) › dropdown panels are not clipped by the chrome box
  [authed] › toolbar-dispatch.spec.ts:211:7 › toolbar dispatch (phase 1: one shell, curated actions) › Esc dismisses the shell
Total: 7 tests in 2 files
```

**Reconciling 6 vs 7:** the reviewer expected 6 and my earlier run reported 7/7 — both are right.
There are **6 spec tests**; the 7th is the `authenticate` test from the `setup` dependency project,
which Playwright includes in the run. No test is missing or duplicated.

**Proof 2 — real run through the real config (no throwaway config):**

```
$ E2E_PORT=3057 npx playwright test e2e/toolbar-dispatch.spec.ts
  ✓  6 [authed] › e2e\toolbar-dispatch.spec.ts:183:7 › ... › dropdown panels are not clipped by the chrome box (4.1s)
  ✓  7 [authed] › e2e\toolbar-dispatch.spec.ts:211:7 › ... › Esc dismisses the shell (3.6s)

  7 passed (1.2m)
```

`E2E_PORT=3057` was needed only because port 3000 was held by another worktree's dev server
(`EADDRINUSE`); `E2E_PORT` is a first-class config toggle, not a config bypass. The interleaved
`ReferenceError: window is not defined` lines are **pre-existing dev-mode SSR log noise** from
`src/hooks/useEditStoreBootstrap.ts:238` (a `NODE_ENV === 'development'` debug hook, untouched by
this phase) — logged, not thrown into any test; all 7 passed.

### Known ACCEPTED semantics change — `InlineTextEditorV2` blur guard

Documented per the orchestrator, **not fixed** — recorded now so it is not later discovered as a
mystery regression:

`ElementToolbar` no longer carries its own `data-toolbar-type="element"`; the shell chrome now
carries `data-toolbar-type={activeToolbar}` (`ToolbarShell.tsx:259`). The `closest('[data-toolbar-type]')`
guards (`hoverTarget.ts:58`, `useEditor.ts:81`, `HoverOverlay.tsx:88`) still resolve via the
ancestor — unaffected. **But** `InlineTextEditorV2.tsx:206` checks
`closest('[data-toolbar-type="text"]')`, which **previously never matched** (the text toolbar tagged
itself `"text-mvp"`) and **now does** — so blur onto the text toolbar no longer saves/exits. This is
almost certainly the guard's original intent, and is largely moot because the toolbar's
`onMouseDown` preventDefault stops the blur from firing at all. Still: it IS a behavioural delta
inside a phase whose contract was "no behaviour change". Accepted, deferred.

### Minor ordering edge (deferred → candidate for a later phase)

The shell's `setChromeVisible(true)` runs in a `useEffect` (`ToolbarShell.tsx:159`), which fires
**after** a newly-mounted body's `useLayoutEffect`. Selecting a section that is **already**
mid-regeneration could therefore show an empty pill until regen ends. Rare in practice (regen is
triggered from that section's own toolbar, so the shell is already mounted). Candidate fix: promote
to `useLayoutEffect`. Not changed now.

### Open / unverified — for the founder's phase-2 gate

- **Local-state survival across shell re-renders is unverified by anyone** — this is the invariant
  the module-level-constant rule protects. I preserved the invariant (module-level `component` is
  intact) but neither I nor the reviewer observed the behaviour.
- **t2 visual fidelity by eye is unverified by anyone.** Values were transcribed from the handoff
  HTML, but nobody has looked at it rendered. The dark toolbar is a large visual change from today's
  white one — worth an early founder glance.

### Gate re-run after the fix

```
$ npx tsc --noEmit
TSC_EXIT=0        (clean, no output)

$ npm run test:run
 Test Files  209 passed | 1 skipped (210)
      Tests  3546 passed | 18 skipped (3564)
   Duration  69.93s
```

Both green. Not committed — the orchestrator commits.
