// Shared CSS for the Surge CaseStudies block (edit + published parity). All
// classes `sg-` prefixed. Ported from Surge HTML (.cases/.case lines 428-446,
// .sec-head 384-393). Block does NOT paint full-bleed section bg.

export const CASES_STYLES = `
.sg-section { padding: var(--sec-pad-y) var(--sec-pad-x); max-width: var(--max-w); margin: 0 auto; }
.sg-sec-head { max-width: 720px; margin-bottom: 44px; }
.sg-sec-eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.13em;
  text-transform: uppercase; color: var(--accent-deep); display: inline-flex; align-items: center;
  gap: 8px; margin-bottom: 16px;
}
.sg-sec-eyebrow::before { content: "↗"; }
.sg-sec-title {
  font-family: var(--font-display); font-weight: 800; font-size: clamp(32px,4vw,50px);
  line-height: 1.02; letter-spacing: -0.035em; margin: 0; color: var(--ink);
}
.sg-sec-dek { font-size: 18px; color: var(--ink-2); margin: 16px 0 0; font-weight: 500; max-width: 60ch; }

.sg-cases { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
.sg-case {
  border: 1px solid var(--line); border-radius: var(--r-lg); padding: 26px 26px 24px;
  background: var(--surface); display: grid; gap: 16px; position: relative;
  transition: transform 160ms ease, box-shadow 160ms ease;
}
.sg-case:hover { transform: translateY(-3px); box-shadow: var(--shadow-m); }
.sg-case__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sg-case__client { display: flex; align-items: center; gap: 11px; }
.sg-case__mark {
  width: 38px; height: 38px; border-radius: var(--r-sm); background: var(--ink); color: var(--accent);
  display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-display);
  font-weight: 800; font-size: 16px; flex-shrink: 0;
}
.sg-case__client b { display: block; font-family: var(--font-display); font-weight: 700; font-size: 15.5px; letter-spacing: -0.01em; color: var(--ink); }
.sg-case__client small { font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-3); }
.sg-case__tag {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--accent-deep); background: var(--accent-soft);
  padding: 5px 10px; border-radius: var(--r-pill); white-space: nowrap;
}
.sg-case__headline {
  font-family: var(--font-display); font-weight: 700; font-size: 17px; line-height: 1.3;
  letter-spacing: -0.01em; margin: 0; color: var(--ink);
}
.sg-spark { width: 100%; height: 38px; display: block; }
.sg-case__metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; padding: 16px 0 4px; border-top: 1px solid var(--line); }
.sg-case__metric .v {
  font-family: var(--font-display); font-weight: 800; font-size: 27px; letter-spacing: -0.03em;
  color: var(--ink); line-height: 1; font-variant-numeric: tabular-nums;
}
/* metric value emphasis is the held GREEN (up/down), not the brand accent */
.sg-case__metric .v em { font-style: normal; color: var(--pos); }
.sg-case__metric .l { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-3); margin-top: 7px; }

.sg-case__add {
  background: transparent; border: 1px dashed var(--line-2); color: var(--ink-3);
  font-family: var(--font-body); font-size: 14px; cursor: pointer; border-radius: var(--r-lg);
  min-height: 180px;
}
.sg-case__add:hover { border-color: var(--accent); color: var(--accent-deep); }
.sg-x-remove {
  position: absolute; top: 12px; right: 12px; width: 24px; height: 24px; border-radius: 50%;
  background: var(--bg-1); border: 1px solid var(--line-2); color: var(--ink-2); font-size: 15px;
  line-height: 1; cursor: pointer; display: grid; place-items: center; z-index: 2;
}
@media (max-width: 1080px) { .sg-cases { grid-template-columns: 1fr; } }
`;

// Static rising green sparkline — illustrative (ported from Surge HTML line 1049).
export const SPARK_PATH = 'M0,34 L28,32 L56,30 L84,22 L112,18 L140,12 L168,8 L200,3';
