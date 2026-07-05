// Lead-form (quote request) CSS — edit + published parity. `vs-` prefixed.
// Ported from the Vestria mock (#quote .lead-grid / .assur / .quote-form / .fld).
// Section surface is paper (wrapper); the form card paints its own bordered bg.

export const CONTACT_STYLES = `
.vs-lead{ scroll-margin-top:80px; }
.vs-lead__grid{ display:grid; grid-template-columns:0.85fr 1.15fr; gap:clamp(40px,5vw,80px); }
.vs-lead__h2{ font-size:clamp(2.1rem,4.2vw,3.3rem); margin-top:0.5em; }
.vs-lead__lede{ color:var(--ink-soft); margin-top:1.2em; font-size:1.08rem; max-width:40ch; }
.vs-assur{ margin-top:2em; display:flex; flex-direction:column; gap:14px; }
.vs-assur__row{ display:flex; gap:12px; align-items:flex-start; font-size:0.96rem; }
.vs-assur__k{ font-family:var(--ff-mono); font-size:0.7rem; letter-spacing:0.1em; color:var(--accent-deep); text-transform:uppercase; flex:none; width:22px; padding-top:2px; font-weight:700; }
.vs-form{ background:var(--paper); border:1px solid var(--line); padding:clamp(26px,3vw,40px); border-radius:var(--r); }
.vs-fld{ margin-bottom:20px; }
.vs-fld label{ display:block; font-family:var(--ff-mono); font-size:0.68rem; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:8px; }
.vs-req{ color:var(--accent-deep); margin-left:2px; }
.vs-fld input,.vs-fld select,.vs-fld textarea{ width:100%; font-family:var(--ff-body); font-size:1rem; color:var(--ink);
  background:var(--paper-2); border:1px solid var(--line); border-radius:var(--r); padding:0.8em 0.9em; transition:.15s; }
.vs-fld input:focus,.vs-fld select:focus,.vs-fld textarea:focus{ outline:none; border-color:var(--accent-deep); background:var(--paper); box-shadow:0 0 0 3px oklch(0.60 0.19 262 / 0.22); }
.vs-fld textarea{ resize:vertical; min-height:96px; }
.vs-form__foot{ display:flex; align-items:center; gap:16px; margin-top:8px; flex-wrap:wrap; }
.vs-form__note{ font-size:0.82rem; color:var(--ink-soft); margin:0; }
@media(max-width:820px){ .vs-lead__grid{ grid-template-columns:1fr; gap:36px; } }
`;
