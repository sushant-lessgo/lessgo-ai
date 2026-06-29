// Shared CSS for the Lumen portfolio (category covers) + the published lightbox.
// `lm-` prefixed. Ported from Lumen HTML (.sec-head/.sec-rule lines 188-198,
// .pf-* 233-250, .lb-* lightbox 320-349). Block does NOT paint the section bg.

export const PORTFOLIO_STYLES = `
.lm-pf-in{ max-width:var(--max-w); margin:0 auto; padding:var(--pad-y) var(--pad-x); }
.lm-sec-head{ max-width:62ch; display:flex; flex-direction:column; gap:16px; margin-bottom:52px; }
.lm-sec-head .lm-eyebrow{ font-family:var(--font-mono); font-weight:500; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:var(--brass-d); display:inline-flex; align-items:center; gap:11px; }
.lm-sec-head .lm-eyebrow::before{ content:""; width:24px; height:1px; background:var(--line-2); }
.lm-sec-head h2{ font-family:var(--font-display); font-size:clamp(30px,4.2vw,50px); font-weight:400; letter-spacing:-0.012em; line-height:1.08; color:var(--ink); margin:0; }
.lm-sec-head h2 em{ font-style:italic; color:var(--brass-d); }
.lm-sec-head .lm-lede{ font-family:var(--font-body); font-size:18px; line-height:1.66; color:var(--ink-2); margin:0; }
.lm-pf-group + .lm-pf-group{ margin-top:64px; }
.lm-sec-rule{ display:flex; align-items:baseline; justify-content:space-between; gap:18px; border-bottom:1px solid var(--line-2); padding-bottom:14px; margin-bottom:34px; }
.lm-sec-rule h2{ font-family:var(--font-display); font-size:clamp(26px,3.4vw,40px); font-weight:400; color:var(--ink); margin:0; }
.lm-sec-rule .idx{ font-family:var(--font-mono); font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-3); }
.lm-pf-cards{ display:grid; gap:26px; grid-template-columns:repeat(3,1fr); }
.lm-pf-card{ display:block; cursor:pointer; text-align:left; width:100%; background:none; border:0; padding:0; font:inherit; color:inherit; }
.lm-ph{ position:relative; background:var(--paper-2); overflow:hidden; background-image:repeating-linear-gradient(135deg, oklch(0.235 0.010 60 / 0.05) 0 1px, transparent 1px 13px); border:1px solid var(--line); transition:filter .25s ease; }
.lm-ph img{ display:block; width:100%; height:100%; object-fit:cover; }
.lm-pf-card:hover .lm-ph{ filter:brightness(0.93); }
.lm-shot.land{ aspect-ratio:3/2; } .lm-shot.port{ aspect-ratio:4/5; }
.lm-ph__tag{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.13em; text-transform:uppercase; color:var(--ink-3); white-space:nowrap; text-align:center; border:1px solid var(--line-2); padding:5px 11px; border-radius:var(--r); background:var(--paper); }
.lm-pf-card .open{ position:absolute; right:13px; bottom:13px; z-index:3; opacity:0; transform:translateY(4px); font-family:var(--font-mono); font-size:10px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink); background:var(--paper); border:1px solid var(--line-2); padding:6px 10px; border-radius:var(--r); transition:opacity .2s, transform .2s; }
.lm-pf-card:hover .open, .lm-pf-card:focus-visible .open{ opacity:1; transform:translateY(0); }
.lm-fig{ display:flex; align-items:baseline; gap:12px; margin-top:13px; font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.10em; text-transform:uppercase; color:var(--ink-3); }
.lm-fig .n{ color:var(--brass-d); }
.lm-fig .ratio{ margin-left:auto; color:var(--ink-3); opacity:.85; }
.lm-pf-edit{ display:flex; gap:8px; align-items:center; margin-top:8px; flex-wrap:wrap; }
.lm-pf-edit__btn{ font-family:var(--font-mono); font-size:10px; letter-spacing:0.04em; color:var(--ink-3); background:transparent; border:1px dashed var(--line-2); border-radius:2px; padding:4px 9px; cursor:pointer; }
.lm-pf-edit__count{ font-family:var(--font-mono); font-size:10px; color:var(--ink-3); }
.lm-pf-import__msg{ font-family:var(--font-mono); font-size:10.5px; color:var(--brass-d); margin-top:6px; }
.lm-pf-urls{ margin-top:8px; }
.lm-pf-urls summary{ font-family:var(--font-mono); font-size:10px; letter-spacing:0.04em; color:var(--ink-3); cursor:pointer; }
.lm-pf-urls textarea{ width:100%; margin-top:6px; font-family:var(--font-mono); font-size:11px; color:var(--ink); background:var(--paper-2); border:1px solid var(--line-2); border-radius:var(--r); padding:8px 10px; resize:vertical; }
.lm-pf-add{ font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.04em; color:var(--ink-3); background:transparent; border:1px dashed var(--line-2); border-radius:2px; padding:6px 12px; cursor:pointer; margin-top:20px; }
/* ---- lightbox (published; lumen.v1.js drives it) ---- */
.lm-lb{ position:fixed; inset:0; z-index:200; display:none; }
.lm-lb.open{ display:block; }
.lm-lb-scrim{ position:absolute; inset:0; background:oklch(0.16 0.008 56 / 0.92); backdrop-filter:blur(6px); }
.lm-lb-stage{ position:absolute; inset:0; display:flex; flex-direction:column; padding:clamp(16px,4vw,44px); }
.lm-lb-head{ display:flex; align-items:center; justify-content:space-between; gap:18px; color:var(--paper); flex:none; }
.lm-lb-title{ display:flex; align-items:baseline; gap:14px; }
.lm-lb-title .cat{ font-family:var(--font-display); font-size:22px; font-weight:500; color:var(--paper); }
.lm-lb-title .grp{ font-family:var(--font-mono); font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--brass-l); }
.lm-lb-close{ width:42px; height:42px; border:1px solid var(--line-dk); border-radius:50%; display:grid; place-items:center; color:var(--paper); background:none; cursor:pointer; transition:border-color .15s, color .15s; }
.lm-lb-close:hover{ border-color:var(--brass-l); color:var(--brass-l); }
.lm-lb-close svg{ width:18px; height:18px; stroke:currentColor; stroke-width:1.7; fill:none; }
.lm-lb-body{ flex:1; display:flex; align-items:center; justify-content:center; gap:clamp(10px,2.5vw,28px); min-height:0; padding:clamp(14px,3vw,28px) 0; }
.lm-lb-frame{ position:relative; max-width:min(1000px,100%); max-height:100%; display:flex; align-items:center; justify-content:center; }
.lm-lb-frame .lm-ph{ height:min(72vh,760px); width:auto; }
.lm-lb-frame .lm-ph.land{ aspect-ratio:3/2; } .lm-lb-frame .lm-ph.port{ aspect-ratio:4/5; }
.lm-lb-arrow{ width:50px; height:50px; flex:none; border:1px solid var(--line-dk); border-radius:50%; display:grid; place-items:center; color:var(--paper); background:oklch(0.20 0.01 56 / 0.5); cursor:pointer; transition:border-color .15s, color .15s, background .15s; }
.lm-lb-arrow:hover{ border-color:var(--brass-l); color:var(--brass-l); background:oklch(0.20 0.01 56 / 0.8); }
.lm-lb-arrow svg{ width:20px; height:20px; stroke:currentColor; stroke-width:1.7; fill:none; }
.lm-lb-foot{ flex:none; display:flex; align-items:center; justify-content:space-between; gap:18px; color:oklch(0.80 0.02 70 / 0.85); }
.lm-lb-cap{ font-family:var(--font-mono); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; }
.lm-lb-cap .n{ color:var(--brass-l); }
.lm-lb-count{ font-family:var(--font-mono); font-size:12px; letter-spacing:0.12em; color:var(--paper); }
.lm-lb-count b{ color:var(--brass-l); font-weight:500; }
.lm-lb-dots{ display:flex; gap:7px; }
.lm-lb-dot{ width:7px; height:7px; border-radius:50%; background:var(--line-dk); transition:background .15s, transform .15s; }
.lm-lb-dot.on{ background:var(--brass-l); transform:scale(1.25); }
@media (max-width:760px){ .lm-pf-cards{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:520px){ .lm-pf-cards{ grid-template-columns:1fr; } }
`;
