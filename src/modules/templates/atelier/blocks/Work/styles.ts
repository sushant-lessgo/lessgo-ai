// Atelier Work/Gallery CSS — the `gallery` capability's visible evidence section.
// Ported from the approved design (styles.css HOME mosaic + WORK filterable grid;
// atl-* → lg-atelier-). TWO modes share the `works` collection:
//   - mosaic (home teaser): 6-col dense grid, per-cell spans via :nth-child.
//   - gallery (work page):  CSS `columns:3` masonry.
// Image wrappers are declared position:relative to match the edit primitive's
// inline style (dual-renderer parity — never position:absolute on an E.Img wrapper).
// Surface = paper.

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const WORK_STYLES = `
${HATCH_PLACEHOLDER_CSS}
/* ---------- Kontur rule header ---------- */
.lg-atelier-rule{ display:flex; flex-wrap:wrap; align-items:baseline; gap:10px 20px; border-top:2px solid var(--ink); padding-top:18px; margin-bottom:calc(clamp(28px,4vw,50px) * var(--space)); }
[data-surface="dark"] .lg-atelier-rule{ border-top-color:var(--paper); }
.lg-atelier-rule__idx{ font-family:var(--ff-display); font-weight:600; font-size:14px; color:var(--accent-deep); }
[data-surface="dark"] .lg-atelier-rule__idx{ color:var(--accent); }
.lg-atelier-rule h2{ font-size:clamp(30px,4.6vw,62px); font-weight:600; letter-spacing:-0.03em; }
.lg-atelier-rule__meta{ margin-left:auto; font-weight:500; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-mute); max-width:30ch; text-align:right; line-height:1.6; }
[data-surface="dark"] .lg-atelier-rule__meta{ color:var(--on-dark-soft); }

/* ---------- HOME mosaic (6-col dense; per-cell spans via nth-child) ---------- */
.lg-atelier-mosaic{ display:grid; grid-template-columns:repeat(6,1fr); gap:calc(18px * var(--space)); grid-auto-flow:dense; }
.lg-atelier-mosaic > .lg-atelier-cell{ position:relative; overflow:hidden; display:block; }
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+1){ grid-column:span 4; grid-row:span 2; }
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+2),
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+3),
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+4),
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+5),
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+6){ grid-column:span 2; }
.lg-atelier-cell__media{ position:relative; overflow:hidden; height:100%; aspect-ratio:3/2; }
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+1) .lg-atelier-cell__media{ aspect-ratio:auto; }
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+2) .lg-atelier-cell__media,
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+3) .lg-atelier-cell__media{ aspect-ratio:4/5; }
.lg-atelier-mosaic > .lg-atelier-cell:nth-child(6n+5) .lg-atelier-cell__media{ aspect-ratio:1/1; }
.lg-atelier-cell__img{ position:relative; display:block; width:100%; height:100%; }
.lg-atelier-cell__img img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .9s cubic-bezier(.2,.7,.2,1); }
.lg-atelier-cell:hover .lg-atelier-cell__img img{ transform:scale(1.045); }
.lg-atelier-cell::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, transparent 55%, oklch(0.13 0.01 60 / 0.55)); pointer-events:none; z-index:1; }
.lg-atelier-cap{ position:absolute; left:14px; bottom:12px; z-index:2; color:#fff; font-weight:600; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; display:inline-flex; align-items:center; gap:8px; }
.lg-atelier-cap::before{ content:""; width:7px; height:7px; background:var(--accent); border-radius:50%; flex:none; }
.lg-atelier-more{ text-align:center; margin-top:calc(44px * var(--space)); }
.lg-atelier-vh{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

/* ---------- WORK page masonry (CSS columns) ---------- */
.lg-atelier-gallery{ columns:3; column-gap:calc(18px * var(--space)); }
.lg-atelier-gallery > .lg-atelier-gcell{ break-inside:avoid; margin:0 0 calc(18px * var(--space)); display:block; position:relative; overflow:hidden; }
.lg-atelier-gcell__media{ position:relative; overflow:hidden; aspect-ratio:4/5; }
.lg-atelier-gcell__img{ position:relative; display:block; width:100%; height:100%; }
.lg-atelier-gcell__img img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .9s cubic-bezier(.2,.7,.2,1); }
.lg-atelier-gcell:hover .lg-atelier-gcell__img img{ transform:scale(1.045); }
.lg-atelier-gcell::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, transparent 60%, oklch(0.13 0.01 60 / 0.55)); pointer-events:none; z-index:1; }
.lg-atelier-gcap{ position:absolute; left:14px; right:14px; bottom:12px; z-index:2; color:#fff; display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
.lg-atelier-gcap__t{ font-family:var(--ff-display); font-weight:600; font-size:17px; letter-spacing:-0.01em; }
.lg-atelier-gcap__c{ font-weight:600; font-size:9.5px; letter-spacing:0.2em; text-transform:uppercase; color:oklch(0.9 0.01 90 / 0.85); flex:none; }

@media(max-width:900px){
  .lg-atelier-mosaic{ grid-template-columns:repeat(2,1fr); }
  .lg-atelier-mosaic > .lg-atelier-cell{ grid-column:span 1 !important; grid-row:span 1 !important; }
  .lg-atelier-gallery{ columns:2; }
}
@media(max-width:560px){
  .lg-atelier-mosaic{ grid-template-columns:1fr; }
  .lg-atelier-gallery{ columns:1; }
}
`;
