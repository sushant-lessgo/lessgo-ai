// Shared CSS for the Surge stats band (edit + published parity). `sg-` prefixed.
// Ported from Surge HTML (lines 448-455). DARK panel band: the data-surface="panel"
// wrapper paints the bg, so the block only sets light text — it does NOT set the
// panel background itself.

export const STATS_STYLES = `
.sg-stats { padding: clamp(48px,6vw,76px) var(--sec-pad-x); }
.sg-stats__head { max-width: var(--max-w); margin: 0 auto 40px; }
.sg-stats__eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.13em;
  text-transform: uppercase; color: var(--accent); margin-bottom: 14px;
}
.sg-stats__title {
  font-family: var(--font-display); font-weight: 800; font-size: clamp(28px,3.4vw,42px);
  letter-spacing: -0.03em; line-height: 1.05; color: #fff; margin: 0;
}
.sg-stats__inner {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px;
  max-width: var(--max-w); margin: 0 auto;
}
.sg-stat { position: relative; padding-left: 20px; }
.sg-stat::before {
  content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 2px; background: var(--accent);
}
.sg-stat__big {
  font-family: var(--font-display); font-weight: 800; font-size: clamp(40px,5vw,60px);
  letter-spacing: -0.04em; line-height: 1; color: #fff; font-variant-numeric: tabular-nums;
}
.sg-stat__big em { font-style: normal; color: var(--accent); }
.sg-stat__lbl {
  font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.04em;
  color: oklch(0.7 0.02 265); margin-top: 12px;
}
.sg-stat__remove {
  position: absolute; top: -4px; right: 0; width: 22px; height: 22px; border-radius: 50%;
  background: var(--panel-2); border: 1px solid var(--panel-line); color: oklch(0.8 0.01 265);
  font-size: 14px; line-height: 1; cursor: pointer; display: grid; place-items: center;
}
.sg-stat--add {
  border: 1px dashed var(--panel-line); border-radius: var(--r-md); color: oklch(0.7 0.02 265);
  background: transparent; cursor: pointer; min-height: 92px; font-family: var(--font-mono); font-size: 12px;
}
.sg-stat--add:hover { border-color: var(--accent); color: var(--accent); }
@media (max-width: 1080px) { .sg-stats__inner { grid-template-columns: 1fr 1fr; gap: 26px 30px; } }
`;
