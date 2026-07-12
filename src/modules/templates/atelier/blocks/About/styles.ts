// Atelier About CSS — edit + published parity. Surface = paper. Provisional.

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const ABOUT_STYLES = `
${HATCH_PLACEHOLDER_CSS}
.lg-atelier-about{ display:grid; grid-template-columns:0.9fr 1.1fr; gap:clamp(28px,5vw,72px); align-items:center; }
.lg-atelier-about__media{ position:relative; aspect-ratio:4/5; border-radius:var(--r); overflow:hidden; background:var(--paper-2); }
.lg-atelier-about__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.lg-atelier-about__body{ margin-top:1.1em; color:var(--ink-soft); max-width:52ch; }
.lg-atelier-about__body p{ margin:0 0 1em; }
.lg-atelier-about__sig{ margin-top:1.2em; font-family:var(--ff-display); font-style:italic; color:var(--accent-deep); }
@media(max-width:860px){ .lg-atelier-about{ grid-template-columns:1fr; } }
`;
