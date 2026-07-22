// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).

export const STYLES = `
.tp-cat { padding: var(--pad-y) var(--pad-x); }
.tp-cat__inner { max-width: var(--max-w); margin: 0 auto; }
.tp-cat-head { display:flex; flex-direction:column; gap:16px; margin-bottom:48px; max-width:72ch; }
.tp-crumb { font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); }
.tp-crumb .tp-sep { margin:0 6px; color:var(--line-2); }
.tp-cat-h1 { font-family:var(--font-display); font-weight:600; font-size:clamp(32px,5vw,52px); letter-spacing:-0.02em; line-height:1.05; color:var(--ink); margin:0; }
.tp-cat-lede { font-family:var(--font-body); font-size:18px; line-height:1.7; color:var(--ink-2); margin:0; }
.tp-cat-jump { display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; }
.tp-cat-jump a { font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-2); border:1px solid var(--line-2); border-radius:999px; padding:8px 15px; text-decoration:none; transition:all .15s ease; }
.tp-cat-jump a:hover { border-color:var(--forest); color:var(--forest); }
.tp-pline + .tp-pline { margin-top:clamp(40px,5vw,64px); }
.tp-pline-head { display:flex; align-items:baseline; justify-content:space-between; gap:16px; padding-bottom:16px; margin-bottom:28px; border-bottom:1px solid var(--line-2); }
.tp-pline-h3 { font-family:var(--font-display); font-weight:600; font-size:clamp(22px,2.6vw,30px); letter-spacing:-0.018em; color:var(--ink); margin:0; }
.tp-pline-meta { display:flex; align-items:center; gap:12px; }
.tp-lbl { font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-3); }
.tp-cat-x { width:22px; height:22px; background:transparent; border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; }
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
.tp-collection-empty { border:1px dashed var(--line-2); border-radius:var(--r-lg); padding:48px 32px; text-align:center; background:var(--paper); }
.tp-ce-ico { width:46px; height:46px; border-radius:10px; background:var(--paper-2); display:grid; place-items:center; margin:0 auto 16px; color:var(--ink-3); }
.tp-collection-empty h3 { font-family:var(--font-display); font-weight:600; font-size:19px; color:var(--ink); margin:0 0 8px; }
.tp-collection-empty p { color:var(--ink-2); font-size:15px; max-width:42ch; margin:0 auto; }
.tp-cat-toolbar { margin-top:28px; display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
.tp-cat-manage { background:var(--forest); color:var(--paper); font-family:var(--font-display); font-weight:600; font-size:14px; padding:11px 20px; border:none; border-radius:var(--r-lg); cursor:pointer; }
.tp-cat-manage:hover { filter:brightness(1.08); }
.tp-cat-addcat { border:1px dashed var(--line-2); background:transparent; color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:11px 18px; border-radius:var(--r-lg); cursor:pointer; }
.tp-cat-addcat:hover { border-color:var(--forest); color:var(--forest); }
@media (max-width:760px){ .tp-pcards { grid-template-columns:1fr 1fr; } }
@media (max-width:520px){ .tp-pcards { grid-template-columns:1fr; } }
`;
