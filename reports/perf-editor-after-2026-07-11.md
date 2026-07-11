# Editor Perf Benchmark — AFTER perf-01/02/03 (captured data)

**Date:** 2026-07-11 · **Env:** production `lessgo.ai`, UNTHROTTLED, Claude-in-Chrome
**Project:** `5fZ1O3Z-AXE0` — naayom-scale TechPremium multi-page, **Home** page (13 sections)
**Procedure:** `reports/perf-editor-benchmark-methodology.md` (run identically to baseline)
**Baseline for reference:** `reports/perf-editor-baseline-2026-07-11.md`

> This doc records the **after-deploy captured numbers only** — no deltas/verdicts computed (per instruction).
> Baseline column reproduced for placement only. Read the caveats at the bottom before drawing conclusions.

---

## Captured results

| # | Metric | Baseline (ref) | **After (captured)** | Spec |
|---|--------|----------------|----------------------|------|
| T0 | Edit-page draft size (`edit-store-<token>`) | 67 KB | **67 KB** | perf-01 |
| T0 | Edit-page heap at load (Home) | 188.8 / 258.6 MB | **286.1 / 323.8 MB** ⚠cumulative | perf-02 |
| T0 | Edit-page DOM nodes (Home) | 1840 | **1842** | perf-01/02 |
| T0 | Images total / lazy / dims / base64 (Home) | 13 / 0 / 1 / 0 | **13 / 9 / 1 / 0** | perf-03 |
| T1 | edit-store writes per focus→blur | 11 | **2** | perf-01 |
| T1 | Long tasks during focus→blur | 13 / 1154 ms / max 130 | **12 / 1051 ms / max 112** ⚠window-idle | perf-01 |
| T2 | edit-store writes while idle | 0 | **0** | perf-01 |
| T2 | Long tasks while idle | 12 / 1262 ms / max 228 | **6 / 522 ms / max 93** ⚠window-idle | perf-02 |
| T3 | edit-store writes, focus + 4 keystrokes | 5 | **1** | perf-01 |
| T3 | Heap during typing | 189 → 677 MB spike | **692 → 736 MB** ⚠cumulative | perf-02 |
| T4 | `POST /api/saveDraft` per single commit | 3 POSTs @ 126.8 KB | **1 POST @ 63.5 KB, single serialize** | perf-02 |
| T5 | Preview FCP — cold | 11,440 ms | **1,672 ms** ⚠ISR-warm, not true cold | perf-01 |
| T5 | Preview FCP — warm | 400 ms | **368 ms** | perf-01 |

---

## Detail

### T0 — Edit page load (`/edit/5fZ1O3Z-AXE0`, Home page)
- nav (reliable): **TTFB 18 ms · DCL 828 ms · load 1354 ms**
- FCP/first-paint reported **11,736 ms** — **anomalous / invalid** (later than `loadEventEnd`); paint-timing artifact from the automated tab. Do **not** use as a metric; TTFB/DCL/load are the load signal. (baseline FCP 1208 ms.)
- heap: **286.1 MB** used / 323.8 MB total (cumulative — see caveats)
- DOM: **1842** nodes · 13 images
- localStorage: total 213 KB; **this project's draft = 67 KB**
- images: 13 total · **9 lazy** · 1 with width/height · 0 base64
- (Default page that auto-loaded was **Products/Catalog** — 4 sections / 4 images / 837 nodes / draft 57 KB. Switched to **Home** to match the baseline's 13-section page before capturing above.)

### T1 — Focus → blur on hero headline (non-destructive)
- **edit-store-5fZ1O3Z-AXE0 written 2×** in the cycle (baseline 11×)
- PostHog wrote 16× separately (analytics — excluded)
- long tasks: **12 / 1051 ms total / 112 ms max** (window 31 s — inflated by tool round-trip idle)
- heap 468.9 MB at window end

### T2 — Idle ~27.6 s (no interaction)
- **0** edit-store writes
- **6 long tasks / 522 ms total / 93 ms max** (baseline 12 / 1262 ms / 228 ms)
- heap 692 MB (cumulative)

### T3 — Typing (focus + 4 chars "test", then restored)
- **1 edit-store write** during focus + typing (baseline 5)
- long tasks: 2 / 147 ms
- heap moved 692 → **736 MB** across the window (cumulative session heap; not a clean 189→677-style isolated spike)
- content restored to original and **verified** (`h1.textContent === original`; headline = "Where climate control meets precision for mushroom farmers.")

### T4 — Autosave (owner account, saves 200)
- **1-char edit → exactly 1 `POST /api/saveDraft`, HTTP 200** (baseline: 3 identical POSTs, ~1 s apart)
- **restore edit → exactly 1 POST, request body 63.5 KB (64,986 bytes), single serialize** (baseline: 2 POSTs @ 63.5 KB)
- across the two commits: **2 total POSTs = 1 per commit, no 1 s dirtiness re-spam** (baseline: 3 + 2)
- payload = 63.5 KB (single-page draft scale), no ~2× double-stringify observed

### T5 — Preview load (`/preview/5fZ1O3Z-AXE0`)
- **"Cold" (first hit this session):** TTFB 21 ms · DCL 1675 ms · load 1988 ms · **FCP 1672 ms** · heap 115.4 MB · 689 DOM nodes · 11 images (**9 lazy** / 0 dims / 0 base64)
  - ⚠ This page was already **ISR-cached** from prior visits, so this is *not* a true first-ever cold render like the baseline's 11,440 ms (which included cold ISR/SSR). Not a like-for-like cold comparison — recorded as measured.
- **Warm (reload):** TTFB 19 ms · DCL 320 ms · load 430 ms · **FCP 368 ms** · heap 50 MB · 694 nodes · 11 images (9 lazy)

---

## Measurement caveats (read before comparing)
1. **UNTHROTTLED**, same as baseline (no CPU throttle either run). For the definitive low-end number, re-run both with DevTools CPU 6×; ratio is the signal.
2. **Edit-page FCP is invalid this run** (11,736 ms > loadEventEnd) — automated-tab paint artifact. Use TTFB/DCL/load.
3. **Long-task windows are inflated** by Claude-in-Chrome tool round-trip idle (T1 window ≈ 31 s, T2 ≈ 27.6 s). `longtask` API only sees >50 ms tasks. Counts are directional.
4. **Heap numbers are cumulative** across one continuous browser session (no reload between T1–T3) and include PostHog + the instrumentation/fetch/localStorage harness wrappers. Compare deltas, not absolutes.
5. **Preview "cold" = ISR-cache-warm** here (page pre-rendered from earlier visits); baseline "cold" was a true first-ever render. Not comparable as cold-vs-cold.
6. **T4 on the owner account** (saves return 200). Same token, same Home page (13 sections) as baseline.
7. Content edited during T3/T4 was restored and verified clean; no stray characters persisted.
