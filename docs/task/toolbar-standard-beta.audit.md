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

---

## Phase 2 — Beta action sets: Button/CTA, Form, Footer

**Headline: this phase is 2/3 delivered. Button/CTA and Footer are done and gated. FORM IS
BLOCKED** — not by effort, but because the plan's premise about it is wrong (see BLOCKER). I did
not work around it by editing files outside the Files-touched list. **A ruling is needed before
phase 3.**

### Files changed

- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` — Button/CTA Beta set (`link-action`, disabled).
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — human label on the status chip ("Footer").
- `src/app/edit/[token]/components/toolbars/actionSets.tsx` — `form` entry + comment correction.
- `src/app/edit/[token]/components/toolbars/FormToolbar.tsx` (**new**) — ⚠️ currently UNREACHABLE, see BLOCKER.
- `src/hooks/editStore/uiActions.ts` — **broken-path fix** to `showFormBuilder`/`hideFormBuilder` (flagged below).
- `e2e/toolbar-dispatch.spec.ts` — +3 tests (button set, Link/Action disabled, footer). 10 total.
- `docs/task/toolbar-standard-beta.audit.md` (this file).

**Published-side: clean.** `git status` lists zero `.published.tsx` / `.core.tsx` / renderer /
registry files. `linkTargetPublished.test.tsx` byte-untouched + green. The `M` on
`uiFoundationIsolation.test.tsx.snap` is again the phase-1 CRLF stat artifact, **proven
byte-identical by blob hash** (`git rev-parse HEAD:<snap>` == `git hash-object <snap>` ==
`117aa8fee8e046025e5432c0300b12651eed7342`) — intentionally unstaged.

---

### ⚠️ BLOCKER — the `form` ToolbarType cannot be DISPATCHED (plan premise is wrong)

The brief (and plan step 2) says: *"`'form'` IS in `ToolbarType` and `showFormToolbar` exists, but
there is no `form` entry in `actionSets` → the shell's lookup misses → renders nothing. You are
filling a dead ToolbarType."*

**That is only half the story, and the missing half is fatal to the phase-2 Form goal.** Adding the
`actionSets['form']` entry does not make Form reachable. Code-verified chain:

1. `showFormToolbar` has **zero callers** in `src/` (grep: only its own definition at
   `uiActions.ts:373` + the shell's `hideFormToolbar` in its dismissal set).
2. The ONLY path that can emit a form selection is `useEditor.ts:307`,
   `showToolbar(determineElementType(el), …)`, where `determineElementType` (`useEditor.ts:197`)
   returns `'form'` for `tagName === 'form' || elementKey.includes('form')`.
3. Every element key containing `form` in a servable template is a **contenteditable text element**
   (exhaustive grep): `TechPremiumContact.tsx:125,127,134` (`form_heading` / `form_note` /
   `form_foot`) and `LumenContactForm.tsx:74` (`form_note`) — all `TechPremiumEditable`/`ed()`
   **without `isButton`**, i.e. a bare `InlineTextEditorV2`. (`form_headline` never even reaches the
   `form` branch — `includes('headline')` returns `'text'` first at `:186`. `form_id` is
   `fillMode:'system'`, never rendered.)
4. Clicking one fires `InlineTextEditorV2`'s `onClick` → `focus()` → `handleFocus` (`:177-180`) →
   **`setTextEditingMode(true)`**.
5. `getActiveToolbar` (`selectionPriority.ts:45-47`) checks `isTextEditing` as **priority 1**, before
   it ever consults `toolbarType === 'form'` at priority 2.

⇒ **A form selection can never win the resolver.** `form` is not a dead *entry*, it is a dead
*dispatch*. The shared `LeadForm.tsx` edit twin doesn't even stamp `data-element-key`, so it resolves
to a **section** target; `TechPremiumContact`'s actual `<input>`s carry no element key either.
(Telling detail: `hoverTarget.ts:189` already *labels* these targets `Form` — forward vocabulary for
a toolbar that was never dispatched. The label has always been a promise the click path didn't keep.)

**Why I stopped rather than fixed it.** Making Form reachable requires one of:
- `useEditor.ts` — a `<form>`-ancestor rule in `determineClickTarget` (mirroring `hoverTarget.ts:189`), **and**
- `selectionPriority.ts` and/or `InlineTextEditorV2.tsx` — to stop text-edit focus outranking it.

**None of those files are in phase 2's Files-touched list**, and two of them are explicitly fenced:
constraint 3 ("preserve existing gating semantics exactly") and the brief's "**Do NOT change priority
logic**". The brief anticipated only an anchor/`resolveProps` fault ("if it doesn't, fix
resolveProps/anchor for `form` ONLY") — **the fault is neither**: `resolveProps` and the anchor are
both correct and would work the moment a form selection existed (`uiActions.ts:340-352` does populate
`{sectionId, elementKey}`, and the shell's `[data-section-id] [data-element-key]` anchor resolves it).
So this is an out-of-scope need → stop and report.

**What I left in the tree (please rule):** `FormToolbar.tsx` + `actionSets['form']` are **written,
typechecked, and completely inert** — the entry is only ever consulted if `activeToolbar === 'form'`,
which cannot happen today, so there is **zero behaviour change**. I kept them so a dispatch fix is a
small diff, not a rebuild. **They are dead code until dispatch is fixed.** Three options:
1. Widen a phase (3 or 4) to include `useEditor.ts` + the text-focus interaction → Form lands properly.
2. Delete `FormToolbar.tsx` + the `form` entry, move Form to Final, and correct the honesty table
   (Form would join Footer/Menu in the "nothing new" column — that materially changes the phase-2
   gate story, which is the whole point of the table).
3. Keep as-is (dormant) pending option 1. **My recommendation** — but it must be an explicit,
   recorded choice, not a silent one.

**The honesty table needs a correction at the founder gate either way.** It currently promises
"Form | Edit fields + settings **dispatch through the shell**". Today they dispatch through nothing.

---

### What changed, per file

**`ElementToolbar.tsx` — Button/CTA Beta set.** Added `link-action` ("Link/Action"), rendered
**disabled** with `disabledTitle: "Link picker lands next phase"`, gated on the EXISTING
`canConvertToForm()` context predicate (reused verbatim — no new gating). Beta order is now
Edit Text · Link/Action · Button Settings · Regenerate · Delete. Phase 3 un-disables the one entry.

**`SectionToolbar.tsx` — the "Footer" label.** New `sectionChipLabel()`: the chip showed the whole
section id capitalised (`Footer-e56fb4a4` — phase 1's audit called it "rough"), now the type segment
(`Footer`). Not footer-special-cased: it is the same one-expression change for every section, and
special-casing would have been more code for a worse result. **Deliberately not sourced from
`sectionList`'s labels** — those are picker prose ("Primary CTA Section") and are product-only
(service/work types absent), so they'd fall back to this anyway for half the templates.

**`actionSets.tsx`.** Added the `form` entry (module-level `component` constant — invariant held;
nothing maps to a locally-defined component). Corrected the stale "Only the 4 RENDERABLE toolbar
types / `form` intentionally absent" comment.

**`FormToolbar.tsx` (new).** Label chip + `edit-fields` / `form-settings`, both opening the existing
FormBuilder. No new form capability (reorder + type restriction are phase 4, ruling 4). **See BLOCKER
— currently unreachable.**

**`uiActions.ts` — see the next section. This one needs a decision.**

---

### Decisions + Deviations (each is a judgment call — please check them)

1. **`showFormBuilder`/`hideFormBuilder` were BROKEN; I fixed them. Flagging loudly — this is the
   edit most likely to exceed my brief.** The plan said "Edit fields opens the existing FormBuilder
   flow (verify current trigger path and reuse)". I verified it: **there is no working trigger path.**
   - `uiActions.ts:430` wrote `state.forms.formBuilder.visible`, but `state.forms` is the FLAT
     `Record<string, MVPForm>` map initialised to `{}` (`editStore.ts:291`) — `formBuilder` is a
     **sibling** top-level field (`:296`). So `state.forms.formBuilder` is `undefined` and the
     assignment **throws `TypeError: Cannot set properties of undefined`**.
   - Nothing reads `formBuilder.visible` anyway (zero readers in `src/`). The ONE consumer,
     `GlobalFormBuilder.tsx:10-16`, reads `formBuilderOpen`/`editingFormId` — the fields set by
     `formActions.ts:137-149`, which is **never wired into the store** (`editStore.ts:423-426` spreads
     persistence/ui/formsImage; `createFormActions` is absent).
   - ⇒ **The FormBuilder modal is unreachable in the editor today, and its one caller —
     ButtonConfigurationModal's "Create New Form" (`:485-487`) — throws when clicked.**

   I repointed both actions at the fields the consumer actually reads. **Blast radius: that
   ButtonConfigurationModal button starts working** (a crash-fix, but a genuinely NEW working flow in
   the editor that nobody QA'd). `uiActions.ts` IS on my Files-touched list, but scoped there to
   "action-id registry only, if needed" — so this is a deviation. **Drop it if you'd rather it rode
   its own spec; nothing else in phase 2 depends on it** (Form is blocked regardless).
   I also dropped the impl's `state.leftPanel.activeTab = 'pageStructure'` side-effect (switching the
   left panel while opening a modal); it never executed, so nothing regresses. Left alone: the same
   broken path in `persistenceActions.ts:816` (overridden by uiActions, file not in scope) and in
   `convertCTAToForm` (`uiActions.ts:471`, still throws — not mine, flagging it).
2. **Button "Style" is NOT shipped — the honesty table's "relabel" is downgraded to "absent". Blunt
   version: Beta has no Style action.** Per constraint 8 I verified whether a per-button style field
   exists: **it does not.** The only style-adjacent field, `buttonConfig.ctaType`
   (`types/core/content.ts:209`), is **derived READ-ONLY from the element key** (`secondary_*` ⇒
   secondary, `ButtonConfigurationModal.tsx:156-161`, scale-04 "role is DERIVED, never chosen") and is
   a form-**placement** role, not a visual style. So: no store field added (as instructed). But I also
   **did not rename "Button Settings" → "Style"**, because the panel it opens is a
   destination/behaviour configurator (link / page / form + behaviour + icons) with **zero style
   controls** — the rename would make the button lie about what it opens, which is worse than the
   honest gap (cf. the QA-naayom precedent that dead/misleading buttons read as bugs). Conservative
   option taken, per the ambiguity rule. **Founder gate: "Style" moves from Beta to Final.**
3. **Form "Settings" is a second door to the same room.** FormBuilder is ONE scrolling dialog whose
   top surface already IS the settings (name / submit text / success message / integrations,
   `:219-251`) with the field list below. It has **no tabs or anchors** to route to, so "Edit fields"
   and "Settings" open an identical modal in an identical state. Routing them apart would mean editing
   `FormBuilder.tsx` (phase 4's file, not mine). Shipped per the plan's literal wording; recording
   that it is **not two surfaces**. Moot while Form is blocked.
4. **`trailing` abstraction: still NOT built** (per instruction). Nothing in phase 2 needed a consumer.
5. **No `uiActions.ts:80-95` (`getActionsForType`) change** — confirmed metadata-only, gates nothing,
   already has its `'form'` case. As the brief said.
6. **Social: nothing.** Untouched, per plan step 4.

---

### Verification (pasted, real)

```
$ npx tsc --noEmit
TSC=0                                    (clean, no output)

$ npm run test:run
 Test Files  209 passed | 1 skipped (210)
      Tests  3546 passed | 18 skipped (3564)
   Duration  57.83s
```
(Identical counts to phase 1 — no vitest test covers these files; the net here is Playwright.)

```
$ npx eslint "src/app/edit/[token]/components/toolbars" "src/hooks/editStore/uiActions.ts" e2e/toolbar-dispatch.spec.ts
✖ 3 problems (0 errors, 3 warnings)
```
All 3 are the same pre-existing `react-hooks/exhaustive-deps` warnings phase 1 reported, on code I
didn't author. No bare `useEditStore()` introduced (selector + `useEditStoreApi()`; the ESLint ban
would have errored).

```
$ npx playwright test e2e/toolbar-dispatch.spec.ts --list
Total: 10 tests in 2 files          (6 phase-1 + 3 phase-2 + the setup project's `authenticate`)

$ E2E_PORT=3061 npx playwright test e2e/toolbar-dispatch.spec.ts
  ✓   8 [authed] › ... › Design ▾ renders disabled and inert (3.4s)
  ✓   9 [authed] › ... › dropdown panels are not clipped by the chrome box (3.6s)
  ✓  10 [authed] › ... › Esc dismisses the shell (3.5s)
  10 passed (1.3m)
```
Through the REAL config (registered in the `authed` project since phase 1's fix pass). `E2E_PORT=3061`
only because 3000 is held by another worktree — a first-class toggle, not a config bypass. The
interleaved `ReferenceError: window is not defined` lines are the same pre-existing dev-mode SSR log
noise from `useEditStoreBootstrap.ts:238` (logged, never thrown into a test).

**Anti-theatre — mutation-proven, not asserted-and-hoped.** The footer-label test is the one new
assertion that could have passed vacuously (`toContainText('Footer')` matches `Footer-e56fb4a4` just
fine — which is exactly the bug). I reverted `sectionChipLabel` to the old expression and re-ran:

```
✘  2 [authed] › ... › footer target: chrome-section set in the one shell, labelled "Footer"
    Error: section uuid leaked into the label chip
    Expected pattern: not /footer-[0-9a-f]{8}/i
    Received string:  "Footer-e56fb4a4
  1 failed
```
Fails on revert, passes when restored ⇒ the assertion is real. The two button/CTA tests can't be
vacuous by construction: one asserts **set equality** on `data-action` ids (a missing OR leaked action
fails), the other asserts `toBeDisabled()` on `link-action` — which only passes because `disabled`
genuinely propagates through ElementToolbar's map into `ToolbarButton`.

**No form e2e case exists, deliberately** — Form is undispatchable (BLOCKER), so any "form toolbar"
test would have to assert a negative or skip itself green. That's precisely the failure mode phase 1
caught twice. I left the reason in the spec's header comment instead.

---

### What I did NOT verify (explicit list)

- **Nothing about Form works end-to-end** — `FormToolbar` has never rendered, in a test or by hand.
  It is unreachable. Do not read "tsc + tests green" as evidence it functions.
- **The `showFormBuilder` fix is unverified by hand.** I did not open the editor and click "Create
  New Form" in ButtonConfigurationModal to watch the FormBuilder modal appear. The reasoning is
  code-verified (the fix writes exactly the two fields `GlobalFormBuilder` reads) but **nobody has
  observed the modal open**, and nobody has QA'd the create-form flow it un-breaks.
- **No manual dev check at all this phase** — no visual look at the Button/CTA or Footer toolbars.
- **Phase 1's two open items are still open**: toolbar local-state survival across shell re-renders,
  and t2 visual fidelity by eye. Neither is verified by anyone.
- **The Button/CTA set was verified on meridian only.** `cta_text` is the `isButton` path; templates
  whose CTA is not `isButton` would enter text mode instead and never show this set. Not surveyed.
- **`link-action`'s phase-3 hand-off is untested by definition** — I assert it stays inert; nobody has
  proven the picker will mount cleanly where the disabled button sits.
- **Section-label change blast radius**: the chip label change affects EVERY section type, not just
  footer. I asserted footer; I did not eyeball hero/features/etc., and service/work section-id
  vocabularies were not surveyed for ugly type segments.

Not committed — the orchestrator commits.

---

## Phase 2 — comment fix (post-impl-review, ride-along)

**Files changed**
- `src/app/edit/[token]/components/toolbars/FormToolbar.tsx` (comment only)
- `src/app/edit/[token]/components/toolbars/actionSets.tsx` (comment only)

**What changed.** Comment text ONLY; zero behavior/code change. Both files carried comments
asserting, in present tense, that Form dispatch works. Both were factually FALSE and would have
misled the phase-3/4 implementer.

- FormToolbar.tsx header: replaced the "HOW A FORM SELECTION IS REACHED (verified, not assumed)"
  block with an accurate UNREACHABLE / dormant status block stating both blockers.
- actionSets.tsx `form` entry: the "A form selection routes through `selectedElement` exactly like
  the `element` set" claim is now marked as the (currently unreachable) INTENDED wiring, not fact.

**The accurate mechanism — my original audit was INCOMPLETE.** I recorded `isTextEditing` /
`selectionPriority.ts:45-47` as the blocker. That is real but it is the SECOND, subordinate one.
The earlier and decisive blocker is a tagName short-circuit:

1. `form_note` / `form_heading` / `form_foot` never reach the key check. All three render via
   `InlineTextEditorV2` with `element={as}` = `h2`/`p` (`TechPremiumEditable.tsx:102-105`), and
   `data-element-key` sits on that tag. `determineElementType` (`useEditor.ts:182-189`) therefore
   matches the tagName branch (`h1..h6`,`p`,`span` → `'text'`) and RETURNS before
   `elementKey.includes('form')` at `:197` is evaluated. `'form'` is never produced.
2. Even if it were, `isTextEditing` outranks `form` (`selectionPriority.ts:45-47`).

Form dispatch is over-determined dead: either blocker alone suffices. The real fix is spec-sized —
a `<form>`-ancestor rule outranking the tagName text branch, PLUS a selection affordance (the real
`<input>`s carry no element key at all). `hoverTarget.ts:189` already labels these targets "Form",
a promise the click path never keeps.

**Deviations.** None. FormToolbar and the `actionSets['form']` entry were deliberately NOT deleted —
deletion is the standing recommendation but the founder rules on it at the gate.

**Tests.** `npx tsc --noEmit` → clean (exit 0). `npm run test:run` → 209 passed / 1 skipped (210
files); 3546 passed / 18 skipped. E2E not re-run: comment-only change, no runtime surface touched.

**Open risks.** Unchanged from phase 2. The dormant Form path remains dead code until the gate ruling.

Not committed — the orchestrator commits.

---

## Phase 3 — t4 LinkPicker: build, migrate all mounts, delete LinkTargetPopover + inert FormToolbar

**Headline: the migration half shipped in full and is parity-proven. The "enable Text/Button Link"
half is BLOCKED and did not ship** — not for effort, but because the plan's premise about where a
Text/Button link is stored is wrong (see BLOCKER). Both deletions landed. `tsc` proves nothing
dangles. **A ruling is needed before phase 4/5.**

### Files changed

- `src/components/editor/LinkPicker.tsx` (**new**) — the shared t4 picker.
- `src/components/editor/LinkPicker.test.tsx` (**new**) — emission-parity pin (11 tests).
- `src/components/editor/LinkTargetPopover.tsx` (**DELETED**).
- `src/app/edit/[token]/components/toolbars/FormToolbar.tsx` (**DELETED** — founder ruling 8).
- `src/app/edit/[token]/components/toolbars/actionSets.tsx` — `form` entry + import removed.
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx` — `link-action` disabled-title
  corrected (it had gone stale/false); no other change.
- The 14 mount files (15 mounts) — popover to LinkPicker:
  `meridian/{Header/MeridianNavHeader,Footer/HairlineFooter}`,
  `techpremium/{Header/TechPremiumNav,Footer/TechPremiumFooter}`,
  `surge/{Header/WarmNavHeader,Footer/ContactFooterRich}`, `hearth/Header/WarmNavHeader`,
  `lex/Header/LetterheadNav`, `lumen/Header/LumenNav`, `lumen/Footer/LumenFooter` (**2 mounts**),
  `{vestria,granth,atelier}/blocks/editPrimitives.tsx`, `skeletons/work/blocks/editPrimitives.tsx`.
- Comment/name-reference pass (**comment text only, zero behaviour**): `src/components/ui/popover.tsx`,
  `src/components/ui/README.md`, `src/modules/templates/README.md`, `src/utils/normalizeCtas.ts`,
  `src/modules/audience/product/parseCopy.ts`, `src/modules/templates/{granth,vestria}/blocks/primitives.ts`,
  `src/modules/templates/{granth,vestria}/index.ts`, `src/components/editor/SocialProfilesPanel.tsx`,
  `.claude/skills/manual-test/SKILL.md`.
- `e2e/link-picker.spec.ts` (**new**), `e2e/toolbar-dispatch.spec.ts` (Form note + stale
  `link-action` assertion), `playwright.config.ts` (register the new spec — the phase-1 trap).
- `docs/task/toolbar-standard-beta.audit.md` (this file).

**Published-side: clean.** `git diff --name-only` filtered for `.published.tsx` / `.core.tsx` /
`componentRegistry` / renderers -> **empty**. Tripwire `linkTargetPublished.test.tsx`
**byte-untouched, proven by blob hash** (`git rev-parse HEAD:<f>` == `git hash-object <f>` ==
`03fcf881e474f62478835faf5777dfee65389b09`) and green.

---

### BLOCKER — "enable Text/Button Link" cannot be built under this phase's constraints

Plan step 3 says: *"Enable the Link actions ... Persist via the elements' EXISTING write paths (verify
which field each element's link lands in — e.g. CTA `Link` value — and reuse the existing update
action; NO new store fields)."* I did that verification. **Neither element type has the field the
plan assumes.**

**Text — there is no link field at all, anywhere.**
- Exhaustive grep of every element schema (`audience/{product,service,writer}/elementSchema.ts`,
  `engines/workSections.ts`): the ONLY `href` keys are inside **collections** (`nav_items.href`,
  footer/card link lists) and `*_cta_href`. **No standalone text element has an href.**
  `text_link` / `textLink` / `link_href` = **zero hits in `src/`.**
- `TextToolbarMVP` has no Link action today (grep `link` -> 0 hits) — this is net-new, not a re-wire.
- The only mechanism available would be injecting an `<a>` into the element's saved HTML string
  (text is stored as HTML: `wrapElementContentWithStyles(targetElement.innerHTML, styles)`,
  TextToolbarMVP.tsx:295). That needs selection-range -> anchor-wrapping machinery that does not
  exist (`formatSelectedText` handles styles only, and lives in `src/utils/textFormatting.ts` —
  **not on this phase's Files-touched**). It would also discard `Link.source` (an `<a href>` is a
  string), i.e. break the very contract constraint 2 protects.
- **Latent trap if someone builds it anyway:** the published sanitizer's `STRICT_PROFILE`
  (`src/lib/htmlSanitizer.ts:14-33`) does **not** allow `<a>` or `href`. It is currently INERT —
  `sanitizeHtmlContent` is *imported by `src/app/api/publish/route.ts:9` and never called* — so an
  `<a>` would publish today by accident. The day that import is wired up (it looks like an
  oversight), every text link silently vanishes from published output while still showing in the
  editor. That is the exact editor-vs-published divergence this spec forbids.

**Button/CTA — the field exists, but it is NOT a `Link`.**
- A CTA's published href is resolved from `content[sectionId].elementMetadata[elementKey].buttonConfig`
  — a **`CtaButtonConfig`** (`resolveCtaHref.ts:18-27,56-77`), written **only** by
  `ButtonConfigurationModal`. Verified on the real published renderer:
  `MeridianNavHeader.published.tsx:41` -> `resolveCtaHref(md?.cta_text?.buttonConfig, forms, '#cta')`.
- `LinkPicker` emits `Link{dest, source}`. `destinationShim.toDestination` converts
  **buttonConfig -> Destination**; there is **no inverse**. Writing a Link into a CTA would need a
  net-new `Link -> CtaButtonConfig` mapping — and `CtaButtonConfig` cannot represent most dest kinds
  (`section` / `whatsapp` / `call` / `email` / `download` / `social` have no field), so it would be
  lossy, and it would **clobber `formId` / `behavior` / `inputConfig` / icons** on form-connected
  buttons.
- Writing a new per-element `Link` field instead is barred twice: constraint 7 (no new store fields)
  and the no-published-output rule (both renderers would have to read it).
- **The honest finding: "Button Settings" — already in this same toolbar, one button along — IS the
  link editor for buttons.** A t4 picker here would be a SECOND, lossier link UI for one field,
  which is the precise opposite of this phase's goal ("no parallel link UI left").

**Why I stopped rather than improvised.** Every route out needs a file outside the Files-touched list
(`textFormatting.ts`, `ButtonConfigurationModal.tsx`, `destinationShim.ts`) **or** a new store field
(forbidden) **or** a published-renderer read (forbidden). Out-of-scope need -> stop and report.

**What I did instead (in-scope, conservative).** `link-action`'s disabled title said *"Link picker
lands next phase"*. Phase 3 IS that phase, so after this commit the tooltip would be a **lie** and
the e2e test asserting it would have pinned the lie. Changed to **"Set this button's link in Button
Settings"** — true, and it points at the control that actually works. The e2e now asserts the
tooltip mentions Button Settings **and that `button-config` is present**, so the tooltip can't become
a dead end. The full rationale is a comment block at the `link-action` entry so the next implementer
doesn't rediscover this.

**Ruling needed:** (a) accept the tooltip-repoint and defer Text/Button Link to Final; (b) widen a
later phase to include `ButtonConfigurationModal`/`textFormatting` and reconcile the CTA link
contract with `Link` (spec-sized, own blast radius); or (c) **delete `link-action` entirely** — a
permanently-disabled button duplicating its neighbour is arguably the "dead buttons read as bugs"
(QA naayom C2) trap. **I did not choose (c)**: it would silently remove a Beta action the founder
signed off at the phase-2 gate. That is a founder call, not mine.

**Honesty-table correction for the founder:** the Text row ("Link (new, t4)") and the Button/CTA row
("Link/Action (new, t4, phase 3)") are **NOT delivered**. Link now joins Image in the deferred
column, for the *same root cause* the plan already identified for Image (ruling 5): no
published-consumed link field of the right shape exists. What genuinely lands is **the popover kill
plus one shared picker across all 15 mounts** — real consolidation, but no new user capability.

---

### What changed, per file

**`LinkPicker.tsx` (new).** t4 look: 284px card, "Link / Where should this go?" header, segmented
type control, DESTINATION field. Props are a compatible superset of the popover's; `SectionOption`
re-exported. `emitManual` / `emitDerived` / the mode-init and dual-read logic are carried over
**verbatim** — that is what makes the emission byte-identical.
- Uses the **ui-foundation `SegmentedControl` primitive** rather than a hand-rolled strip (the plan
  says t4 is built with ui-foundation primitives; that primitive's own test fixture is literally the
  link-picker type control). Gets the WAI-ARIA radiogroup + arrow-key roving for free.
- **No new-tab switch** (ruling 1) — asserted absent in e2e so a future hand can't quietly add one.
- **Deliberately NOT built: the handoff's Done / Cancel / Remove footer.** The popover emitted LIVE
  on every select/keystroke and all 15 mounts persist on that callback; a commit-on-Done model would
  change *when every one of them saves* — a behaviour change well outside "migrate the picker".
  "Remove" is unexpressible anyway: `Link` has no empty dest.
- **Deliberately NOT built: controlled `open`/`onOpenChange` + trigger-less mode.** The plan listed
  them for shell-mounted toolbar use — which is the BLOCKED half. Shipping unused API is the trap
  that produced the dead nav editors (ruling 3). It lands with its consumer.

**The 15 mounts.** Mechanical: import path + identifier. **Every call site's props and callback shape
are untouched** (`onChange={(link) => patchItem(id, {href: link})}`; editPrimitives'
`saveField(ctx, hrefKey, resolveDestination(link.dest))`). Diff is 2-8 lines/file, all of it the
rename + comment text.

**`actionSets.tsx`.** `form` entry + `FormToolbar` import removed. The replacement comment records
*why* Form is absent and the full over-determined-dead trace, so the next implementer doesn't
"helpfully" re-add an entry that cannot dispatch. `component` remains a module-level constant for all
4 remaining entries (invariant held).

**`showFormBuilder` — the crash fix is KEPT, untouched, as instructed.** Confirmed independent of
`FormToolbar`: its real caller is `ButtonConfigurationModal.tsx:486`.

**The local cast question — answered: it existed ONLY to serve the deleted FormToolbar, and it is
gone with it.** The cast was `FormToolbar.tsx:66`
(`storeApi.getState().showFormBuilder as (formId?: string) => void`) — deleted with the file.
`types/store/actions.ts:178` (`showFormBuilder: () => void`) is a **type declaration, not a cast**,
is **not on this phase's Files-touched**, and is **still required**: the kept impl
(`uiActions.ts:448`, `(formId?: string) => void`) is assignable to it, and the surviving 0-arg caller
(`ButtonConfigurationModal:486`) typechecks against it. **Nothing to remove; nothing dangles**
(`tsc` exit 0). One nit left alone: `uiActions.ts:447`'s comment "Callers that need the arg cast
locally" now has no such caller — `uiActions.ts` is not on my list, so I did not touch it.

---

### The differential parity test — how it was actually proven

Step 2 was executed as written. While `LinkTargetPopover` still existed, the test file carried BOTH
halves: 6 `GROUND TRUTH — LinkTargetPopover emits the SAME pinned payloads` tests and the LinkPicker
tests, **both asserting the same shared literal constants** (`EXPECT_SECTION`, `EXPECT_PAGE`,
`EXPECT_LEGAL`, `EXPECT_SOCIAL`, `EXPECT_EXTERNAL_URL`, `EXPECT_TEL_URL`). Green at 17/17 before any
deletion.

**Mutation-proven (this is the whole point of the design):** flipping `EXPECT_PAGE.source`
`'derived'` -> `'manual'` failed **both halves** —

```
x page pick -> source:"derived"          (LinkPicker half)
x page pick -> EXPECT_PAGE               (LinkTargetPopover ground-truth half)
Tests  2 failed | 15 passed (17)
```

=> the constants are pinned by the old component, not self-recorded. Restored -> 17/17.

Step 5 then deleted **only** the popover half. The constants and every LinkPicker assertion are
**byte-identical** to the version that ran green against the popover — nothing re-recorded. 11 tests
remain (6 emission + 4 dual-shape `string | Link` + 1 tab-set). The file header states this in
capitals so a future hand doesn't "fix" a failure by re-recording output.

There is no `@testing-library/react` in this repo — driven via `react-dom/client` + `React.act`, per
`segmented-control.test.tsx`.

---

### Decisions + Deviations

1. **BLOCKER above — Text/Button Link not shipped.** The single biggest deviation. Ruling needed.
2. **The plan says "14 mounts"; there are 15 across 14 FILES** (13x1 + LumenFooter x2). Verified by
   re-grep, as instructed. The plan's list of *files* was correct and complete — only the count noun
   was off. All 15 migrated.
3. **`e2e/link-picker.spec.ts` drives the picker from the meridian NAV, not the button toolbar**
   (the plan's step 7). Forced by the BLOCKER — the button toolbar has no picker to open. The nav is
   one of the 15 real migrated mounts, so this is direct coverage of what shipped, not a proxy.
4. **The plan's "assert the rendered edit-side anchor updates" is not observable and was replaced
   with something stronger.** In EDIT mode meridian renders a nav item as a `<span>` + inline editor;
   the `<a href>` is the **non-edit** branch (`MeridianNavHeader.tsx:133-165`). A naive
   `nav a[href=...]` assertion **fails** (it did — I wrote it first and it caught me). Replaced with
   the `edit-persistence.spec` pattern: assert a **`/api/saveDraft` POST whose body carries our
   href** (200), then **reload** and reassert through the reopened picker. The reload is what makes
   it non-vacuous — the picker's `urlDraft`/`mode` are local state that would otherwise echo our own
   input straight back.
5. **Derived-tab label: `'Link to page'` -> `'Page'`** (t4's segmented control wants short text
   labels). Cosmetic; the `'Link'` variant (when legal/social are present) is unchanged. Both label
   branches are pinned by tests.
6. **`link-action` tooltip repointed** rather than deleted — see BLOCKER, option (c) left to the
   founder.
7. **`linkTargetPublished.test.tsx:3`'s comment still says "written by the edit-mode
   LinkTargetPopover"** — now stale by one name. **Left deliberately: byte-untouched is the tripwire
   rule and it outranks comment tidiness.** Worth a one-line fix in a phase that is allowed to touch
   it.
8. **`playwright.config.ts` edited** to register `link-picker.spec.ts` in the `authed` project —
   pre-authorized by the orchestrator; without it the spec matches 0 tests (the phase-1 trap).

---

### Verification (pasted, real)

```
$ npx tsc --noEmit
TSC_EXIT=0                               (clean, no output — proves BOTH deletions dangle nothing)

$ npm run test:run
 Test Files  210 passed | 1 skipped (211)
      Tests  3557 passed | 18 skipped (3575)
```
3557 = phase-2's 3546 + the 11 new LinkPicker tests. `linkTargetPublished.test.tsx` green.

```
$ git rev-parse HEAD:src/modules/templates/linkTargetPublished.test.tsx
03fcf881e474f62478835faf5777dfee65389b09
$ git hash-object     src/modules/templates/linkTargetPublished.test.tsx
03fcf881e474f62478835faf5777dfee65389b09     => BYTE-UNTOUCHED

$ git diff --name-only | grep -E '\.published\.tsx|\.core\.tsx|componentRegistry|LandingPage.*Renderer'
(empty)                                      => zero published-side files
```

```
$ npx eslint src/components/editor/LinkPicker.tsx src/components/editor/LinkPicker.test.tsx \
             "src/app/edit/[token]/components/toolbars" e2e/link-picker.spec.ts
3 problems (0 errors, 3 warnings)
```
All 3 are the same pre-existing `react-hooks/exhaustive-deps` warnings phases 1-2 reported, on code I
did not author. No bare `useEditStore()` introduced.

```
$ npx playwright test e2e/link-picker.spec.ts e2e/toolbar-dispatch.spec.ts --list
Total: 13 tests in 3 files       (3 link-picker + 9 toolbar-dispatch + setup's `authenticate`)

$ E2E_PORT=3079 npx playwright test e2e/link-picker.spec.ts e2e/toolbar-dispatch.spec.ts
  ok  5 ... text target: one shell, format actions, no Ask AI (4.1s)
  ok  6 ... section target: one shell with the section action set (3.6s)
  ok  7 ... image target: reskin only — no Link action (6.2s)
  ok  8 ... button/CTA target: Beta action set with Link/Action disabled (4.0s)
  ok  9 ... button/CTA: Link/Action is disabled and points at the control that works (3.8s)
  ok 10 ... footer target: chrome-section set in the one shell, labelled "Footer" (3.7s)
  ok 11 ... Design menu renders disabled and inert (3.7s)
  ok 12 ... dropdown panels are not clipped by the chrome box (4.2s)
  ok 13 ... Esc dismisses the shell (4.7s)
  13 passed (2.1m)
```
(The 3 link-picker tests are numbered 2-4 in the same run and all passed; the tail shown above is the
toolbar-dispatch block.) Through the **REAL config** (both specs registered in `authed`).
`E2E_PORT=3079` only because 3000 is held by a sibling worktree — a first-class toggle, not a config
bypass. The interleaved `ReferenceError: window is not defined` lines are the same pre-existing
dev-mode SSR log noise from `useEditStoreBootstrap.ts:238` (logged, never thrown into a test).

**Anti-theatre — e2e mutation-proven, not asserted-and-hoped.** Suppressed `emitManual`'s `onChange`
in `LinkPicker.tsx` and re-ran:
```
ok 2 ... the t4 picker opens with the segmented type control (and NO new-tab switch) (16.9s)
x  3 ... choosing a section anchor persists the emitted Link to the server and survives reload (35.0s)
1 failed
```
Fails on mutation, passes when restored => the persistence assertion is real. (Test 4 "did not run" —
serial mode stops at the first failure. It exercises the **same** `emitManual` + armSave + reload
mechanism, so it is covered by construction, but it was **not independently mutation-proven**.)
Test 1 legitimately survives that mutation: it only asserts chrome/tabs, which the mutation doesn't
touch.

**A test caught me being wrong, twice** (recorded because it's evidence the specs bite): (1) I
expected the derived tab to read `'Link'` on meridian — a freshly seeded single-page project has no
privacy page and no social profiles, so it correctly reads `'Page'`; (2) the `nav a[href=...]`
assertion of deviation 4.

---

### What I did NOT verify (explicit list)

- **No manual dev check at all.** The plan's manual spot-check ("edit a nav item link on meridian +
  a CTA on atelier via the new picker") was **not** done by hand. Meridian's nav is covered by e2e;
  **atelier is not covered by anything** — it is `bespoke:true` / never served, and there is no seed
  for it. The `editPrimitives` mounts (atelier / vestria / granth / work-skeleton) are migrated and
  typecheck, but **no test renders any of them**. `tsc` + identical props is the entire net there.
- **t4 visual fidelity is unverified by eye.** Values transcribed from the handoff; nobody has looked
  at the picker rendered. The `SegmentedControl` is stretched full-width via an arbitrary
  `[&>button]:flex-1` override — plausible, unseen.
- **11 of the 15 mounts have no runtime coverage** — only meridian's nav is exercised e2e. The other
  nav/footer mounts differ only by props, but "differ only by props" is an argument, not a test.
- **The `Link` label branch of the segmented control is not covered e2e** (only in vitest) — no
  seeded project has legal/social options.
- **Nothing about Form was re-verified** — it is deleted, and it never rendered once in its life.
- **The `STRICT_PROFILE` / `sanitizeHtmlContent` dead-import finding is a code read, not a test.** I
  did not publish a page to confirm text HTML is unsanitized today. **It deserves its own ticket**
  (a security-shaped import that is wired to nothing).
- **Phase 1-2's open items remain open and are still nobody's verified truth**: toolbar local-state
  survival across shell re-renders, t2 visual fidelity by eye, the newly-reachable
  ButtonConfigurationModal -> "Create New Form" -> FormBuilder flow, the Button/CTA set on
  non-meridian templates, and the still-live `convertCTAToForm` crash (`uiActions.ts:489`, reachable
  via `MainContent.tsx:320`, needs its own ticket).

Not committed — the orchestrator commits.

---

## Phase 3.5 — greyed placeholders for deferred capabilities (founder ruling 9)

**STATUS: code complete, gate RED by ONE pre-existing test. Needs an orchestrator ruling before
commit — the fix requires `ToolbarShell.tsx`, which is NOT in this phase's Files touched.** See
"BLOCKER" below. Everything else is green and all 10 placeholder assertions pass.

### Files changed

- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `e2e/toolbar-dispatch.spec.ts`

Exactly the Files-touched list, no more (`git diff --name-only HEAD` pasted below). **Zero
published-side files.** Tripwire `linkTargetPublished.test.tsx` blob =
`03fcf881e474f62478835faf5777dfee65389b09` — byte-identical, verified after the final revert.

### What shipped — the five placeholders + exact tooltip copy

Every one is `disabled` + `aria-disabled` + `cursor-not-allowed` + muted `#5a5a66` (the phase-1
convention; **not** `text-gray-300`, which is brighter than enabled on the dark pill), carries a
required `data-action`, and has **ZERO functionality behind it** — each `handler` is a literal
`() => {}`. No store fields, no published reads, no new capability, no `trailing` abstraction.

| Toolbar | `data-action` | Label | Tooltip shipped (`disabledTitle`) |
|---|---|---|---|
| Text | `link` | Link | `Text links are coming — the text schema has no link field yet.` |
| Button/CTA | `style` | Style | `Button styles are coming with the design system.` |
| Image | `image-link` | Link | `Image links are coming — images have no link field yet.` |
| Section (all, incl. header/footer) | `background` | Background | `Section backgrounds are coming with the design system.` |
| Footer ONLY | `manage-links` | Manage links | `Footer link editing is coming — footer links aren't in the editor store yet.` |

Placement follows toolbarPlan's Beta column order in each element's own action row (Text: after
colour, before the sparkle; Button: after `link-action`, before `button-config`; Image: after Edit,
before Delete; Section: last; Footer: `manage links · background`). Icons are the natural lucide
glyphs — no "disabled" icon invented; greying is carried by colour + cursor + `aria-disabled`.

### Per-file detail

**`TextToolbarMVP.tsx`** — added the `link` placeholder + a local `LinkIcon`. Nothing else touched.

**`ElementToolbar.tsx`** — added `style` as a **separate, disabled button** gated on the existing
`canConvertToForm()` (no new gating semantics). **`button-config` was NOT touched or renamed** —
constraint 4 honoured, and the e2e now pins it (`toBeEnabled()` + `toContainText('Button Settings')`)
so a future relabel fails the suite. The pre-existing map already handled `disabled`/`disabledTitle`.

**`ImageToolbar.tsx`** — added the `image-link` placeholder. **Required a real fix:** this file's
action map **ignored `disabled` entirely** (it only ever had enabled actions), so a placeholder would
have rendered LIVE and clickable. Added the `disabled`/`disabledTitle` pass-through + an early-return
guard, mirroring ElementToolbar's existing shape. This is presentation-only; no existing action's
behaviour changes (all four remain `disabled: undefined` → falsy → identical).

**`SectionToolbar.tsx`** — added `background` (all sections) + `manage-links` (footer only), a local
`isFooterId()` helper, and the `link` glyph to `ActionIcon` (its map had `palette` but no `link`; the
fallback renders a **grey square**, which would read as a rendering bug rather than a "coming" state).
Two render-path fixes: the map now honours an explicit `disabledTitle` (falling back to `action.label`
to **preserve the pre-existing move-up/move-down disabled tooltips** verbatim), and disabled actions
early-return.

### Decisions + Deviations

1. **`isFooterId`, not `isChromeId`, for `manage-links` (constraint 11).** `isChromeId` is true for the
   **header** too, whose Beta column is Menu — deferred ENTIRELY per ruling 9 (nowhere to grey). Kept as
   its own filter rather than folded into `CHROME_HIDDEN_ACTIONS`, which is the *inverse* gate (hide ON
   chrome) and is load-bearing for the header. **Mutation-proven** (below) + a new `header target` e2e.
2. **`background` is deliberately NOT filtered off chrome sections.** toolbarPlan's Footer Beta column is
   `manage links · background`, so the footer needs it; the header getting it too is the conservative
   read (it is a *Section* placeholder, and D-1's blocker is template-wide, not chrome-specific).
3. **Image action id = `image-link`, not the plan's literal `link` (deviation).** In-scope judgment call.
   The plan's step-1 bullet says "Image → `link`", but (a) this file's id convention is `<verb>-image`
   (`replace-image`/`edit-image`/`delete-image`), and (b) phase 3's e2e already asserted
   `not.toContain('image-link')` — using `link` would have left that pre-existing assertion **orphaned
   and vacuously green** (the exact theatre this phase's own instructions warn about). Flipping the
   existing assertion to `toContain('image-link')` keeps it load-bearing. Text keeps the plain `link`
   (no competing convention there). Ids are per-toolbar so there is no collision either way.
4. **Form + Menu: nothing added.** Constraint 5 honoured — neither dispatches a toolbar, so there is
   nowhere to grey. `FormToolbar` stays deleted; I did not resurrect it. Social `orientation` left for
   phase 4. Design ▾ / `link-action` not duplicated.

### Verification (pasted, real)

`npx tsc --noEmit` → **clean, zero output.**

`npm run test:run`:
```
 Test Files  210 passed | 1 skipped (211)
      Tests  3557 passed | 18 skipped (3575)
```
3557 = phase 3's exact count — no vitest regression (these are edit-side toolbars; the unit suite does
not render them, which is why the e2e below is the real net).

`npx eslint 'src/app/edit/[token]/components/toolbars' e2e/toolbar-dispatch.spec.ts` →
**0 errors, 3 warnings**, all pre-existing `react-hooks/exhaustive-deps` on code I did not author.
No bare `useEditStore()` introduced (the ESLint ban would have errored).

Diff scope + published tripwire:
```
$ git diff --name-only HEAD
e2e/toolbar-dispatch.spec.ts
src/app/edit/[token]/components/toolbars/ElementToolbar.tsx
src/app/edit/[token]/components/toolbars/ImageToolbar.tsx
src/app/edit/[token]/components/toolbars/SectionToolbar.tsx
src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx

$ git diff --name-only HEAD | grep -E "\.published\.tsx|\.core\.tsx|componentRegistry|PublishedRenderer"
(none)

$ git hash-object src/modules/templates/linkTargetPublished.test.tsx
03fcf881e474f62478835faf5777dfee65389b09   <- expected, byte-untouched
```

`E2E_PORT=3099 npx playwright test e2e/toolbar-dispatch.spec.ts` (**real config** — both specs were
already registered in the `authed` project; no config change needed this phase):
```
OK   2 text target: one shell, format actions, no Ask AI (16.4s)
OK   3 text: Link is a greyed placeholder (no text link field exists) (4.5s)
OK   4 section target: one shell with the section action set (4.0s)
OK   5 image target: reskin + greyed Link placeholder (7.1s)
OK   6 button/CTA target: Beta action set with Link/Action disabled (4.0s)
OK   7 button/CTA: Style is a greyed placeholder, distinct from Button Settings (3.8s)
OK   8 button/CTA: Link/Action is disabled and points at the control that works (3.6s)
OK   9 footer target: chrome-section set in the one shell, labelled "Footer" (3.7s)
OK  10 header target: no manage-links leak, chrome gating intact (3.7s)
FAIL 11 Design ▾ renders disabled and inert (8.8s)      <- PRE-EXISTING TEST, see BLOCKER
1 failed / 2 did not run / 10 passed
```
All four set-equality (`toEqual` on sorted ids) assertions were updated to include the new ids, and
**four `not.toContain(...)` assertions were flipped to `toContain(...)`** (section `background`,
image `image-link`, footer `manage-links` + `background`) — each marked in-file as a ruling-9 reversal
with the note that the *capability* verdict did not change.

### Mutation proof (two, both real)

**1 — inertness is really carried by `disabled`.** `ElementToolbar` `style`: `disabled: true` -> `false`:
```
FAIL button/CTA: Style is a greyed placeholder, distinct from Button Settings
  Error: placeholder "style" is not disabled
  expect(locator).toBeDisabled() failed
  > 88 | await expect(btn, `placeholder "${action}" is not disabled`).toBeDisabled();
```
**2 — the footer-leak guard is really `isFooterId`.** `SectionToolbar` filter `isFooterId` -> `isChromeId`:
```
FAIL header target: no manage-links leak, chrome gating intact
  Error: manage-links is FOOTER-only — it leaked onto the header
  > 388 | expect(ids, 'manage-links is FOOTER-only — it leaked onto the header').not.toContain(
```
Both reverted; `grep -rn "MUTATION TEST|BISECT"` -> clean; tsc re-run green; tripwire hash re-verified.

### BLOCKER — `Design ▾ renders disabled and inert` now fails, and the fix is OUT OF SCOPE

**This is a real behaviour regression caused by this phase, not a flaky test — and NOT one I can fix
inside my Files-touched list.**

**Proven by bisect, not guessed.** `git stash` -> the test **passes** on clean HEAD; restore -> **fails**.
Removing *only* the Text `link` button -> **passes** again. So the Text placeholder is the trigger.

**Root cause, from instrumented event capture** (temporary diagnostics, since removed). Force-clicking
the disabled `design-menu` while text-editing, WITHOUT the Link button (passing):
```
pointerdown -> tgt=SPAN(inShell)  active=H1
focusout    -> tgt=H1  rel=DIV  guardMatch=false
SHELL AFTER = 1
```
WITH the Link button (failing):
```
pointerdown -> tgt=SPAN(inShell)  active=H1
focusout    -> tgt=H1  rel=DIV  guardMatch=false     <- IDENTICAL up to here
click       -> tgt=MAIN(outsideShell)                <- EXTRA EVENT
focusout    -> tgt=DIV
SHELL AFTER = 0
```
The mechanism: `design-menu` lives in the **shell**, *outside* the text body's `onMouseDown`
`preventDefault` guard, so pressing it **blurs the contenteditable H1 in both cases** — that blur
re-renders/moves the toolbar mid-gesture. The pill is ~74px wider with Link (`w=569` vs `w=495`;
`design-menu` centre `cx=781` vs `cx=744`), so after the reflow the pending `click` at the original
coordinates **lands on `MAIN` instead of the disabled button** -> floating-ui `useDismiss`
`outsidePress` fires -> shell dismissed. Without Link the coords still land on the disabled button,
whose click event Chromium suppresses -> no outside press -> shell survives.

**So the phase-1 test was passing by coordinate luck, and Design ▾ was never genuinely inert while
text-editing** — pressing it has always blurred the editor. My wider pill only exposed it.

**Minimal correct fix (NOT applied):** `onMouseDown={e => e.preventDefault()}` on the shell's chrome
container in **`ToolbarShell.tsx`** — clicking any shell chrome would then never steal focus from the
contenteditable, making Design ▾ (and the phase-5 Ask AI slot) genuinely inert and killing the
coordinate fragility for good. `ToolbarShell.tsx` is **not in Phase 3.5's Files touched**, so per the
hard rules I stopped rather than edit it.

**Options for the orchestrator:** (a) authorise the one-line `ToolbarShell.tsx` fix as a scope
amendment (my recommendation — it fixes a real latent bug, is presentation-only, and has phase-1
precedent for amending a file when the gate demands it); (b) hand it to a follow-up phase and accept a
red gate now; (c) shrink the Text Link button to icon-only so the coords land back on the button — I
recommend **against** this: it restores luck, not correctness, and is exactly the "route around the
failure" the phase instructions forbid.

### What I did NOT verify (explicit list)

- **No manual dev check.** No placeholder has been seen by a human; t2 visual fidelity of five new
  greyed buttons (especially the pill now being ~15% wider on text) is **unverified by eye**.
- **The widened pill's real-world effect is untested beyond this one test.** The Design ▾ failure is
  evidence the extra width has knock-on effects; narrow viewports / long element-key labels /
  `shift(crossAxis)` behaviour are unexamined.
- **Tooltip copy is unvalidated by the founder** — I shipped the plan's suggested copy, tuned for
  length/honesty (Footer's gained a "why"; Image/Text reworded to name the missing field).
- Placeholders verified on **meridian** (text/button/section/footer/header) and **hearth** (image)
  only — no other template.
- Only the **e2e** covers these; no vitest unit test renders these toolbars.
- I did **not** verify the `background` placeholder on every section type — only hero-ish body,
  header, footer.
- I did **not** re-run the full `npm run build` or `link-picker.spec.ts` (untouched this phase).

Not committed — the orchestrator commits.

---

## Phase 3.5 — BLOCKER ESCALATION: the authorized fix cannot work (ToolbarShell reverted)

**Files changed by this attempt: NONE.** `ToolbarShell.tsx` was authorized, tried, proven wrong,
and **reverted to HEAD**. The only surviving edit is the focus-retention assertion added to
`e2e/toolbar-dispatch.spec.ts` (already in Files-touched). Everything else from phase 3.5 stands.

### The ruling's premise is falsified

The ruling authorized `onMouseDown={e => e.preventDefault()}` on the shell's chrome container. I
applied it. **It changes nothing**, because the premise — that the mousedown reaches the chrome and
its default action blurs the contenteditable — is not what happens.

Instrumented capture-phase event log (`document.addEventListener(..., true)`), pressing Design ▾
while text-editing, WITH the authorized one-liner in place:

```
focusout  target=H1            active=BODY    <-- focus already gone
mouseup   target=DIV           active=DIV
click     target=MAIN          active=DIV     <-- outsidePress -> shell dismissed
focusout  target=DIV           active=BODY
```

**There is no `mousedown` event at all.** Chromium does not dispatch mouse events on `disabled`
form controls, and the event is not retargeted to an ancestor — it is simply never dispatched.
`design-menu` is a real `<button disabled>` (`toBeDisabled()` passes). Chromium still performs the
default focus-clearing. So **no handler on any ancestor can `preventDefault` an event that is never
dispatched**. The authorized one-liner is dead code for its stated purpose.

### It is not merely inert — it is actively harmful

With the one-liner in place, `link-picker.spec.ts:150` ("a custom external URL persists to the
server and survives reload") **FAILED**. Reverting ToolbarShell alone makes it **pass** (verified in
isolation: `2 passed`). Cause is exactly constraint 2's warning: `LinkPicker`
(`src/components/editor/LinkPicker.tsx:41,141`) renders a focusable `<Input>`, and the picker panel
is an `absolute top-full` **sibling of the text body inside the chrome box** — so its mousedown
bubbles to the chrome div (TextToolbarMVP's own `stopPropagation` only covers its inner div, not
the panel). The chrome-level `preventDefault` suppressed focus transfer into the URL field.
So the authorized fix trades a broken Design ▾ for a broken Link picker.

### What actually works (NOT applied — needs a ruling)

The mousedown must first be made to *exist*. Making the disabled button transparent to hit-testing
(`[&_button:disabled]:pointer-events-none` on the chrome) + the `preventDefault` gives:

```
mousedown target=DIV[CHROME]   active=H1
mouseup   target=DIV[CHROME]   active=H1
click     target=DIV[CHROME]   active=H1      <-- focus retained, toolbar never moves
```

Both halves are load-bearing (pointer-events alone → mousedown lands on a non-focusable div →
still blurs). But this is **two coupled changes, not the authorized one-liner**, and it carries
costs I am not authorized to accept:
1. `pointer-events:none` kills the **native `title` tooltip** on every greyed placeholder — the
   `disabledTitle` that constraint 4 makes *mandatory* stops reaching users (the attribute stays,
   so the assertions stay green — the tests would not catch this).
2. It still needs the `preventDefault` scoped to avoid the LinkPicker input.

The clean fix (render `aria-disabled` + inert handler instead of native `disabled`, so the button
receives its own mousedown and keeps its tooltip) lives in **`ToolbarButton.tsx` — NOT in
Files-touched**. Hence: stop and report, per the out-of-scope rule.

### Durable lesson: the phase-1 Design ▾ inertness test was passing on coordinate luck

Recorded plainly, because it is the reusable part. `Design ▾ renders disabled and inert` never
verified inertness. Pressing Design ▾ has **always** blurred the contenteditable and moved the
toolbar mid-gesture; the trailing click then landed wherever the pill used to be, which happened to
be the disabled button — whose click Chromium suppresses. The assertion passed for a reason
unrelated to what it claimed. Widening the pill 495→569px (phase 3.5's Link placeholder) moved that
stray click onto `<main>` → floating-ui `outsidePress` → dismissal → red. **Phase 3.5 exposed a
real latent bug; it did not cause one.** Geometry-dependent assertions can be green for years while
the invariant they name is false.

### Test results (this attempt)

- `npx tsc --noEmit` — **PASS** (exit 0), with the one-liner applied.
- `npm run test:run` — **PASS**: 210 files / 3557 tests, 1 file + 18 tests skipped.
- `E2E_PORT=3111 npx playwright test e2e/toolbar-dispatch.spec.ts e2e/link-picker.spec.ts` — **2 FAILED**
  (`Design ▾ renders disabled and inert`; `link-picker.spec.ts:150`), 12 passed, 2 did not run.
- `link-picker.spec.ts:150` with ToolbarShell reverted — **PASS** (proves the regression was mine).

### Spec change kept

`e2e/toolbar-dispatch.spec.ts` — the Design ▾ test now asserts **focus retention** (the
contenteditable is still focused after pressing Design ▾), with the mechanism written up in-place so
the luck cannot silently return. **This assertion is currently RED** — it is pinning the real,
pre-existing bug. It goes green only once a genuine fix lands.

### Status: BLOCKED — gate is RED, nothing committed

Mutation proofs (the `style` disabled flip, the footer `isFooterId→isChromeId` leak) were NOT
re-run: the tree no longer contains the fix they would be validating. They stand from the original
phase 3.5 run. Awaiting a ruling on whether `ToolbarButton.tsx` may be added to Files-touched.

---

## Phase 3.5 — RESOLUTION (orchestrator ruling: option 1, `aria-disabled` + inert handlers)

**STATUS: GREEN. Gate passes. Not committed (orchestrator commits).**

### Files changed (this attempt — complete list)

- `src/app/edit/[token]/components/toolbars/ToolbarButton.tsx` — **ADDED to Files-touched by ruling**
- `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`
- `src/app/edit/[token]/components/toolbars/ElementToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `e2e/toolbar-dispatch.spec.ts`
- `docs/task/toolbar-standard-beta.audit.md`

`ToolbarShell.tsx` is **reverted to HEAD and absent from the diff**, per the ruling. Zero
published-side files. Tripwire `linkTargetPublished.test.tsx` blob =
`03fcf881e474f62478835faf5777dfee65389b09` — byte-identical, re-verified after the final revert.

`e2e/link-picker.spec.ts` needed **NO change**: its only `disabled` reference is
`option:not([disabled])` on a `<select>` (line 131), which is not a ToolbarButton. It is listed in
the ruling as possibly-affected; it was not.

### The withdrawn ruling, and why it was wrong

The orchestrator's original option (a) — a `mousedown`+`preventDefault` on the **chrome** in
`ToolbarShell.tsx` — was withdrawn on instrumented evidence:

1. **It could not have worked.** Chromium dispatches **no pointer events at all** on a natively
   `disabled` control. Design was `disabled`, so no `mousedown` ever reached the chrome handler and
   the `preventDefault` was dead code.
2. **It caused a real regression.** A chrome-level handler also swallowed focus into the LinkPicker's
   `<Input>` — the picker panel is an `absolute top-full` **sibling inside the chrome**, so it was in
   the handler's subtree. That broke `link-picker.spec.ts:150`.

### Why `aria-disabled` + inert handlers is the right shape

A natively-disabled button is a black hole: it is **not mouse-dispatching**, **not keyboard-focusable**,
and **not reliably tooltipped**. All three matter here, and `aria-disabled` preserves all three:

- **Tooltip** — founder ruling 9 makes the "why" tooltip the *entire* mitigation for shipping greyed
  buttons (naayom C2: dead buttons read as bugs). This is exactly why **option 2 (`pointer-events:none`)
  was rejected**: it keeps assertions green while silently killing the `title` on every placeholder.
- **Focus retention** — the button now fires its own `mousedown`, so `preventDefault` there genuinely
  keeps the contenteditable's selection alive. Scoped to the button so it cannot touch the LinkPicker
  `<Input>` (different component, different subtree). This is the fix the chrome-level version only
  pretended to be.
- **Announcement** — stays in the tab order, announced as unavailable rather than skipped.

Inertness is carried by the `onClick` guard (Enter/Space route through `click`, so keyboard is covered
by the same guard). **ONE convention only** — no ToolbarButton anywhere carries native `disabled` now.

Handlers are **composed, not replaced**: `onClick`/`onMouseDown` are destructured out of props so a
consumer-supplied handler cannot land in `...rest` and clobber the guard. `TextToolbarMVP` passes its
own `onMouseDown`, which would have silently overridden it.

### Blast-radius verification (every disabled ToolbarButton consumer)

`BlogRichTextEditor.tsx` matched a `ToolbarButton` grep but is **NOT** blast radius: it declares its
own private `function ToolbarButton` (line 23) and imports nothing from ours. Real consumers are the
4 toolbars + the shell:

| Disabled button | Kind | Consumer-side guard? | Inert because |
|---|---|---|---|
| ToolbarShell `design-menu` | placeholder | n/a — no `onClick` at all | nothing behind it |
| TextToolbarMVP `link` | placeholder | n/a — no `onClick` | nothing behind it |
| ElementToolbar `link-action`, `style` | placeholder | yes (`actionDisabled` early-return) | consumer guard |
| ImageToolbar `image-link` | placeholder | yes | consumer guard |
| SectionToolbar `background`, `manage-links` | placeholder | yes | consumer guard |
| SectionToolbar `move-up` / `move-down` | **pre-existing** | yes | consumer guard |
| ElementToolbar `regen` (`regenLocaleLocked`) | **pre-existing** | yes | consumer guard |
| TextToolbarMVP sparkle (`isGenerating` / `regenLocaleLocked`) | **pre-existing** | **NO — fixed here** | see below |

**The one genuine exposure my change created**, and the deviation taken to close it:

> `TextToolbarMVP`'s sparkle was `onClick={handleSparkle}` with **no consumer-side guard** — native
> `disabled` had been protecting `handleSparkle` for free. Removing native `disabled` left it relying
> *solely* on ToolbarButton's guard. I added a consumer-side guard matching the other three toolbars'
> convention. A double-fired regen (mid-generation) or a silent no-op regen (non-default locale) is a
> real bug, not a placeholder no-op. Logged under Deviations.

### Mutation proofs — all four re-run

| # | Mutation | Result |
|---|---|---|
| (i) | `style` `disabled: true` to `false` | **FAILS correctly** — `Error: placeholder "style" is not aria-disabled` |
| (ii) | footer `isFooterId` to `isChromeId` | **FAILS correctly** — `manage-links is FOOTER-only — it leaked onto the header`; received `["add-element","background","design-menu","manage-links"]` |
| (iii) | remove ToolbarButton's `preventDefault` | **FAILS correctly** — `focus left the contenteditable at "mouseup" (saw BUTTON)` |
| (iv) | remove ToolbarButton's `onClick` disabled guard | **DID NOT FAIL — see below. This is a real finding, not a pass.** |

**Mutation (iii) validated the instrumentation design.** Trace with the mutation applied:
`[{mousedown,H1},{mouseup,BUTTON},{click,BUTTON}]`. Note `mousedown` reads **H1 in both worlds** —
native focus transfer happens *after* mousedown dispatch. An endpoint- or mousedown-only assertion
could not have discriminated; `mouseup`/`click` are where a lost `preventDefault` shows up. That is
why the full-gesture trace is the assertion, and why it stays in the spec permanently.

Passing trace (fix in place): `[{mousedown,H1},{mouseup,H1},{click,H1}]`.

### Mutation (iv) does NOT fail — honest accounting

Removing ToolbarButton's `onClick` guard leaves **all 13 toolbar-dispatch tests green**. This is not a
test I can honestly call a proof. The reason is structural, and it is the same class of problem as the
phase-1 luck this run has been chasing:

- Every **placeholder** has `handler: () => {}` — literally nothing behind it. Inertness is
  over-determined; nothing observable changes when the guard is removed.
- Every other **reachable** disabled button has its **own** consumer-side guard (table above), so
  ToolbarButton's guard is defence-in-depth, not the load-bearing member.
- The one button that *did* depend solely on it (the sparkle) now has a consumer guard too.

**The pre-existing disabled states are unreachable in the e2e seed** — verified, not assumed:
`sections` is always `[header, ...body, footer]` (`pageHelpers.ts:91-99`), so `sectionIndex === 0` is
*always* the header and `sections.length - 1` is *always* the footer — and `CHROME_HIDDEN_ACTIONS`
hides `move-up`/`move-down` on both. **Those two disabled states can never render in this seed.**
`regenLocaleLocked` requires a non-null `localeConfig`, which the meridian seed has none of.

So the orchestrator's instruction — "prove inertness for at least one pre-existing case" — **could not
be satisfied within Files-touched**. Making it provable needs one of:
- **(A)** a Vitest component test for `ToolbarButton` (mount disabled + `onClick` spy, assert not
  called). Cleanest, directly falsifies mutation (iv) — but it is a **new file**, out of scope.
- **(B)** a `localeConfig` in `e2e/helpers/seedDraft.ts` to make `regenLocaleLocked` reachable — that
  file is **not** in Files-touched.

Per the hard rules (out-of-scope file means stop and report) I did **neither** and am reporting instead.
**Open risk:** ToolbarButton's inertness guard is currently unfalsified by any test. The code is
correct and every consumer is independently guarded, so nothing ships broken — but a future edit that
removes the guard *and* a consumer's guard together would not be caught.

### Deviations from the ruling

1. **Added a consumer-side guard to TextToolbarMVP's sparkle** (in Files-touched). Not requested. My
   change created the exposure (native `disabled` had been the only thing protecting `handleSparkle`);
   guarding it completes my own change rather than extending scope. Conservative option per the
   in-scope-ambiguity rule.
2. **`onMouseDown` is still forwarded to the consumer when disabled** (only `onClick` is suppressed).
   Every consumer `mousedown` in this codebase is focus-retention / `stopPropagation`, never an action;
   dropping it would have silently discarded TextToolbarMVP's `stopPropagation`. Actions live in
   `onClick`, which is where the guard sits.
3. **`e2e/link-picker.spec.ts` not modified** — no affected assertion existed (see above).

### Test results

- `npx tsc --noEmit` — **PASS** (exit 0).
- `npm run test:run` — **PASS**: 210 files / 3557 tests (1 file + 18 tests skipped).
- `E2E_PORT=3491 npx playwright test e2e/toolbar-dispatch.spec.ts e2e/link-picker.spec.ts` —
  **PASS, 16/16**, including `link-picker.spec.ts:150` (the regression the withdrawn one-liner caused
  is gone) and the focus-retention assertion passing *for the right reason* (trace pasted above).

**Flake noted (not a regression):** across ~9 suite runs, `link-picker.spec.ts:150` intermittently hit
a 180s `locator.click` timeout in *combined* runs. Attribution checked rather than assumed:
`LinkPicker.tsx` contains no `ToolbarButton` and no `aria-disabled`; tests 82/123 exercise the same
picker and always pass; the test passes **3/3 in isolation** (8.1s/8.1s/9.1s) and the failures are
**monotonic with accumulated load** (early combined runs green, later ones red, identical code), with a
final clean combined run **16/16 green**. Cause is dev-server/process accumulation across repeated
runs, not the diff.

### The durable lesson

**The phase-1 Design inertness test passed on coordinate luck.** Pressing Design genuinely blurred
the contenteditable: selection collapsed, the toolbar re-anchored and *moved mid-gesture*, and the
trailing click landed wherever the pill used to be — which happened to still be the disabled button,
whose click Chromium suppresses. The test asserted "Design is inert" and was green for the entire
life of the phase while the invariant it names was **false**. Widening the pill by one slot moved the
coordinates onto `<main>` and floating-ui tore the shell down — that is the only reason anyone found out.

**Geometry-dependent assertions can sit green for years while the invariant they name is false.** Two
corollaries this run also earned:
- *Assert the mechanism, not the endpoints.* `mousedown` alone reads identical in the fixed and broken
  worlds; only the full gesture trace discriminates (mutation iii).
- *A mutation that refuses to fail is data, not a pass.* Mutation (iv) staying green is what exposed
  that the guard is untested and that the pre-existing disabled states are unreachable — neither of
  which any green run would ever have told us.

---

## Phase 3.5 — final step: close the unfalsified-guard hole (orchestrator ruling: option A)

### Files changed

- `src/app/edit/[token]/components/toolbars/ToolbarButton.test.tsx` — **NEW** (added to Phase 3.5's
  Files-touched by orchestrator ruling). Test-only; **no behaviour change**.

Everything else from Phase 3.5 is unchanged and retained. `ToolbarShell.tsx` remains reverted to HEAD
and was **not** touched. No published-side edits.

### Why this is a unit test and NOT more e2e seed

**Record this plainly so nobody later "fixes" it by bloating the e2e seed:**

Mutation (iv) — *remove `ToolbarButton`'s `onClick` disabled guard* — refused to fail under
`e2e/toolbar-dispatch.spec.ts`. That is not because the guard works; it is because **every
pre-existing disabled state is structurally unreachable in the e2e seed**:

- `e2e/helpers/pageHelpers.ts:91-99` always seeds `sections = [header, ...body, footer]`. So
  `sectionIndex === 0` is **always** the header and `length - 1` is **always** the footer, and
  `CHROME_HIDDEN_ACTIONS` hides move-up/move-down on both. The disabled move buttons therefore never
  render for any selectable section — the e2e can't reach them **by construction**, not by omission.
- The remaining real disables (regen-locale-lock, sparkle mid-generation) need `localeConfig` / an
  in-flight generation the seed doesn't produce.

Option A (unit test) was chosen over option B (seed `localeConfig`) because it pins the **primitive's**
contract directly, runs in ms, needs no dev server or seed, and doesn't entangle the e2e seed with an
unrelated concern. **The unit level is the only level at which this guard is falsifiable at all.**

**Mutation (iv) is now satisfied — at the unit level.**

### The test (8 cases, repo convention: `react-dom/client` + `act`, no @testing-library)

Written to falsify, not to decorate. Each case names a specific way the contract could rot:

1. **the guard** — `disabled` + `vi.fn()` handler, real click ⇒ handler NOT called. *(= mutation iv)*
2. **the enabled control** — `disabled: false` ⇒ handler called exactly once. Without this, deleting
   `onClick?.(e)` outright would still pass #1: a guard that fires nothing is vacuously green.
3. `aria-disabled="true"` when disabled, absent/false when enabled.
4. `title` = `disabledTitle` when disabled — founder ruling 9's mandatory "why" tooltip (naayom C2:
   dead buttons read as bugs), pinned so a refactor can't silently drop the reason.
5. **NOT natively disabled** when `disabled: true` — pins the whole point of the aria-disabled pattern.
6. `data-action` renders (the e2e hook).
7. + 8. `onMouseDown` preventDefault when disabled / not when enabled (focus retention). **jsdom handled
   this fine — not skipped.**

### Mutation proofs (real output)

**Mutation A — remove the `onClick` disabled guard (= mutation iv):**
```
 × does NOT call onClick when disabled
   AssertionError: expected "spy" to not be called at all, but actually been called 1 times
   Number of calls: 1
 ❯ ToolbarButton.test.tsx:68  expect(onClick).not.toHaveBeenCalled()
 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
```
Kills exactly #1, and only #1. Reverted.

**Mutation B — reinstate native `disabled`:**
```
 × is NOT natively disabled when disabled=true   AssertionError: expected true to be false
 × preventDefaults mousedown when disabled       AssertionError: expected false to be true
 Test Files  1 failed (1)
      Tests  2 failed | 6 passed (8)
```
Kills #5 **and** #7. #7's failure is itself the empirical proof of the doc comment's claim 2: a
natively-disabled button never fires `mousedown`, so the focus-retention `preventDefault` silently
becomes a no-op. The reasoning behind the pattern is now pinned by a test, not just asserted in a
comment. Reverted.

Both mutations reverted; suite green.

### Verification

- `npx tsc --noEmit` → **exit 0, clean.**
- `npm run test:run` → **Test Files 211 passed | 1 skipped (212); Tests 3565 passed | 18 skipped
  (3583).** 3565 = 3557 baseline + 8 new cases, as predicted. No regressions.
- **Playwright NOT re-run — deliberate and correct: this change is test-only** (one new Vitest file),
  no source or e2e file was modified, so no Playwright behaviour can have changed.
- Tripwire `03fcf881e474f62478835faf5777dfee65389b09` = `src/modules/templates/linkTargetPublished.test.tsx`;
  blob hash in the working index is **identical to HEAD ⇒ byte-untouched**, and it passes within the 3565. Green.
- Diff scope confirmed = Phase 3.5 Files-touched + `ToolbarButton.tsx` + `ToolbarButton.test.tsx`,
  **minus `ToolbarShell.tsx`**. (`uiFoundationIsolation.test.tsx.snap` shows `M` in `git status` but its
  blob hash equals HEAD's — CRLF stat-dirty only, content unchanged.)

### Deviations

None. Scope was exactly the authorized new test file.

Deviation #1 from the previous 3.5 attempt (the `TextToolbarMVP` sparkle consumer guard) is retained
per ruling — native `disabled` had been protecting it for free, so dropping it without a guard would
allow a double-fired regen mid-generation (a real bug, not a hypothetical).

### Disclosure — `link-picker.spec.ts:150` flake (unchanged, still open)

Not introduced by this step and not fixed by it. Attribution work done: **passes 3/3 in isolation**;
failures are **monotonic with dev-server load**; `LinkPicker.tsx` contains **no `ToolbarButton` and no
`aria-disabled`**, so it is out of this phase's causal reach. Recorded as a load-sensitive flake, not
a regression — flagged rather than silently retried.
