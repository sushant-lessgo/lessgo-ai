// Atelier Work/Gallery CSS — edit + published parity. The `gallery` capability's
// visible evidence section. Provisional grid; refined in phase 9. Surface = paper.

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const WORK_STYLES = `
${HATCH_PLACEHOLDER_CSS}
.lg-atelier-work__grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(14px,2vw,26px); margin-top:clamp(28px,4vw,44px); }
.lg-atelier-work__item{ position:relative; }
.lg-atelier-work__media{ position:relative; aspect-ratio:4/5; border-radius:var(--r); overflow:hidden; background:var(--paper-2); }
.lg-atelier-work__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.lg-atelier-work__title{ margin-top:0.7em; font-weight:600; font-size:0.98rem; }
.lg-atelier-work__caption{ margin-top:0.2em; color:var(--ink-soft); font-size:0.86rem; }
@media(max-width:860px){ .lg-atelier-work__grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:520px){ .lg-atelier-work__grid{ grid-template-columns:1fr; } }
`;
