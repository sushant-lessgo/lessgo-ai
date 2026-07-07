# Edit-Page QA — Naayom (live lessgo.ai)

**Date:** 2026-07-07 · **Env:** production `lessgo.ai` · **Audience/template:** product / TechPremium · Forest · Default
**Method:** Created a fresh Naayom page through dashboard onboarding, then edited it as a real user in `/edit/[token]`, previewed, and cross-checked the DOM/content model + autosave via reload.
**Project:** `https://lessgo.ai/edit/Tck5HqdkIoHG` (throwaway QA page).
**Coverage:** 40 scenarios executed (round 1: 35 editor scenarios; round 2: the 5 previously-not-run — Add page, image upload, Regen Copy, element/section regenerate, Publish + live-page verification).

## Scoreboard
- ✅ PASS: 28  ·  🔴 FAIL: 10  ·  🟡 PARTIAL/SUSPECT: 5
- **Ship-blockers:** (1) **published live page white-screens** (React #31 crash); (2) rich-text formatting (color + underline) corrupts copy and can propagate to the crash above; (3) hero-CTA Delete & Duplicate are no-ops; (4) "Reset Everything" doesn't revert; (5) Undo/Redo dead.
- **The publish crash is the most serious finding of the whole QA** — see section H.

---

## Test matrix

### A. Generation & load
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| A1 | Onboarding product flow (5 steps) | ✅ PASS | Clean, ~30s, good IoT copy |
| A2 | Page generation → correct template | ✅ PASS | Naayom TechPremium/Forest rendered |
| A3 | Enter visual editor | ✅ PASS | Loads, sections list correct |

### B. Inline text editing / rich-text toolbar
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| B1 | Headline — select-all + retype | ✅ PASS | Commits clean, no tag leak |
| B2 | Subheadline — select-all + retype | ✅ PASS | Clean |
| B3 | **Bold** a single plain word | ✅ PASS | Produces a real `<span>` (childElementCount=1) |
| B4 | **Underline** a word | 🔴 FAIL | Injects literal `<span style="text-decoration: underline">…</span>` as **visible text** (childElementCount=0; 60→146 chars) |
| B5 | **Text color / accent** a word | 🔴 FAIL | Injects literal `<span style="color: rgb(…)">…</span>` as text. **User's reported bug.** |
| B6 | Bold **then** underline same word | 🔴 FAIL | Serializes nested spans to escaped literal text `&lt;span&gt;…` |
| B7 | Broken markup persists to draft | 🔴 FAIL | Survives full page reload → **autosaved to backend**, will ship |
| B8 | Italic/strike · align L/C/R · font-size | ⚪ NOT RUN | Same broken toolbar; page too janky to isolate each after B4–B6. Treat as suspect until fixed. |

### C. CTAs / buttons
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| C1 | Hero secondary-CTA **Delete** | 🔴 FAIL | `confirm()` fires, answer Yes → **button not removed**, no JS error. **User's reported bug.** |
| C2 | Hero secondary-CTA **Duplicate** | 🔴 FAIL | No-op — still exactly 1 button after 2 attempts |
| C3 | Hero CTA **Button Settings** modal opens | ✅ PASS | All fields render (type/icons/action/URL) |
| C4 | Button Settings CTA-type value | 🟡 SUSPECT | Element tagged `secondary_cta_text` but radio shows **Primary CTA** selected — data mismatch |
| C5 | Hero CTA **Edit Text** enters edit mode | 🟡 PARTIAL | Toolbar + edit mode open; full commit not isolated (text-edit path itself works per B1/B2) |

> Structural ops on hero CTAs (Delete **and** Duplicate) are both dead, while text-edit + settings work → the CTA elements look un-wired from the generic element-action handlers.

### D. Repeatable items & sections
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| D1 | Delete client logo (× on card) | ✅ PASS | 6→5 cards, section marked Customized |
| D2 | FAQ — Add question | ✅ PASS | "New question?" appended |
| D3 | FAQ — Delete item (×) | ✅ PASS | Item removed, no error |
| D4 | Left-panel section nav (click → scroll) | ✅ PASS | Jumps to section |
| D5 | Section **Move Up** | ✅ PASS | Reorders in panel + canvas |
| D6 | Section **Move Down** | ✅ PASS | Restores order |
| D7 | Section **Duplicate** | ✅ PASS | Second copy appears |
| D8 | Section **Delete** | ✅ PASS | Removed cleanly (contrast with C1) |

### E. Header / navigation
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| E1 | Delete nav item (×) | ✅ PASS | "Why Naayom" removed |
| E2 | Add nav item (+ link) | ✅ PASS | New "Link" item added |

### F. Global chrome & persistence
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| F1 | **Undo** button | 🔴 FAIL | Stays disabled; never reverts an edit (tested after headline/color/subheadline edits) |
| F2 | **Redo** button | 🔴 FAIL | Disabled/no-op |
| F3 | Reset modal opens | ✅ PASS | Clean modal: Design-only / Everything / Cancel |
| F4 | **Reset Everything** → revert content | 🔴 FAIL | Badge flips to "AI Generated" + new timestamp, but **content NOT restored** (my corrupted headline & edits remained) |
| F5 | Autosave | ✅ PASS | Edits persist without manual save |
| F6 | Reload persistence | ✅ PASS | State survives refresh |
| F7 | Preview renders | ✅ PASS | Matches editor |
| F8 | Preview parity of the color bug | ✅ PASS (parity) / 🔴 (bug) | Broken `&lt;span&gt;` shows as literal text in Preview too — confirms "both edit and preview" |
| F9 | SEO panel opens + all fields | ✅ PASS | Per-page tabs, title, meta, social image, favicon, structured data, noindex |
| F10 | SEO title edit + live preview | ✅ PASS | Google + social card previews update live |
| F11 | Template/variant/palette pill | 🟡 INCONCLUSIVE | Clicking the "TechPremium·Forest·Default" pill opened no picker — may be a status label, not a control |

### G. Round-2 scenarios (previously not-run — now executed)
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| G5 | Add page (multi-page) | ✅ PASS | Creates "About Naayom", appears in page nav, switchable, editable, mirrors base structure. **Uses a native `window.prompt` for the page name** (froze automation; inconsistent with Reset's in-app modal). |
| G4 | Image upload (Add photo) | ✅ PASS | Uploads to real Vercel Blob (`…public.blob.vercel-storage.com/…`), hero `<img>` src updates, chip flips to "Change photo / remove". Verified end-to-end. (Normal use fires a native OS file picker — I injected the File programmatically since automation can't drive the OS dialog.) |
| G2 | Regen Copy (full-page AI) | 🟡 FLAKY | **First click was a silent no-op** — copy unchanged (my "gue0ssing" typo + added FAQ both survived), only one `/api/regenerate-section` call. **Second click worked** — full page rewritten, badge → "AI Generated". Also: output was **generic SaaS boilerplate** ("Unlock the potential of your business"), losing the mushroom-farming/climate/IoT specificity the original had. |
| G3 | Regenerate element/section (AI) | ✅ PASS (with caveats) | The inline AI "sparkle" regenerated the hero. **Caveat 1:** it rewrote the **entire section** (eyebrow+headline+subheadline+proof+CTAs), not just the selected headline. **Caveat 2:** copy drifted further off-topic → generic project-management SaaS ("Take control of your projects"). |
| G1 | Publish flow | 🟡 UI PASS / 🔴 LIVE FAIL | Publish **UI** works: modal → slug → title → analytics toggle → "Publishing…" → success modal with live URL. **But the live page is broken** — see section H. Minor: slug field **strips hyphens** ("naayom-qa-test" → "naayomqatest"); the template's floating WhatsApp widget **overlaps the Publish button** (misclicks opened WhatsApp share tabs). |

### H. 🔴🔴 Published live page CRASHES (most severe finding)
Published to **`https://naayomqatest.lessgo.site`** (still live — please delete). Publish reported success, but the live page renders a **white "Something went wrong" error boundary** — deterministic across reloads. Console shows two errors:

1. **React error #31 — "Objects are not valid as a React child."** The offending value is an object with keys `{0,1,2,3,4, type, content}` — a **text field that should be a string but is a structured `{type, content}` object.** The in-editor **preview tolerated it** (rendered as string/escaped), but the **published static-export renderer chokes and the whole page white-screens.** This is the textbook **dual-renderer divergence** — and it means the rich-text-corruption class (Bug 1) doesn't just show ugly tags, it can **take the entire published page down.**
2. **Clerk auth error** — `Production Keys are only allowed for domain "lessgo.ai"`. The **public published page loads Clerk** (auth) and it fails on the `.lessgo.site` domain. Published pages shouldn't be pulling in auth at all.

⚠️ **Caveat / how to isolate:** this page had heavy formatting corruption + two AI regenerations before publish, so I can't fully rule out that a *pristine* generate-then-publish renders clean. **Recommend:** publish one untouched freshly-generated page to confirm whether the crash is (a) purely a consequence of corrupted content reaching publish, or (b) a broader publish-renderer regression. Either way, the fact that a page can publish "successfully" while being 100%-broken live, plus the Clerk error, are real. The `{type, content}` object is the smoking gun tying this to Bug 1.

---

## The bugs, in priority order

### 🔴 1. Rich-text formatting writes raw HTML tags into the copy (color + underline)
The floating text toolbar's **color** and **underline** actions insert the literal markup string (`<span style="color: rgb(…)">word</span>` / `<span style="text-decoration: underline">word</span>`) **into the text itself** instead of styling the selection. Proof: after applying, the element has `childElementCount === 0` (no real element) and its text length jumps to include the tag characters; on re-render it HTML-escapes to `&lt;span …&gt;`. It **reproduces in Preview** and **autosaves to the draft** (survives reload), so it ships. Bold on a fresh word works (real span), but combining formats re-breaks — the whole styling path is unreliable. **This is your reported "headline shows `<span>` tags" bug, and it's broader than the headline — it hits every text field.** Undo can't rescue it (F1).

### 🔴 2. Hero CTA structural actions are dead (Delete + Duplicate)
Delete on the hero secondary CTA fires a confirm, you answer Yes, and nothing is removed (no error). Duplicate is likewise a no-op. Meanwhile section Delete/Duplicate and repeatable-item deletes all work — so it's specific to the hero CTA elements, which appear disconnected from the element-action handlers. Button Settings also shows the secondary CTA's type radio set to **Primary** (C4), hinting at the underlying data mismatch. **This is your reported "can't delete the secondary CTA" bug.**

### 🔴 3. "Reset Everything" doesn't reset content
The recovery path a stuck user would reach for flips the state badge and timestamp but leaves all edited/corrupted content in place. Combined with dead Undo (Bug 4), there is currently **no working way to recover a mangled page** except manual re-typing.

### 🔴 4. Undo / Redo are dead on live
Buttons render but stay disabled and never revert an edit. (Consistent with the Undo/Redo work living on the unmerged `feature/edit-header-actions` branch — not yet deployed. Flagging because it compounds Bugs 1 & 3.)

### 🟡 5. Button Settings CTA-type mismatch
Secondary CTA element shows "Primary CTA" selected in its settings — likely the same data-model confusion behind Bug 2.

⚠️ **UX note:** destructive Delete uses a native `window.confirm`. Beyond the automation-blocking issue we hit, a native dialog for a destructive action is fragile; an in-app confirm (like Reset's) would be better.

---

## Fix priority
1. **Published-page crash (section H)** — hardest blocker: a `{type, content}` object reaches a text slot and React #31s the whole live page. Make the published renderer coerce/guard text fields to strings (defensive), AND fix the source so fields never become objects. Also: stop loading Clerk on public published pages (Clerk errors on custom domains). Verify with a pristine publish.
2. Rich-text toolbar styling handler — wrap the selection in a real node; guarantee the field renders consistently (never double-escaped, never an object) across edit + published renderers. This is almost certainly upstream of #1.
3. Hero CTA Delete/Duplicate wiring + the secondary/primary type mismatch.
4. "Reset Everything" content revert.
5. Regen Copy flakiness (first-click no-op) + regenerate scope/quality (whole-section rewrite; generic off-brand copy).
6. Ship Undo/Redo so users can back out of mistakes.

## Minor / polish
- Add page uses a native `window.prompt` (make it an in-app modal like Reset).
- Publish slug field strips hyphens instead of keeping them.
- Template's floating WhatsApp widget overlaps the Publish button in preview.
- Destructive Delete uses native `window.confirm`.
