// Footer (dark-2) CSS — edit + published parity. `vs-` prefixed. Ported from the
// Vestria mock (.foot). The dark-2 section background comes from the
// data-surface="dark-2" wrapper; the block paints only inner tones. Includes the
// optional fixed WhatsApp FAB.

export const FOOTER_STYLES = `
.vs-foot{ padding-top:clamp(56px,6vw,84px); color:var(--on-dark-soft); }
.vs-foot__grid{ display:grid; grid-template-columns:1.4fr 1fr 1fr 1.2fr; gap:clamp(28px,4vw,56px); }
.vs-foot__brand{ color:#fff; font-family:var(--ff-display); font-size:1.6rem; font-weight:700; margin-bottom:1em; display:block; }
.vs-foot__blurb{ font-size:0.96rem; max-width:34ch; margin:0; }
.vs-foot__h4{ font-family:var(--ff-mono); font-size:0.72rem; letter-spacing:0.14em; text-transform:uppercase; font-weight:500; margin:0 0 1.2em; color:var(--accent); }
.vs-foot__list{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:11px; font-size:0.96rem; }
.vs-foot__list a{ color:var(--on-dark-soft); text-decoration:none; transition:.15s; }
.vs-foot__list a:hover{ color:#fff; }
.vs-foot__addr{ font-size:0.96rem; line-height:1.7; }
.vs-foot__addr b{ color:#fff; font-weight:600; }
.vs-foot__addr a{ color:var(--on-dark-soft); text-decoration:none; }
.vs-foot__addr a:hover{ color:#fff; }
.vs-foot__map{ margin-top:16px; border:1px solid var(--line-dark); height:110px;
  background:repeating-linear-gradient(45deg,oklch(0.945 0.01 80 / 0.04),oklch(0.945 0.01 80 / 0.04) 10px,transparent 10px,transparent 20px);
  display:flex; align-items:center; justify-content:center; font-family:var(--ff-mono); font-size:0.66rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--on-dark-soft); }
.vs-foot__bot{ border-top:1.5px dashed var(--line-dark); margin-top:clamp(44px,5vw,64px); padding:26px 0; display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; font-family:var(--ff-mono); font-size:0.72rem; letter-spacing:0.06em; color:var(--on-dark-soft); }
@media(max-width:860px){ .vs-foot__grid{ grid-template-columns:1fr 1fr; } }
@media(max-width:520px){ .vs-foot__grid{ grid-template-columns:1fr; } }
.vs-wa-fab{ position:fixed; right:20px; bottom:20px; z-index:60; display:inline-flex; align-items:center; gap:10px;
  background:#25D366; color:#fff; border-radius:999px; padding:12px 18px; font-weight:600; font-size:0.95rem;
  box-shadow:0 12px 30px -12px rgba(0,0,0,.45); text-decoration:none; transition:transform .15s; }
.vs-wa-fab:hover{ transform:translateY(-2px); }
.vs-wa-fab svg{ width:20px; height:20px; fill:currentColor; }
`;
