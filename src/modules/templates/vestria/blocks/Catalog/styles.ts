// Catalogue grid CSS (edit + published parity). `vs-` prefixed. Ported from the
// Vestria mock (#catalogue: .cat-head / .prod-grid / .prod). GRID-ONLY v1 — no
// detail-page links. Block does NOT paint a full-bleed section bg — the
// data-surface wrapper (paper-2) does.

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const CATALOG_STYLES = `
.vs-cat-head{ display:flex; justify-content:space-between; align-items:flex-end; gap:24px; flex-wrap:wrap; margin-bottom:clamp(28px,3.5vw,42px); }
.vs-cat-head__h2{ font-size:clamp(2rem,4vw,3.1rem); margin-top:0.5em; }
.vs-prod-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(14px,1.8vw,22px); }
.vs-prod{ border:1px solid var(--line-soft); background:var(--paper); transition:.2s; position:relative; }
.vs-prod:hover{ box-shadow:0 24px 44px -34px oklch(0.205 0.013 54 / 0.7); transform:translateY(-3px); }
.vs-prod__ph{ aspect-ratio:4/5; border-bottom:1px solid var(--line-soft); position:relative; overflow:hidden; }
.vs-prod__slot{ position:absolute; inset:0; }
.vs-prod__img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.vs-prod__glyph{ font-family:var(--ff-mono); font-size:0.66rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-soft); opacity:0.5; }
.vs-prod__art{ position:absolute; top:12px; left:12px; z-index:2; font-family:var(--ff-mono); font-size:0.62rem; letter-spacing:0.1em; background:var(--ink); color:var(--paper); padding:4px 8px; text-transform:uppercase; }
.vs-prod__meta{ padding:16px 16px 18px; }
.vs-prod__h3{ font-size:1.12rem; }
.vs-prod__cat{ font-family:var(--ff-mono); font-size:0.64rem; letter-spacing:0.12em; color:var(--accent-deep); text-transform:uppercase; margin-top:6px; display:block; }
@media(max-width:900px){ .vs-prod-grid{ grid-template-columns:repeat(3,1fr); } }
@media(max-width:640px){ .vs-prod-grid{ grid-template-columns:repeat(2,1fr); } }
${HATCH_PLACEHOLDER_CSS}
`;
