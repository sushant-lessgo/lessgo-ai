// Shared CSS for the Lumen "How a shoot works" process band (edit + published
// parity). `lm-` prefixed. Ported from Lumen HTML (.process / .steps, CSS lines
// ~220-231 + sec-head 190-198 + eyebrow 71-78, responsive 371-377). DARK band:
// the data-surface="esp" wrapper paints the espresso bg — this block only sets
// the on-dark text colors. Block does NOT paint the section bg itself.

export const PROCESS_STYLES = `
.lm-process{ max-width:var(--max-w); margin:0 auto; padding:var(--pad-y) var(--pad-x); color:var(--paper); }
.lm-process .lm-sec-head{ max-width:62ch; display:flex; flex-direction:column; gap:16px; margin-bottom:52px; }
.lm-process .lm-eyebrow{ font-family:var(--font-mono); font-weight:500; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:var(--brass-l); display:inline-flex; align-items:center; gap:11px; }
.lm-process .lm-eyebrow::before{ content:""; width:24px; height:1px; background:var(--line-dk); }
.lm-process .lm-sec-title{ font-family:var(--font-display); font-size:clamp(30px,4.2vw,50px); font-weight:400; letter-spacing:-0.012em; line-height:1.08; color:var(--paper); margin:0; }
.lm-process .lm-sec-title em{ font-style:italic; color:var(--brass-l); }
.lm-process .lm-lede{ font-family:var(--font-body); font-size:18px; line-height:1.66; color:oklch(0.82 0.02 70 / 0.82); margin:0; max-width:46ch; }
.lm-steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:0; border:1px solid var(--line-dk); }
.lm-step{ position:relative; padding:34px 30px 32px; border-right:1px solid var(--line-dk); }
.lm-step:last-child{ border-right:0; }
.lm-step .lm-sn{ display:inline-block; font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:var(--brass-l); }
.lm-step h3{ font-family:var(--font-display); color:var(--paper); font-size:23px; font-weight:500; margin:14px 0 10px; letter-spacing:-0.01em; }
.lm-step p{ margin:0; color:oklch(0.82 0.02 70 / 0.80); font-size:14.5px; line-height:1.6; }
.lm-step__rm{ position:absolute; top:12px; right:12px; width:20px; height:20px; border-radius:50%; background:var(--esp-d); border:1px solid var(--line-dk); color:oklch(0.82 0.02 70 / 0.8); font-size:12px; line-height:1; cursor:pointer; display:grid; place-items:center; }
.lm-step__rm:hover{ border-color:var(--brass-l); color:var(--brass-l); }
.lm-step-add{ margin-top:20px; font-family:var(--font-mono); font-size:11px; letter-spacing:0.04em; color:oklch(0.82 0.02 70 / 0.85); background:transparent; border:1px dashed var(--line-dk); border-radius:2px; padding:8px 16px; cursor:pointer; }
.lm-step-add:hover{ border-color:var(--brass-l); color:var(--brass-l); }
@media (max-width:760px){
  .lm-steps{ grid-template-columns:1fr; }
  .lm-step{ border-right:0; border-bottom:1px solid var(--line-dk); }
  .lm-step:last-child{ border-bottom:0; }
}
`;
