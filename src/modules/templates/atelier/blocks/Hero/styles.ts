// Atelier Hero CSS — edit + published parity. Provisional static-image hero; the
// slider frame + data-attr contract land in phase 9/10. Section surface is paper.

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const HERO_STYLES = `
${HATCH_PLACEHOLDER_CSS}
.lg-atelier-hero{ display:grid; grid-template-columns:1.05fr 0.95fr; gap:clamp(28px,5vw,72px); align-items:center; }
.lg-atelier-hero__h1{ font-size:clamp(2.6rem,6vw,4.8rem); }
.lg-atelier-hero__lede{ margin-top:1.1em; color:var(--ink-soft); max-width:46ch; font-size:1.1rem; }
.lg-atelier-hero__cta{ display:flex; gap:14px; margin-top:clamp(24px,3vw,36px); flex-wrap:wrap; }
.lg-atelier-hero__meta{ margin-top:1.4em; font-family:var(--ff-mono); font-size:0.78rem; letter-spacing:0.06em; color:var(--ink-soft); }
.lg-atelier-hero__media{ position:relative; aspect-ratio:4/5; border-radius:var(--r); overflow:hidden; background:var(--paper-2); }
.lg-atelier-hero__media img{ width:100%; height:100%; object-fit:cover; display:block; }
@media(max-width:860px){ .lg-atelier-hero{ grid-template-columns:1fr; } }
`;
