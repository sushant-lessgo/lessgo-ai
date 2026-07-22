// Shared TechPremium block CSS (Phase 4b). Lightbox + product cards + striped
// photo placeholder + status pill — extracted so blocks that aren't ProductDetail/
// Catalog (Lineup, GalleryPreview, …) can render them. tp- prefixed; tokens from
// SSRTokens. The lightbox/card class contract matches what naayom.v1.js targets.

// Striped photo placeholder (the designer's .ph). Real <img> overrides it.
export const PH_STYLES = `
.tp-ph { position:relative; background:var(--paper-2); overflow:hidden; border:1px solid var(--line); border-radius:var(--r-lg); background-image:repeating-linear-gradient(135deg, color-mix(in oklch, var(--forest) 5.5%, transparent) 0 1px, transparent 1px 12px); }
.tp-ph img { width:100%; height:100%; object-fit:cover; display:block; }
.tp-ph .tp-tag { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); white-space:nowrap; text-align:center; border:1px solid var(--line-2); padding:5px 10px; border-radius:var(--r); background:var(--paper); }
.tp-ph.on-dark { background-color:color-mix(in oklch, var(--forest) 50%, var(--forest-d)); border-color:var(--line-dk); background-image:repeating-linear-gradient(135deg, color-mix(in oklch, var(--lime) 7%, transparent) 0 1px, transparent 1px 12px); }
.tp-ph.on-dark .tp-tag { background:var(--forest-d); border-color:var(--line-dk); color:var(--on-dark-2); }
`;

// Status pill (results testimonials, badges). Readout has its own tp-rd-pill.
export const PILL_STYLES = `
.tp-pill { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:10.5px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; padding:4px 9px 4px 7px; border-radius:999px; color:var(--ok); background:var(--ok-bg); border:1px solid oklch(0.66 0.15 150 / 0.30); }
.tp-pill .tp-dot { width:6px; height:6px; border-radius:50%; background:var(--ok); box-shadow:0 0 0 3px var(--ok-bg); }
.tp-pill.teal { color:var(--teal); background:var(--teal-dim); border-color:oklch(0.70 0.095 192 / 0.30); }
.tp-pill.teal .tp-dot { background:var(--teal); box-shadow:0 0 0 3px var(--teal-dim); }
`;

// Section scaffold: eyebrow / heading / lede (centered variant). Reused widely.
export const SEC_HEAD_STYLES = `
.tp-sec { padding: var(--pad-y) var(--pad-x); }
.tp-sec__inner { max-width: var(--max-w); margin: 0 auto; }
.tp-eyebrow { font-family:var(--font-mono); font-weight:500; font-size:11.5px; letter-spacing:0.20em; text-transform:uppercase; color:var(--lime-d); display:inline-flex; align-items:center; gap:10px; align-self:flex-start; }
.tp-eyebrow::before { content:""; width:22px; height:1px; background:var(--line-2); }
[data-surface="forest"] .tp-eyebrow, [data-surface="forest-d"] .tp-eyebrow { color:var(--lime); }
[data-surface="forest"] .tp-eyebrow::before, [data-surface="forest-d"] .tp-eyebrow::before { background:var(--line-dk); }
.tp-sec-head { max-width:64ch; display:flex; flex-direction:column; gap:16px; margin-bottom:48px; }
.tp-sec-head.center { text-align:center; align-items:center; margin-left:auto; margin-right:auto; }
.tp-sec-head h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-lede { font-family:var(--font-body); font-size:18px; line-height:1.7; color:var(--ink-2); margin:0; }
[data-surface="forest"] .tp-lede, [data-surface="forest-d"] .tp-lede { color:color-mix(in oklch, var(--on-dark) 82%, transparent); }
`;

// Shared buttons (lime / wa / line / ghost-d / lg).
export const BTN_STYLES = `
.tp-btn2 { display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-display); font-weight:600; font-size:14.5px; letter-spacing:-0.005em; padding:13px 22px; border-radius:var(--r); white-space:nowrap; line-height:1; text-decoration:none; cursor:pointer; border:1px solid transparent; transition:background .16s ease,color .16s ease,border-color .16s ease,transform .16s ease; }
.tp-btn2.lg { padding:16px 28px; font-size:15.5px; }
.tp-btn2.lime { background:var(--lime); color:var(--forest-d); }
.tp-btn2.lime:hover { background:color-mix(in oklch, var(--lime) 95%, black); transform:translateY(-1px); }
.tp-btn2.wa { background:var(--wa); color:#fff; }
.tp-btn2.wa:hover { background:oklch(0.55 0.16 150); transform:translateY(-1px); }
.tp-btn2.line { border:1px solid var(--line-2); color:var(--ink); background:var(--paper); }
.tp-btn2.line:hover { border-color:var(--forest); color:var(--forest); }
.tp-btn2.ghost-d { border:1px solid var(--line-dk); color:var(--paper); background:transparent; }
.tp-btn2.ghost-d:hover { border-color:var(--lime); color:var(--lime); }
`;

// Product cards (catalog/lineup/related). Class contract matches Catalog/ProductDetail.
export const CARD_STYLES = `
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
@media (max-width:760px){ .tp-pcards { grid-template-columns:1fr 1fr; } }
@media (max-width:520px){ .tp-pcards { grid-template-columns:1fr; } }
`;

// Shared lightbox (built by naayom.v1.js; opened from product gallery + gallery grids).
export const LIGHTBOX_STYLES = `
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
@media (max-width:1040px){ .tp-lb-nav.prev { left:8px; } .tp-lb-nav.next { right:8px; } }
`;
