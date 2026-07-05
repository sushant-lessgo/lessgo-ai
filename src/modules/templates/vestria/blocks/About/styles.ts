// About+stats CSS (edit + published parity). `vs-` prefixed. The DARK section
// surface comes from the [data-surface="dark"] wrapper — the block paints no
// full-bleed bg; text colours use the on-dark vars, scoped under .vs-about.
// Ported from the Vestria mock (.about / .stats).

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const ABOUT_STYLES = `
.vs-about__grid{ display:grid; grid-template-columns:0.9fr 1.1fr; gap:clamp(36px,5vw,72px); align-items:center; }
.vs-about__h2{ color:#fff; font-size:clamp(2rem,4vw,3.2rem); margin-top:0.5em; }
.vs-about__lede{ color:var(--on-dark-soft); margin-top:1.2em; font-size:1.08rem; }
.vs-about__body{ color:var(--on-dark-soft); margin-top:1.1em; }
.vs-about__frame{ position:relative; width:100%; height:clamp(340px,44vw,480px); border-radius:var(--r); overflow:hidden; }
.vs-about__frame img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.vs-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:0; margin-top:clamp(44px,5vw,64px); border-top:1.5px dashed var(--line-dark); padding-top:36px; }
.vs-stat{ padding-right:20px; border-right:1px solid var(--line-dark); }
.vs-stat:last-child{ border-right:0; }
.vs-stat__n{ font-family:var(--ff-display); font-size:clamp(2rem,3.4vw,2.9rem); font-weight:700; color:#fff; line-height:1; display:block; }
.vs-stat__l{ font-family:var(--ff-mono); font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--on-dark-soft); margin-top:10px; display:block; }
@media(max-width:860px){
  .vs-about__grid{ grid-template-columns:1fr; gap:32px; }
  .vs-about__media{ order:-1; }
  .vs-stats{ grid-template-columns:repeat(2,1fr); gap:28px 0; }
  .vs-stat:nth-child(2){ border-right:0; }
}
@media(max-width:460px){
  .vs-stats{ grid-template-columns:1fr; }
  .vs-stat{ border-right:0; border-bottom:1px solid var(--line-dark); padding-bottom:20px; }
  .vs-stat:last-child{ border-bottom:0; }
}
${HATCH_PLACEHOLDER_CSS}
`;
