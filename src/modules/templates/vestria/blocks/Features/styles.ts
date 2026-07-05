// Services grid CSS (edit + published parity). `vs-` prefixed. Ported from the
// Vestria mock (.svc-grid / .svc). Shared utilities (vs-wrap, vs-tag,
// vs-eyebrow-block, vs-pad) come from the theme. Block does NOT paint a
// full-bleed section bg — the data-surface wrapper does.
//
// The mock's border rhythm (:nth-child) is applied to the List item wrappers
// (direct children of .vs-svc-grid), so it survives the E.List wrapper divs.

export const FEATURES_STYLES = `
.vs-svc-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:0; border:1px solid var(--line); border-radius:var(--r); overflow:hidden; background:var(--paper); }
.vs-svc{ padding:clamp(28px,3vw,40px); border-right:1px solid var(--line-soft); border-bottom:1px solid var(--line-soft); transition:background .2s; }
.vs-svc:hover{ background:var(--paper-2); }
.vs-svc-grid > .vs-svc:nth-child(3n){ border-right:0; }
.vs-svc__no{ font-family:var(--ff-mono); font-size:0.72rem; letter-spacing:0.14em; color:var(--accent-deep); display:block; }
.vs-svc__h3{ font-size:1.34rem; margin-top:1em; }
.vs-svc__p{ margin-top:0.6em; color:var(--ink-soft); font-size:0.97rem; }
@media(max-width:860px){
  .vs-svc-grid{ grid-template-columns:repeat(2,1fr); }
  .vs-svc-grid > .vs-svc:nth-child(3n){ border-right:1px solid var(--line-soft); }
  .vs-svc-grid > .vs-svc:nth-child(2n){ border-right:0; }
}
@media(max-width:520px){ .vs-svc-grid{ grid-template-columns:1fr; } .vs-svc{ border-right:0; } }
`;
