// Atelier Header CSS — Atelier×Kontur 3-column nav, ported from the approved
// design (styles.css "NAV" block). atl-* → lg-atelier-; structure/values identical.
// Two modes: bare = overlay over the dark hero (light text); `.solid` = inner-page
// sticky blurred paper (dark text). Edit + published share this string (parity).

export const HEADER_STYLES = `
.lg-atelier-menu-toggle{ position:absolute; opacity:0; pointer-events:none; }
.lg-atelier-nav{ position:absolute; top:0; left:0; right:0; z-index:40; border-bottom:1px solid var(--line-dark); }
.lg-atelier-nav-in{ display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:24px; padding:18px var(--gutter); max-width:var(--wrap); margin:0 auto; }
.lg-atelier-nav-left, .lg-atelier-nav-right{ display:flex; align-items:center; gap:28px; min-width:0; }
.lg-atelier-nav-right{ justify-content:flex-end; }
.lg-atelier-nav a.lg-atelier-nl{ font-weight:500; font-size:13px; letter-spacing:0.06em; color:oklch(0.94 0.004 95 / 0.85); transition:color .2s; text-decoration:none; }
.lg-atelier-nav a.lg-atelier-nl:hover{ color:#fff; }
.lg-atelier-nav a.lg-atelier-nl[aria-current="page"]{ color:#fff; border-bottom:2px solid var(--accent); padding-bottom:3px; }
.lg-atelier-brand{ text-align:center; line-height:1; text-decoration:none; }
.lg-atelier-brand .lg-atelier-wm{ font-family:var(--ff-display); font-weight:700; font-size:22px; letter-spacing:-0.03em; color:#fff; display:inline-flex; align-items:center; gap:9px; white-space:nowrap; }
.lg-atelier-brand .lg-atelier-wm::before{ content:""; width:11px; height:11px; background:var(--accent); border-radius:50%; flex:none; }
.lg-atelier-brand-logo img{ max-height:34px; width:auto; display:block; }
.lg-atelier-lang{ display:inline-flex; align-items:center; gap:7px; }
.lg-atelier-lang button{ font:inherit; background:none; border:0; cursor:pointer; font-weight:600; font-size:11.5px; letter-spacing:0.08em; color:oklch(0.94 0.004 95 / 0.55); }
.lg-atelier-lang button[aria-pressed="true"]{ color:#fff; }
.lg-atelier-lang .lg-atelier-sep{ color:var(--line-dark); }
.lg-atelier-btn-nav{ display:inline-block; border:1.5px solid var(--paper); border-radius:var(--btn-r); color:var(--paper); font-weight:600; font-size:12px; letter-spacing:0.05em; padding:10px 18px; white-space:nowrap; text-decoration:none; transition:background .2s,color .2s; }
.lg-atelier-btn-nav:hover{ background:var(--paper); color:var(--ink); }

/* solid variant (inner pages) */
.lg-atelier-nav.solid{ position:sticky; background:oklch(0.978 0.004 95 / 0.92); backdrop-filter:blur(10px); border-bottom:1px solid var(--line); }
.lg-atelier-nav.solid a.lg-atelier-nl{ color:var(--ink-soft); }
.lg-atelier-nav.solid a.lg-atelier-nl:hover{ color:var(--ink); }
.lg-atelier-nav.solid a.lg-atelier-nl[aria-current="page"]{ color:var(--ink); }
.lg-atelier-nav.solid .lg-atelier-brand .lg-atelier-wm{ color:var(--ink); }
.lg-atelier-nav.solid .lg-atelier-lang button{ color:var(--ink-mute); }
.lg-atelier-nav.solid .lg-atelier-lang button[aria-pressed="true"]{ color:var(--ink); }
.lg-atelier-nav.solid .lg-atelier-lang .lg-atelier-sep{ color:var(--line); }
.lg-atelier-nav.solid .lg-atelier-btn-nav{ border-color:var(--ink); color:var(--ink); }
.lg-atelier-nav.solid .lg-atelier-btn-nav:hover{ background:var(--ink); color:var(--paper); }

/* CSS-only mobile menu (checkbox hack) */
.lg-atelier-burger{ display:none; width:42px; height:42px; flex-direction:column; align-items:center; justify-content:center; gap:5px; cursor:pointer; flex:none; }
.lg-atelier-burger span{ width:22px; height:2px; background:#fff; display:block; }
.lg-atelier-nav.solid .lg-atelier-burger span{ background:var(--ink); }
.lg-atelier-drawer{ display:none; }

@media (max-width:1100px){
  .lg-atelier-btn-nav{ display:none; }
}
@media (max-width:900px){
  .lg-atelier-nav-left{ display:none; }
  .lg-atelier-nav-in{ grid-template-columns:auto 1fr auto; }
  .lg-atelier-brand{ text-align:left; }
  .lg-atelier-burger{ display:flex; }
  .lg-atelier-drawer{ display:none; position:fixed; inset:0; z-index:90; }
  .lg-atelier-menu-toggle:checked ~ .lg-atelier-drawer{ display:block; }
  .lg-atelier-drawer .lg-atelier-drawer-scrim{ position:absolute; inset:0; background:oklch(0.15 0.01 60 / 0.5); }
  .lg-atelier-drawer .lg-atelier-drawer-panel{ position:absolute; top:0; right:0; bottom:0; width:min(82vw,360px); background:var(--paper); padding:28px var(--gutter); display:flex; flex-direction:column; gap:2px; }
  .lg-atelier-drawer .lg-atelier-drawer-panel a{ font-family:var(--ff-display); font-weight:600; font-size:26px; letter-spacing:-0.02em; padding:13px 0; border-bottom:1px solid var(--line); color:var(--ink); text-decoration:none; }
  .lg-atelier-drawer .lg-atelier-drawer-panel a:last-of-type{ border-bottom:0; }
  .lg-atelier-drawer .lg-atelier-drawer-close{ align-self:flex-end; font-size:26px; line-height:1; padding:6px 10px; cursor:pointer; color:var(--ink); }
}
`;
