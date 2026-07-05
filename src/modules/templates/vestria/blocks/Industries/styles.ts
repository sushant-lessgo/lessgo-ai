// Industries-grid CSS (edit + published parity). `vs-` prefixed. Card bg dark is
// a CARD background (allowed) — the section surface (paper) comes from the
// data-surface wrapper. Ported from the Vestria mock (.ind-grid / .ind).
// NOTE: the mock's caption has pointer-events:none — dropped here so caption text
// stays click-editable in the editor (visually identical).

import { HATCH_PLACEHOLDER_CSS } from '../shared/styles';

export const INDUSTRIES_STYLES = `
.vs-ind-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(16px,2vw,26px); }
.vs-ind{ position:relative; overflow:hidden; background:var(--dark); border:1px solid var(--line-soft); }
.vs-ind__media{ position:relative; width:100%; height:300px; }
.vs-ind__media img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.vs-ind__cap{ position:absolute; inset:auto 0 0 0; padding:20px 22px 18px;
  background:linear-gradient(to top,oklch(0.19 0.013 52 / 0.92),oklch(0.19 0.013 52 / 0.15) 70%,transparent);
  color:var(--on-dark); }
.vs-ind__cap h3{ font-size:1.5rem; color:#fff; }
.vs-ind__n{ font-family:var(--ff-mono); font-size:0.68rem; letter-spacing:0.16em; color:var(--accent); text-transform:uppercase; margin-bottom:8px; display:block; }
.vs-ind__p{ font-size:0.9rem; color:var(--on-dark-soft); margin-top:5px; max-width:34ch; }
@media(max-width:900px){ .vs-ind-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:560px){ .vs-ind-grid{ grid-template-columns:1fr; } .vs-ind__media{ height:260px; } }
${HATCH_PLACEHOLDER_CSS}
`;
