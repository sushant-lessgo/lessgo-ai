# Editor Perf Benchmark — 6× CPU THROTTLE run (post perf-01/02/03)

**Date:** 2026-07-11 · **Env:** production `lessgo.ai`, **DevTools CPU 6× slowdown**, Claude-in-Chrome
**Project:** `5fZ1O3Z-AXE0` — Home page (13 sections) · **Procedure:** `perf-editor-benchmark-methodology.md`
**Companion docs:** baseline + after (both UNTHROTTLED) same date.

> Purpose: definitive acceptance run per perf-spec criteria (6× ≈ naayom-class hardware).
> Verdict: **perf-01 + perf-03 PASS. perf-02 FAILS at 6×. One NEW CRITICAL data-loss bug found.**

---

## Headline verdicts

| Spec | Verdict | Evidence |
|------|---------|----------|
| perf-01 (interaction/store writes) | **PASS** | 2 writes per focus→blur, keystroke→frame 15–57 ms even at 6× |
| perf-03 (image weight) | **PASS** (lazy) / dims still missing | 9/12 lazy · 1/12 with dims |
| perf-02 (background overhead) | **FAIL at 6×** | **77% idle main-thread saturation**; root cause found (see §Loop) |
| — NEW | **CRITICAL: silent edit loss** | typed text visible in DOM, never committed to store, never POSTed (see §Edit-loss) |

---

## Captured numbers (6×)

| # | Metric | 6× throttled | Unthrottled after (ref) |
|---|--------|--------------|-------------------------|
| T0 | Edit load: TTFB / DCL / load / FCP | 179 / 4285 / 5398 / **3640 ms** | 18 / 828 / 1354 / — |
| T0 | DOM nodes / draft / images | 1855 / 67 KB / 12 (9 lazy, 1 dims, 0 b64) | 1842 / 67 KB / 13 (9 lazy) |
| T0 | Heap at load | 500.7 MB → settles 90–115 MB after GC | 286 MB (cumulative) |
| T1 | edit-store writes per focus→blur | **2** | 2 |
| T2 | Idle long tasks | **430 tasks / 46.4 s busy in 60.6 s window = 77% saturated** (max 485 ms) | 6 / 522 ms |
| T3 | Keystroke → next-frame latency | **57 / 44 / 30 / 15 ms** (4 chars) | n/a |
| T3 | edit-store writes (focus+typing window) | 3 | 1 |
| T4 | saveDraft per 1-char commit | **0 POSTs — edit LOST** (see below) | 1 POST @ 63.5 KB |
| T5 | Preview first-hit (ISR-warm): TTFB/DCL/load | 36 / 2931 / 7390 ms | 21 / 1675 / 1988 |
| T5 | Preview warm reload | 22 / 1403 / 6053 ms | 19 / 320 / 430 |

Post-load settling: page stayed busy ~2 min after load (one 35 s long task observed; screenshot injection timed out twice). Heap 500 → 90 MB across settling = GC churn, not leak-at-load.

---

## §Loop — perf-02 root cause: ElementDetector MutationObserver feedback loop

**Timer attribution over 68.7 s idle (all `setTimeout`/`setInterval`/rAF wrapped):**

| Source | Fires | Self-time |
|--------|-------|-----------|
| `setTimeout(100)` from **MutationObserver cb, edit-page chunk** | **581 (~8.5/s)** | **30,699 ms ≈ 45% of wall** |
| PostHog `sT(3000)` | 3 | 1361 ms |
| everything else (Clerk, sI(100), sT(2000)) | ≤5 | ≤39 ms |

**Code:** `src/app/edit/[token]/components/selection/ElementDetector.tsx:113-137`, mounted per-section by `MainContent.tsx:559` → **13 instances** on Home.

Mechanism (self-sustaining, infinite):
1. Observer watches `childList + subtree + attributes` with `attributeFilter: ['data-element-key', 'class']`.
2. Any mutation → `setTimeout(100)` (NOT debounced — no `clearTimeout`; timeouts pile up).
3. Callback runs `markSelectableElements()` (`classList.add` → **mutates watched `class` attr**) + `removeElementHints()`/`addElementHints()` (**childList mutations** via remove/appendChild).
4. Its own work re-fires the observer → loop forever, per section.
5. Bonus leak: `addElementHints` attaches fresh `mouseenter/mouseleave` listeners every cycle, never removed → explains idle heap creep.

Unthrottled each fire ≈ 9 ms → invisible to `longtask` API (that's why the unthrottled after-run looked "halved"); still ~9% CPU always-on. At 6× each fire ≈ 53 ms → main thread saturates.

**Fix direction:** file is legacy "backward compatibility" (comments say unified editor system owns detection). Prefer delete/neuter; else disconnect-observer-before-mutate + real debounce + drop `class` from attributeFilter + dedupe listeners.

## §Edit-loss — CRITICAL: commits silently dropped under load

Repro (3× — twice instrumented, once on a **fresh uninstrumented page**):
1. Click hero headline (editing state confirmed), type 1 char (DOM updates), click gutter (blur confirmed, `activeElement=BODY`).
2. Wait 30+ s: **0 edit-store writes, draft in localStorage never contains the char, 0 `POST /api/saveDraft`.**
3. Reload ⇒ the edit is gone. User sees their text on screen, believes it saved; it didn't.

Same gesture unthrottled (after-run) commits fine (1 write + 1 POST) ⇒ **timing/starvation race**, likely the semi-controlled InlineTextEditorV2 commit path (debounce starved or cleared by the ElementDetector churn). Needs code investigation; plausibly fixed by killing the loop, but must be verified independently.

**On naayom-class hardware this can happen at normal speed. Data-loss class — prioritize.**

---

## End-state integrity
Headline restored & verified char-exact; draft verified clean of test strings (`climxate`/`climyate`/`climtest`); no stray API writes.

## Caveats
1. 6× on a fast dev machine ≈ naayom i5 order-of-magnitude, not exact.
2. DevTools open during whole run (required for throttle) — small constant overhead.
3. Long-task windows include tool round-trip idle; saturation % over 60 s windows is robust, task counts directional.
4. Timer-attribution wrapper adds ~µs/fire — negligible.
5. Preview "first hit" was ISR-cached (not true cold), same as after-run.
6. Paint API returned empty on preview (automated-tab artifact); DCL/load are the signal.

---

## POST-FIX VERIFICATION (perf-04 deployed, same day — merge 0ffe11f3)

Same rig: prod lessgo.ai · DevTools CPU 6× · same project/page · fresh session.

| Check | Before perf-04 | After perf-04 | Verdict |
|---|---|---|---|
| Idle busy ratio (60–100 s window) | 430 tasks / 46.4 s / 60.6 s = **77%** | **2 tasks / 854 ms / 99.9 s = 0.85%** | ✅ PASS (target <10%) |
| Timer attribution | sT(100) MutationObserver 581 fires / 30.7 s CPU | **absent**; residue = PostHog 3 s beacons + sI(100) @ 74 ms total | ✅ loop gone |
| Edit-loss repro | edit visible in DOM, 0 store writes, 0 POSTs, lost on reload (3/3 lost) | **6/6 commits persisted** — draft updated + exactly 1 POST @ 63.5 KB each | ✅ FIXED — no perf-05 needed |
| Edit-page load (throttled) | heap 500 MB at load, ~2 min settling, 35 s long task | heap **53 MB**, settled immediately | ✅ |
| DOM nodes | 1855 | **1379** (hint elements gone) | ✅ |
| Selection/toolbar QA | — | section select + label, element outline, text toolbar renders/positions; inline edit enter/exit clean ×6 | ✅ |

**Conclusion:** the ElementDetector MutationObserver loop was the root cause of BOTH perf-02's
idle-saturation failure AND the silent edit-loss (commit path starvation). perf-04 closes both.
Editor-track phase 1 (trust) proceeds as planned but as hardening (sync-flush guarantee + save
chip + throttled persistence e2e), not as an open data-loss bug.
