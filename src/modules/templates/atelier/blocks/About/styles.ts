// Atelier About CSS — ported from the approved design (styles.css ABOUT split +
// press strip; atl-* → lg-atelier-). Image wrappers declared position:relative for
// dual-renderer parity. Surface = paper. The About PAGE extras (press + studio
// split) render inside the same section (one surface) delineated by rules — see
// the core's PORT DEVIATION note.

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const ABOUT_STYLES = `
${HATCH_PLACEHOLDER_CSS}
.lg-atelier-split{ display:grid; grid-template-columns:1fr 1fr; gap:clamp(36px,5vw,80px); align-items:center; }
.lg-atelier-split--rev .lg-atelier-split-art{ order:2; }
.lg-atelier-split-art{ position:relative; }
.lg-atelier-split-art__img{ position:relative; display:block; aspect-ratio:4/5; overflow:hidden; }
.lg-atelier-split-art__img img{ width:100%; height:100%; object-fit:cover; display:block; }
.lg-atelier-badge{ position:absolute; left:0; bottom:0; z-index:2; background:var(--accent); color:#fff; font-weight:600; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; padding:12px 18px; }
.lg-atelier-split-copy h2{ font-family:var(--ff-display); font-size:clamp(30px,4.4vw,58px); font-weight:600; letter-spacing:-0.03em; margin:20px 0 0; line-height:0.98; }
.lg-atelier-split-copy h2 em{ font-style:normal; color:var(--accent-deep); }
.lg-atelier-split-copy p{ color:var(--ink-soft); font-size:16px; line-height:1.75; max-width:52ch; margin:22px 0 0; }
.lg-atelier-sign{ font-family:var(--ff-display); font-weight:600; font-size:26px; letter-spacing:-0.02em; margin-top:24px; }
.lg-atelier-split-actions{ margin-top:32px; display:flex; flex-wrap:wrap; gap:12px; }

/* press strip + studio split (About page extras — content.mode === 'page') */
.lg-atelier-about-extra{ margin-top:calc(clamp(56px,8vw,120px) * var(--space)); }
.lg-atelier-rule{ display:flex; flex-wrap:wrap; align-items:baseline; gap:10px 20px; border-top:2px solid var(--ink); padding-top:18px; margin-bottom:calc(clamp(28px,4vw,50px) * var(--space)); }
.lg-atelier-rule__idx{ font-family:var(--ff-display); font-weight:600; font-size:14px; color:var(--accent-deep); }
.lg-atelier-rule h2{ font-size:clamp(30px,4.6vw,62px); font-weight:600; letter-spacing:-0.03em; }
.lg-atelier-rule__meta{ margin-left:auto; font-weight:500; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-mute); max-width:30ch; text-align:right; line-height:1.6; }
.lg-atelier-press{ border-top:1px solid var(--line); }
.lg-atelier-press-row{ display:grid; grid-template-columns:auto 1fr auto; gap:clamp(16px,3vw,40px); align-items:baseline; padding:calc(22px * var(--space)) 0; border-bottom:1px solid var(--line); }
.lg-atelier-press-row .y{ font-family:var(--ff-display); font-weight:600; font-size:14px; color:var(--accent-deep); }
.lg-atelier-press-row .t{ font-family:var(--ff-display); font-weight:600; font-size:clamp(18px,2vw,24px); letter-spacing:-0.015em; }
.lg-atelier-press-row .w{ font-weight:500; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-mute); text-align:right; }

@media(max-width:900px){
  .lg-atelier-split{ grid-template-columns:1fr; gap:36px; }
  .lg-atelier-split--rev .lg-atelier-split-art{ order:0; }
  .lg-atelier-split-art{ max-width:460px; }
}
@media(max-width:560px){
  .lg-atelier-press-row{ grid-template-columns:auto 1fr; }
  .lg-atelier-press-row .w{ grid-column:1 / -1; text-align:left; }
}
`;
