// Shared nav CSS (edit + published). tp- prefixed port of naayom.css .nav* +
// the existing brand/button bits. Behaviors wired by naayom.v1.js on published.

export const NAV_STYLES = `
.tp-nav { position:sticky; top:0; z-index:60; background:oklch(0.978 0.005 95 / 0.88); backdrop-filter:blur(10px); border-bottom:1px solid var(--line); font-family:var(--font-body); }
.tp-nav-in { display:flex; align-items:center; gap:24px; padding:13px var(--pad-x); max-width:var(--max-w); margin:0 auto; }
.tp-brand { display:inline-flex; align-items:center; gap:11px; text-decoration:none; }
.tp-brand__mk { width:34px; height:34px; border-radius:7px; background:var(--forest); display:grid; place-items:center; position:relative; flex-shrink:0; }
.tp-brand__mk::before { content:""; width:14px; height:14px; border-radius:50%; border:2px solid var(--lime); }
.tp-brand__mk::after { content:""; position:absolute; width:5px; height:5px; border-radius:50%; background:var(--lime); }
.tp-brand__img { width:34px; height:34px; border-radius:7px; object-fit:cover; flex-shrink:0; }
.tp-brand__wm { font-family:var(--font-display); font-weight:700; font-size:21px; letter-spacing:-0.02em; color:var(--ink); }
.tp-nav-links { display:flex; align-items:center; gap:6px; margin-left:10px; }
.tp-nav-links > a, .tp-nav-drop-t { font-family:var(--font-body); font-size:14px; font-weight:500; color:var(--ink-2); padding:8px 12px; border-radius:var(--r); display:inline-flex; align-items:center; gap:6px; background:transparent; border:none; cursor:pointer; text-decoration:none; transition:color .15s ease, background .15s ease; }
.tp-nav-links > a:hover, .tp-nav-drop-t:hover { color:var(--forest); background:var(--paper-2); }
.tp-nav-links > a.is-active { color:var(--forest); font-weight:600; }
.tp-nav-drop-t .chev { width:14px; height:14px; transition:transform .18s ease; }
.tp-nav-drop { position:relative; }
.tp-nav-drop-menu { position:absolute; top:calc(100% + 8px); left:0; min-width:268px; padding:8px; background:var(--paper); border:1px solid var(--line-2); border-radius:var(--r-lg); box-shadow:0 24px 56px -28px oklch(0.30 0.04 158 / 0.55); z-index:5; opacity:0; visibility:hidden; transform:translateY(-6px); transition:opacity .16s ease, transform .16s ease, visibility .16s; }
.tp-nav-drop:hover .tp-nav-drop-menu, .tp-nav-drop.is-open .tp-nav-drop-menu { opacity:1; visibility:visible; transform:translateY(0); }
.tp-nav-drop:hover .tp-nav-drop-t .chev, .tp-nav-drop.is-open .tp-nav-drop-t .chev { transform:rotate(180deg); }
.tp-nav-drop-menu a { display:flex; flex-direction:column; gap:2px; padding:9px 12px; border-radius:var(--r); text-decoration:none; }
.tp-nav-drop-menu a:hover { background:var(--paper-2); }
.tp-nav-drop-menu a b { font-family:var(--font-display); font-weight:600; font-size:14px; color:var(--ink); }
.tp-nav-drop-menu a span { font-size:12px; color:var(--ink-3); }
.tp-nav-cta { margin-left:auto; display:flex; align-items:center; gap:12px; }
.tp-nav-login { font-family:var(--font-display); font-weight:600; font-size:14px; color:var(--ink-2); display:inline-flex; align-items:center; gap:7px; text-decoration:none; cursor:pointer; }
.tp-nav-login:hover { color:var(--forest); }
.tp-nav-login .lock { width:13px; height:13px; flex:none; }
.tp-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; font-family:var(--font-display); font-weight:600; font-size:14px; letter-spacing:-0.005em; padding:10px 18px; border-radius:var(--r); white-space:nowrap; line-height:1; cursor:pointer; text-decoration:none; border:1px solid transparent; transition:background .16s ease,transform .16s ease; }
.tp-btn--fill { background:var(--forest); color:var(--paper); }
.tp-btn--fill:hover { background:var(--forest-d); transform:translateY(-1px); }
.tp-nav-burger { display:none; width:42px; height:42px; border:1px solid var(--line-2); border-radius:var(--r); align-items:center; justify-content:center; background:transparent; cursor:pointer; }
.tp-nav-burger svg { width:20px; height:20px; stroke:var(--ink); stroke-width:1.8; }
.tp-nav-mobile { display:none; }
.tp-nav-mobile-list { display:flex; flex-direction:column; }
.tp-nav-mobile a, .tp-nav-m-sec > button { display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; padding:16px var(--pad-x); border-bottom:1px solid var(--line); font-family:var(--font-display); font-weight:600; font-size:17px; color:var(--ink); text-align:left; background:transparent; border-left:none; border-right:none; border-top:none; cursor:pointer; text-decoration:none; }
.tp-nav-m-sec > button .chev { width:18px; height:18px; transition:transform .18s ease; }
.tp-nav-m-sec.is-open > button .chev { transform:rotate(180deg); }
.tp-nav-m-sub { display:none; flex-direction:column; background:var(--paper-2); }
.tp-nav-m-sec.is-open .tp-nav-m-sub { display:flex; }
.tp-nav-m-sub a { font-size:15px; font-weight:500; color:var(--ink-2); padding-left:calc(var(--pad-x) + 16px); }
.tp-nav-mobile-cta { padding:20px var(--pad-x); display:flex; flex-direction:column; gap:10px; }
.tp-nav-mobile-cta .tp-btn { width:100%; }
.tp-nav-link-wrap { display:inline-flex; align-items:center; gap:4px; }
.tp-nav-child-b { font-family:var(--font-display); font-weight:600; font-size:14px; color:var(--ink); display:block; }
/* edit-only affordances */
.tp-nav-edit-x { background:transparent; border:none; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; }
.tp-nav-edit-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); padding:3px 8px; border-radius:var(--r); font-family:var(--font-mono); font-size:11px; cursor:pointer; }
.tp-nav-edit-href { font-size:11px; padding:4px 6px; border:1px solid var(--line-2); border-radius:var(--r); font-family:var(--font-mono); width:120px; }
.tp-nav[data-edit="1"] .tp-nav-drop-menu { position:static; opacity:1; visibility:visible; transform:none; box-shadow:none; margin-top:6px; }
@media (max-width:980px){
  .tp-nav-links { display:none; }
  .tp-nav-login span { display:none; }
  .tp-nav-burger { display:inline-flex; }
  .tp-nav.is-menu-open .tp-nav-mobile { display:block; position:fixed; left:0; right:0; top:61px; bottom:0; background:var(--paper); z-index:59; overflow-y:auto; border-top:1px solid var(--line); }
}
`;
