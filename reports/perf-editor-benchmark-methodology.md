# Editor Perf Benchmark — Methodology (repeatable)

**Purpose:** measure the editor/preview cost that perf-01/02/03 target, so the same procedure
re-run *after* those land in production gives a clean before/after.

**Perf specs under test**
- `perf-01` — interaction cost (whole-store subscription, per-mutation ~70KB localStorage stringify, orderedSections re-pass).
- `perf-02` — background overhead (55 dead overlays, 1s autosave poll, double-stringify export, undo deep-copies, snapshot retention, debug logging).
- `perf-03` — image weight (no `loading=lazy` / no dims / base64-in-content).

---

## Test rig / conventions

- **Browser:** Claude-in-Chrome (or DevTools by hand). Measurements below were taken **UNTHROTTLED**
  on a dev machine. For the definitive low-end comparison, set **DevTools → Performance → CPU: 6× slowdown**
  (per perf-01 acceptance criteria) and re-run — absolute numbers will be larger but the *ratio*
  before/after is the signal. Keep throttle setting identical between before & after runs.
- **Target project:** a naayom-scale TechPremium multi-page project (13 sections: Header, Hero, Trust,
  Features, Process, Explainer, Lineup, Testimonials, Gallerypreview, Compatibility, Faq, Cta, Footer).
  Baseline used `5fZ1O3Z-AXE0`. Use the **same project token** for the after-run.
- **Do NOT benchmark a live customer project** (e.g. naayom prod `Ix_Ki4FMSWKB`). Use a project the
  logged-in account owns. Interaction tests type then restore text; verify content is restored before finishing.
- Ignore PostHog localStorage writes — they are analytics, not the editor store. Only count writes to
  the `edit-store-<token>` key.

---

## Instrumentation harness (paste via console / javascript_tool)

```js
(() => {
  if (window.__perfHarness) return 'already';
  const H = window.__perfHarness = { ls:{count:0,bytes:0,byKey:{}}, longtasks:[], startTime:0 };
  const orig = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(k,v){ H.ls.count++; H.ls.bytes += (v||'').length; H.ls.byKey[k]=(H.ls.byKey[k]||0)+1; return orig(k,v); };
  try { const po=new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.startTime>=H.startTime)H.longtasks.push(Math.round(e.duration));}); po.observe({type:'longtask',buffered:false}); } catch(e){ H.ltErr=String(e); }
  H.reset=(lbl)=>{H.ls={count:0,bytes:0,byKey:{}};H.longtasks=[];H.startTime=performance.now();H.label=lbl;return 'reset:'+lbl;};
  H.report=()=>({label:H.label,windowMs:Math.round(performance.now()-H.startTime),lsWrites:H.ls.count,lsKB:Math.round(H.ls.bytes/1024),writesByKey:H.ls.byKey,longTaskCount:H.longtasks.length,longTaskTotalMs:H.longtasks.reduce((a,b)=>a+b,0),longTaskMaxMs:H.longtasks.length?Math.max(...H.longtasks):0,heapMB:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null});
  return 'installed';
})()
```

## Static / load snapshot (paste on a freshly-loaded page)

```js
(() => {
  const nav = performance.getEntriesByType('navigation')[0]||{};
  const paints={}; performance.getEntriesByType('paint').forEach(p=>paints[p.name]=Math.round(p.startTime));
  const lcp=performance.getEntriesByType('largest-contentful-paint');
  const imgs=Array.from(document.images);
  const TOKEN='5fZ1O3Z-AXE0'; // <-- set to project token
  const draft = localStorage.getItem('edit-store-'+TOKEN)||'';
  return {
    nav:{ttfb_ms:Math.round(nav.responseStart),dcl_ms:Math.round(nav.domContentLoadedEventEnd),load_ms:Math.round(nav.loadEventEnd)},
    paint:{...paints, lcp_ms: lcp.length?Math.round(lcp[lcp.length-1].startTime):null},
    heapMB: performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null,
    domNodes: document.getElementsByTagName('*').length,
    images:{total:imgs.length, lazy:imgs.filter(i=>i.getAttribute('loading')==='lazy').length, withDims:imgs.filter(i=>i.getAttribute('width')&&i.getAttribute('height')).length, base64:imgs.filter(i=>(i.currentSrc||i.src||'').startsWith('data:')).length},
    draftKB: Math.round(draft.length/1024)
  };
})()
```

---

## Test cases (run in order; record every number in the results doc)

### T0 — Edit page load (static)
1. Fresh-navigate `/edit/<token>`, wait until hero renders.
2. Run the **static/load snapshot**. Record: FCP, DCL, load, TTFB, heapMB, domNodes, image hygiene, draftKB.
   - *Targets:* `perf-01` (heap/nodes), `perf-03` (image lazy/dims/base64), draft size = per-mutation stringify cost.

### T1 — Interaction: focus → blur (NON-destructive, no text change)
1. Install harness. `__perfHarness.reset('A-focus-blur')`.
2. Click into the hero headline (focus). Wait ~1s. Click an empty canvas gutter to blur. Wait ~1s.
3. `__perfHarness.report()`. Record: **`writesByKey['edit-store-<token>']`** (localStorage stringifies per cycle),
   longTaskCount/TotalMs/MaxMs, heap delta.
   - *Target:* `perf-01`. Expected AFTER: focus/blur triggers **0 (or ≤1)** edit-store writes (UI-chrome moved out of persisted slice).

### T2 — Idle (background work)
1. `__perfHarness.reset('B-idle')`. Do nothing ~15–30s (don't move mouse over the page). `report()`.
2. Record: edit-store writes (should be 0 already), **longTaskCount/TotalMs** = background churn from overlays + 1s poll + logging.
   - *Target:* `perf-02`. Expected AFTER: near-zero long tasks while idle.

### T3 — Typing + heap
1. `__perfHarness.reset('C-typing')`. Click into headline, type a few chars.
2. `report()` BEFORE blur → record edit-store writes during typing + **heapMB spike** (undo deep-copies/snapshots).
3. Restore: backspace the exact chars typed; verify headline text == original via JS; blur.
   - *Target:* `perf-01` (per-keystroke store writes) + `perf-02` (heap from undo/snapshots). Expected AFTER: flat heap, no per-keystroke store write.

### T4 — Autosave payload (needs an account with WRITE access — see caveat)
1. Start network capture (clear). Make a real 1-char edit, blur, wait ~5s for the poll to POST.
2. In DevTools Network, inspect the `POST /api/saveDraft` **request payload size** and **count of POSTs** for the single edit.
3. Restore the edit (second net-zero edit) so content ends unchanged.
   - *Target:* `perf-02`. Expected AFTER: exactly **1** POST per commit, single serialize (not 2×), debounced (no 1s-poll spam).
   - **Caveat:** if `saveDraft` returns **403** (session lacks write access / CSRF), you can't read the server round-trip;
     the client-side export+stringify cost still shows up as long-tasks/heap in T3.

### T5 — Preview load (cold + warm)
1. Fresh-navigate `/preview/<token>` (first hit = **cold**). Wait until content paints. Run static snapshot → record FCP/DCL/load.
2. Reload the same URL (**warm**). Record FCP/DCL/load again.
   - *Target:* `perf-01` (preview shares edit renderer / whole-store sub / template-import blank gate).
   - **Caveat:** cold FCP includes ISR/SSR cold render + network and is noisy; report cold & warm separately.
     For a client-render-only comparison, prefer CPU-throttled warm reloads.

---

## After-deploy run

Re-run T0–T5 **identically** (same token, same throttle setting), paste numbers into the results doc's
"After" columns, compute deltas. Green = fewer edit-store writes per interaction, fewer idle long-tasks,
flat heap, single autosave POST, lazy images with dims, no base64 in content.
