# Editor Perf Benchmark — BASELINE (pre perf-01/02/03)

**Date:** 2026-07-11 · **Env:** production `lessgo.ai`, UNTHROTTLED, Claude-in-Chrome
**Project:** `5fZ1O3Z-AXE0` — naayom-scale TechPremium multi-page (13 sections)
**Procedure:** `reports/perf-editor-benchmark-methodology.md` (re-run identically after deploy)

> Read the caveats at the bottom before comparing. Absolute numbers are unthrottled best-case;
> the perf specs' acceptance criteria call for **6× CPU throttle** — set that for the real comparison,
> but keep the setting identical before/after.

---

## Headline results (fill "After" post-deploy)

| # | Metric | Baseline (before) | After | Δ | Target spec | Good direction |
|---|--------|-------------------|-------|---|-------------|----------------|
| T1 | **edit-store localStorage writes per focus→blur cycle** | **11** (~730 KB stringified) | | | perf-01 | → 0–1 |
| T1 | Long tasks during focus→blur | 13 tasks / 1154 ms (max 130 ms) | | | perf-01 | ↓ |
| T2 | edit-store writes while **idle** (~24s) | **0** | | | perf-01 | 0 |
| T2 | Long tasks while **idle** (~24s) | **12 tasks / 1262 ms** (max 228 ms) | | | perf-02 | → ~0 |
| T3 | Heap during focus + 4 keystrokes | **189 → 677 MB** spike | | | perf-02 | flat |
| T3 | edit-store writes for focus + 4 keystrokes | 5 | | | perf-01 | ↓ |
| T0 | Edit-page draft size (`edit-store-<token>`) | **67 KB** (this is stringified per mutation) | | | perf-01 | ↓ / off hot path |
| T0 | Edit-page heap at load | 188.8 MB used / 258.6 MB total | | | perf-02 | ↓ |
| T0 | Edit-page DOM nodes | 1840 | | | perf-01/02 | ↓ |
| T5 | **Preview FCP — cold** | **11,440 ms** | | | perf-01 | ↓↓ |
| T5 | Preview FCP — warm | 400 ms | | | perf-01 | ↓ |
| T4 | **`POST /api/saveDraft` per single edit** | **3 POSTs**, each **126.8 KB** (whole 13-page project) | | | perf-02 | 1 POST, 1 serialize, debounced |
| T0 | Images total / lazy / with-dims / base64 | **13 / 0 / 1 / 0** | | | perf-03 | all lazy(non-hero) + dims |

---

## Detail

### T0 — Edit page load (`/edit/5fZ1O3Z-AXE0`, fresh)
- nav: TTFB 18 ms · DCL 592 ms · load 1001 ms · FCP 1208 ms (LCP not captured)
- heap: **188.8 MB** used / 258.6 MB total
- DOM: **1840** nodes · 13 images
- localStorage: total 276 KB; **this project's draft = 67 KB** (← size stringified+written on every store mutation)
- images: 13 total · **0 lazy** · **1 with width/height** · 1 decoding=async · **0 base64**

### T1 — Focus → blur on hero headline (non-destructive)
- **edit-store-5fZ1O3Z-AXE0 written 11×** in the cycle (each ~67 KB ⇒ ~730 KB of synchronous JSON.stringify+write)
- 13 long tasks / 1154 ms total / 130 ms max
- heap 189 → 361 MB across the window
- *(PostHog wrote 17× separately — analytics, excluded from the count above)*

### T2 — Idle ~24s (no interaction)
- **0** edit-store writes → confirms the T1 writes are caused by the *interaction* (UI-chrome state lives in the
  persisted slice, so focus/blur/toolbar toggles each re-serialize the 67 KB draft) — **exactly perf-01's root cause**.
- **12 long tasks / 1262 ms** with nobody touching the page → perf-02 background work (per-element overlay
  setTimeout+querySelector sweeps, 1s autosave poll, per-render logging). The editor never rests.
- heap still climbed 361 → 395 MB while idle → perf-02 memory pressure.

### T3 — Typing (focus + 4 chars "test", then restored)
- 5 edit-store writes during focus+typing
- heap spiked to **677 MB** (undo deep-copies + version snapshots per commit — perf-02)
- content restored to original and verified (headline text + local draft both clean; no stray chars persisted)

### T4 — Autosave  *(measured on the owner account — saves return 200)*
- **A single 1-character edit fired 3 identical `POST /api/saveDraft`, each 126.8 KB**, ~1 s apart
  (t = 66504 / 67520 / 68540 ms). All returned **HTTP 200**. The 1 s dirtiness poll keeps re-uploading
  while the edit is still "dirty" ⇒ **3× redundant full-project uploads for one keystroke**.
- **Payload = 126.8 KB = the whole 13-page project**, not just the edited page (the single-page persisted
  draft was only 58 KB) — confirms perf-02's "each save runs full multi-page `store.export()` + POSTs whole project."
  (The restore edit fired 2 POSTs of 63.5 KB; note 126.8 ≈ 2 × 63.5 — consistent with the spec's
  "`JSON.stringify` TWICE" observation on the heavier commit.)
- Expected AFTER perf-02: exactly **1** POST per commit, single serialize, event-driven debounce (no 1 s re-spam).
- (Earlier run on a non-owner session returned **403** — write access is account-scoped; benchmark T4 only from an owner account.)

### T5 — Preview load (`/preview/5fZ1O3Z-AXE0`)
- **Cold (first hit):** TTFB 69 ms · DCL 11,397 ms · load 11,838 ms · **FCP 11,440 ms** · heap 150.6 MB · 694 DOM nodes · 11 images (0 lazy / 0 dims)
- **Warm (reload):** TTFB 24 ms · DCL 356 ms · load 471 ms · **FCP 400 ms** · heap 39.4 MB
- The ~11 s cold FCP is dominated by cold ISR/SSR + first client render (TTFB was tiny). Warm is fast because
  the browser served from cache. perf-01 targets the client-render portion — throttled warm reloads isolate it best.

### Secondary reference — live naayom prod (`Ix_Ki4FMSWKB`), read-only snapshot only
Captured before benchmarking was moved off the live project (no interaction performed):
- draft `edit-store-Ix_Ki4FMSWKB` = **71 KB** · heap 203.7 MB · 1862 DOM nodes · 19 images (0 lazy / 1 dims / 0 base64)
- Confirms the ~70 KB per-mutation stringify figure from the perf-01 spec on the real customer project.

---

## Caveats (read before comparing)
1. **Unthrottled.** Real target hardware (naayom: 8 GB, i5-11th, per spec) is far slower. Set DevTools CPU 6×
   for the definitive run; hold the setting constant before/after.
2. **Long-task counts are indicative.** `longtask` API only sees tasks >50 ms; windows include tool round-trip
   idle time. Treat as directional, not exact.
3. **Heap numbers are cumulative** and include PostHog + the instrumentation harness. Compare deltas, not absolutes.
4. **PostHog writes excluded** from all "edit-store writes" counts (they are separate analytics beacons).
5. **T4 measured on the owner account** (saves 200). A non-owner session gets 403 on `saveDraft` — always run T4 from an owner account.
6. **Preview cold FCP is noisy** (ISR/network). Warm + throttled is the more comparable client-render number.

## Known non-perf finding surfaced during this run (parked per your instruction)
- The logged-in account loaded `/edit` for projects it does not appear to own (naayom `Ix_Ki4FMSWKB` **and**
  `5fZ1O3Z-AXE0`, whose `saveDraft` returns **403**). Editor **renders from cached localStorage** while the
  **server rejects writes**. Benign (stale local cache) vs authz hole (server actually serving others' drafts)
  is unresolved — you chose to skip investigating it for now. Flagged here so it isn't lost.
