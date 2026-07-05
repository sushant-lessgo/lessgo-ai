// Hero-specific CSS (edit + published parity). `vs-` prefixed. Shared utilities
// (vs-wrap, vs-tag, vs-btn, vs-display) are injected globally by the theme
// (tokens.ts serializeBaseTokens). Block does NOT paint a full-bleed section bg —
// the data-surface wrapper does. Ported from the Vestria mock (.hero + .values).

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const HERO_STYLES = `
.vs-hero{ padding-top:clamp(48px,7vw,86px); padding-bottom:clamp(40px,6vw,72px); overflow:hidden; }
.vs-hero__grid{ display:grid; grid-template-columns:1.05fr 0.95fr; gap:clamp(32px,5vw,64px); align-items:center; }
.vs-hero__h1{ font-size:clamp(2.9rem,6.4vw,5.4rem); letter-spacing:-0.02em; line-height:0.98; margin-top:0.55em; }
.vs-hero__lede{ margin-top:1.4em; font-size:1.18rem; color:var(--ink-soft); max-width:44ch; }
.vs-hero__cta{ display:flex; gap:14px; margin-top:2em; flex-wrap:wrap; }
.vs-hero__media{ position:relative; }
.vs-hero__frame{ position:relative; width:100%; height:min(58vh,560px); border-radius:var(--r); overflow:hidden; }
.vs-hero__frame img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.vs-hero__stamp{ position:absolute; left:-14px; bottom:26px; background:var(--paper); border:1px solid var(--line);
  padding:14px 18px; box-shadow:0 20px 40px -28px oklch(0.205 0.013 54 / 0.6); max-width:210px; z-index:2; }
.vs-hero__stamp-n{ font-family:var(--ff-display); font-size:1.9rem; font-weight:700; line-height:1; display:block; }
.vs-hero__stamp-l{ font-family:var(--ff-mono); font-size:0.66rem; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-soft); margin-top:4px; display:block; }
.vs-values{ border-top:1.5px dashed var(--line); margin-top:clamp(44px,6vw,72px); padding-top:clamp(32px,4vw,44px); }
.vs-values__grid{ display:grid; grid-template-columns:repeat(3,1fr); }
.vs-value{ padding:6px clamp(18px,3vw,34px); border-left:1px solid var(--line-soft); }
.vs-value:first-child{ border-left:0; padding-left:0; }
.vs-value__num{ font-family:var(--ff-mono); font-size:0.72rem; letter-spacing:0.18em; color:var(--accent-deep); text-transform:uppercase; display:block; }
.vs-value__h3{ font-size:1.32rem; margin-top:0.5em; }
.vs-value__p{ margin-top:0.5em; color:var(--ink-soft); font-size:0.98rem; }
@media(max-width:860px){
  .vs-hero__grid{ grid-template-columns:1fr; gap:36px; }
  .vs-hero__media{ order:-1; }
  .vs-hero__frame{ height:min(42vh,380px); }
}
@media(max-width:760px){ .vs-values__grid{ grid-template-columns:1fr; gap:24px; } .vs-value{ border-left:0; padding-left:0; } }
${HATCH_PLACEHOLDER_CSS}
`;
