// Shared CSS for TechPremium product-detail (edit + published). tp- prefixed to
// stay collision-free; tokens/surfaces/em come from TechPremium SSRTokens.
// Includes the product-card rules so the related strip renders on a product page.

export const PD_STYLES = `
.tp-pd-home { display:flex; align-items:center; gap:8px; margin-top:14px; font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.02em; color:var(--ink-2); cursor:pointer; }
.tp-pd-home input { width:15px; height:15px; accent-color:var(--forest); cursor:pointer; }
.tp-pd-home em { font-style:normal; color:var(--ink-3); }
.tp-pd { padding: var(--pad-y) var(--pad-x); }
.tp-pd__inner { max-width: var(--max-w); margin: 0 auto; }
.tp-crumb { font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); margin-bottom:28px; }
.tp-crumb .tp-sep { margin:0 6px; color:var(--line-2); }
.tp-pd-top { display:grid; grid-template-columns:1.05fr 0.95fr; gap:clamp(36px,5vw,64px); align-items:start; }
.tp-pd-gallery { position:sticky; top:88px; }
.tp-pd-stage { position:relative; aspect-ratio:4/3; border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; background:var(--paper-2); }
.tp-pd-slide { position:absolute; inset:0; opacity:0; visibility:hidden; transition:opacity .2s ease; display:grid; place-items:center; }
.tp-pd-slide.is-active { opacity:1; visibility:visible; }
.tp-pd-slide img { width:100%; height:100%; object-fit:cover; }
.tp-pd-ph { font-family:var(--font-mono); font-size:11px; letter-spacing:0.06em; color:var(--ink-3); text-align:center; padding:8px; }
.tp-pd-ph.sm { font-size:12px; }
.tp-pd-nav { position:absolute; top:50%; transform:translateY(-50%); width:40px; height:40px; border-radius:50%; background:oklch(0.978 0.005 95 / 0.9); border:1px solid var(--line-2); display:grid; place-items:center; color:var(--ink); cursor:pointer; transition:all .15s ease; }
.tp-pd-nav:hover { background:var(--paper); border-color:var(--forest); }
.tp-pd-nav.prev { left:12px; } .tp-pd-nav.next { right:12px; }
.tp-pd-zoom { position:absolute; top:12px; right:12px; width:34px; height:34px; border-radius:var(--r); background:oklch(0.978 0.005 95 / 0.9); border:1px solid var(--line-2); display:grid; place-items:center; color:var(--ink); cursor:pointer; }
.tp-pd-count { position:absolute; bottom:12px; left:12px; font-family:var(--font-mono); font-size:11px; letter-spacing:0.08em; color:var(--ink-2); background:oklch(0.978 0.005 95 / 0.9); border:1px solid var(--line-2); padding:4px 9px; border-radius:var(--r); }
.tp-pd-thumbs { display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }
.tp-pd-thumb { width:72px; aspect-ratio:1/1; border:1px solid var(--line); border-radius:var(--r); overflow:hidden; opacity:.6; transition:all .15s ease; cursor:pointer; background:var(--paper-2); display:grid; place-items:center; padding:0; }
.tp-pd-thumb img { width:100%; height:100%; object-fit:cover; }
.tp-pd-thumb.is-active { opacity:1; border-color:var(--forest); }
.tp-pd-thumb:hover { opacity:1; }
.tp-pd-imgedit { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; align-items:center; }
.tp-pd-imgedit input.tp-pd-srcin { flex:1; min-width:140px; font-size:12px; padding:7px 10px; border:1px solid var(--line-2); border-radius:var(--r); font-family:var(--font-mono); }
.tp-pd-imgedit button { font-size:12px; padding:7px 12px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); cursor:pointer; }
.tp-pd-upload { display:inline-flex; align-items:center; gap:7px; font-size:12px; font-weight:500; padding:7px 12px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); color:var(--ink); cursor:pointer; }
.tp-pd-upload:hover { border-color:var(--forest); color:var(--forest); }
.tp-pd-info .tp-pd-model { font-family:var(--font-mono); font-size:12px; font-weight:600; letter-spacing:0.12em; color:var(--lime-d); }
.tp-pd-h1 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.025em; line-height:1.1; color:var(--ink); margin:10px 0 14px; }
.tp-pd-lede { font-family:var(--font-body); font-size:17px; line-height:1.7; color:var(--ink-2); max-width:48ch; margin:0; }
.tp-pd-meta { display:flex; flex-wrap:wrap; gap:10px; margin:20px 0 28px; }
.tp-pill { display:inline-flex; align-items:center; gap:8px; font-family:var(--font-mono); font-size:11px; letter-spacing:0.04em; color:var(--ink-2); border:1px solid var(--line-2); border-radius:999px; padding:6px 13px; }
.tp-pill .tp-dot { width:7px; height:7px; border-radius:50%; background:var(--ok); }
.tp-pill.teal .tp-dot { background:var(--teal); }
.tp-pd-actions { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:14px; }
.tp-pd-btn { display:inline-flex; align-items:center; justify-content:center; font-family:var(--font-display); font-weight:600; font-size:15px; padding:13px 22px; border-radius:var(--r); text-decoration:none; cursor:pointer; }
.tp-pd-btn.lime { background:var(--lime); color:var(--forest-d); }
.tp-pd-btn.lime:hover { filter:brightness(1.04); }
.tp-pd-btn.wa { background:var(--wa); color:#fff; }
.tp-pd-note { font-family:var(--font-mono); font-size:12px; color:var(--ink-3); letter-spacing:0.04em; margin:0; }
.tp-pd-note b { color:var(--forest); }
.tp-pd-specs { margin-top:36px; border-top:1px solid var(--line); }
.tp-pd-specs h2 { font-family:var(--font-display); font-weight:600; font-size:22px; letter-spacing:-0.018em; color:var(--ink); margin:30px 0 18px; }
.tp-spec-list { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--line); border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; }
.tp-spec-row { background:var(--paper); padding:14px 18px; display:flex; justify-content:space-between; gap:16px; align-items:baseline; position:relative; }
.tp-spec-k { font-size:14px; color:var(--ink-2); }
.tp-spec-v { font-family:var(--font-mono); font-size:13px; font-weight:500; color:var(--ink); text-align:right; }
.tp-feat-list { list-style:none; padding:0; margin:18px 0 0; display:grid; grid-template-columns:1fr 1fr; gap:14px 28px; }
.tp-feat-list li { display:grid; grid-template-columns:auto 1fr auto; gap:12px; font-size:15px; color:var(--ink-2); line-height:1.55; align-items:start; }
.tp-feat-list li svg { color:var(--lime-d); margin-top:2px; flex:none; }
.tp-mini-x { background:transparent; border:none; color:var(--ink-3); cursor:pointer; font-size:14px; }
.tp-pd-add { margin-top:14px; border:1px dashed var(--line-2); background:transparent; color:var(--ink-3); font-size:13px; padding:8px 14px; border-radius:var(--r); cursor:pointer; }
.tp-pd-related { margin-top:clamp(48px,6vw,80px); }
.tp-related-head { display:flex; align-items:baseline; justify-content:space-between; gap:16px; margin-bottom:24px; }
.tp-related-head h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(22px,2.6vw,30px); letter-spacing:-0.018em; color:var(--ink); margin:0; }
/* product cards (reused by related strip) */
.tp-pcards { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.tp-pcard { background:var(--paper); border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; display:flex; flex-direction:column; text-decoration:none; color:inherit; transition:border-color .16s ease, transform .16s ease, box-shadow .16s ease; }
.tp-pcard:hover { border-color:var(--line-2); transform:translateY(-2px); box-shadow:0 16px 40px -28px color-mix(in oklch, var(--forest) 50%, transparent); }
.tp-pshot { aspect-ratio:4/3; border-bottom:1px solid var(--line); background:var(--paper-2); display:grid; place-items:center; overflow:hidden; }
.tp-pshot img { width:100%; height:100%; object-fit:cover; }
.tp-pshot__ph { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.06em; color:var(--ink-3); text-align:center; padding:8px; }
.tp-pbody { padding:20px 20px 18px; display:flex; flex-direction:column; gap:8px; flex:1; }
.tp-pmodel { font-family:var(--font-mono); font-size:11px; font-weight:600; letter-spacing:0.12em; color:var(--lime-d); }
.tp-ph4 { font-family:var(--font-display); font-weight:600; font-size:19px; letter-spacing:-0.015em; color:var(--ink); margin:0; }
.tp-pp { margin:0; color:var(--ink-2); font-size:14px; line-height:1.55; }
.tp-pfoot { margin-top:auto; padding-top:16px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.tp-pspecs { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.06em; color:var(--ink-3); }
.tp-penq { font-family:var(--font-display); font-weight:600; font-size:13.5px; color:var(--forest); }
.tp-pcard:hover .tp-penq { color:var(--lime-d); }
/* shared lightbox (built by the published inline script) */
.tp-lightbox { position:fixed; inset:0; z-index:90; background:color-mix(in oklch, color-mix(in oklch, var(--forest-d) 78%, black) 92%, transparent); backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; padding:clamp(16px,4vw,56px); }
.tp-lightbox.is-open { display:flex; }
.tp-lb-stage { position:relative; max-width:1100px; width:100%; }
.tp-lb-img { width:100%; aspect-ratio:3/2; border-radius:var(--r-lg); overflow:hidden; background:var(--paper-2); display:grid; place-items:center; }
.tp-lb-img img { width:100%; height:100%; object-fit:contain; }
.tp-lb-cap { margin-top:14px; font-family:var(--font-mono); font-size:12px; letter-spacing:0.06em; color:color-mix(in oklch, var(--on-dark) 80%, transparent); text-align:center; }
.tp-lb-close { position:absolute; top:-44px; right:0; width:38px; height:38px; border:1px solid var(--line-dk); border-radius:var(--r); display:grid; place-items:center; color:var(--paper); background:transparent; cursor:pointer; font-size:18px; }
.tp-lb-nav { position:absolute; top:50%; transform:translateY(-50%); width:48px; height:48px; border-radius:50%; border:1px solid var(--line-dk); background:color-mix(in oklch, color-mix(in oklch, var(--forest-d) 78%, black) 60%, transparent); display:grid; place-items:center; color:var(--paper); cursor:pointer; font-size:22px; }
.tp-lb-nav:hover { border-color:var(--lime); }
.tp-lb-nav.prev { left:-64px; } .tp-lb-nav.next { right:-64px; }
@media (max-width:1040px){ .tp-pd-top { grid-template-columns:1fr; gap:40px; } .tp-pd-gallery { position:static; max-width:560px; } .tp-lb-nav.prev { left:8px; } .tp-lb-nav.next { right:8px; } }
@media (max-width:760px){ .tp-spec-list, .tp-feat-list { grid-template-columns:1fr; } .tp-pcards { grid-template-columns:1fr 1fr; } .tp-pd-actions .tp-pd-btn { flex:1; } }
@media (max-width:520px){ .tp-pcards { grid-template-columns:1fr; } }
`;
