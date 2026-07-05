// Process rail CSS (edit + published parity). `vs-` prefixed. Ported from the
// Vestria mock (.proc-grid / .step). Block does NOT paint a full-bleed section
// bg — the data-surface wrapper (paper) does.

export const PROCESS_STYLES = `
.vs-proc{ }
.vs-proc__grid{ display:grid; grid-template-columns:repeat(5,1fr); gap:0; margin-top:clamp(28px,3.5vw,44px); }
.vs-step{ padding:0 clamp(14px,2vw,26px); border-left:1.5px dashed var(--line); position:relative; }
.vs-step:first-child{ border-left:0; padding-left:0; }
.vs-step__dot{ width:11px; height:11px; border-radius:50%; background:var(--accent-deep); margin-bottom:22px; }
.vs-step__k{ font-family:var(--ff-mono); font-size:0.72rem; letter-spacing:0.14em; color:var(--accent-deep); text-transform:uppercase; display:block; }
.vs-step__h3{ font-size:1.28rem; margin-top:0.7em; }
.vs-step__p{ margin-top:0.5em; color:var(--ink-soft); font-size:0.94rem; }
@media(max-width:900px){ .vs-proc__grid{ grid-template-columns:repeat(2,1fr); gap:32px 0; } .vs-step{ border-left:0; padding-left:0; } }
@media(max-width:520px){ .vs-proc__grid{ grid-template-columns:1fr; } }
`;
