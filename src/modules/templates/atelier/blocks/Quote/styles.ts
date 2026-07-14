// Atelier Quote band CSS — static dark quote grid (NOT a marquee; the marquee is
// the Hero region). Ported from the approved design (index.html QUOTE BAND;
// atl-* → lg-atelier-). Surface = dark (colour from the section wrapper's
// data-surface; the block never paints its own full-bleed background).

export const QUOTE_STYLES = `
.lg-atelier-rule{ display:flex; flex-wrap:wrap; align-items:baseline; gap:10px 20px; border-top:2px solid var(--paper); padding-top:18px; margin-bottom:calc(clamp(28px,4vw,50px) * var(--space)); }
.lg-atelier-rule__idx{ font-family:var(--ff-display); font-weight:600; font-size:14px; color:var(--accent); }
.lg-atelier-rule h2{ font-size:clamp(30px,4.6vw,62px); font-weight:600; letter-spacing:-0.03em; color:var(--paper); }

.lg-atelier-quotes{ display:grid; grid-template-columns:repeat(auto-fit, minmax(min(320px,100%), 1fr)); gap:calc(48px * var(--space)) calc(56px * var(--space)); }
.lg-atelier-quote{ display:flex; flex-direction:column; gap:18px; margin:0; }
.lg-atelier-quote .lg-atelier-mark{ font-family:var(--ff-display); font-weight:700; font-size:64px; line-height:0.5; color:var(--accent); height:30px; }
.lg-atelier-quote p{ font-family:var(--ff-display); font-weight:500; font-size:clamp(19px,1.8vw,23px); line-height:1.4; letter-spacing:-0.01em; color:oklch(0.93 0.008 90); margin:0; }
.lg-atelier-quote .lg-atelier-who{ font-weight:600; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:oklch(0.74 0.01 90); }
.lg-atelier-quote .lg-atelier-who b{ color:var(--accent); font-weight:600; }
`;
