// Shared CSS for the Surge multi-review testimonials grid (edit + published
// parity). `sg-rev` prefix (distinct from the single PullQuoteWithMark's
// `sg-review`). Ported from Surge HTML (lines 457-471 + the section head).

export const REVIEWGRID_STYLES = `
.sg-rev-section { padding: var(--sec-pad-y) var(--sec-pad-x); max-width: var(--max-w); margin: 0 auto; }
.sg-rev-head { max-width: 720px; margin-bottom: 44px; }
.sg-rev-eyebrow { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: var(--accent-deep); display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.sg-rev-eyebrow::before { content: "↗"; }
.sg-rev-title { font-family: var(--font-display); font-weight: 800; font-size: clamp(32px,4vw,50px); line-height: 1.02; letter-spacing: -0.035em; margin: 0; color: var(--ink); }
.sg-rev-title em { font-style: normal; color: var(--accent); }

.sg-reviews { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.sg-rev { border: 1px solid var(--line); border-radius: var(--r-lg); padding: 26px 24px; background: var(--surface); display: flex; flex-direction: column; position: relative; }
.sg-rev--feat { background: var(--panel); color: oklch(0.92 0.01 265); border-color: var(--panel-line); }
.sg-rev__mark { font-family: var(--font-serif); font-size: 52px; line-height: 0.6; color: var(--accent); height: 26px; }
.sg-rev__quote { font-size: 16px; line-height: 1.55; color: var(--ink); margin: 16px 0 22px; font-weight: 500; }
.sg-rev--feat .sg-rev__quote { color: oklch(0.95 0.01 265); }
.sg-rev__quote em { font-style: normal; background: linear-gradient(transparent 62%, var(--accent-soft) 62%); padding: 0 2px; font-weight: 700; color: var(--ink); }
.sg-rev--feat .sg-rev__quote em { background: none; color: var(--accent); }
.sg-rev__by { display: flex; align-items: center; gap: 11px; margin-top: auto; }
.sg-rev__av { width: 40px; height: 40px; border-radius: 50%; background: var(--tint-2); color: var(--accent-deep); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; font-size: 14px; background-size: cover; background-position: center; position: relative; overflow: hidden; }
.sg-rev--feat .sg-rev__av { background-color: var(--panel-2); color: var(--accent); }
.sg-rev__name { display: block; font-family: var(--font-display); font-weight: 700; font-size: 14.5px; }
.sg-rev__role { font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-3); }
.sg-rev--feat .sg-rev__role { color: oklch(0.68 0.02 265); }

.sg-rev__remove { position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; border-radius: 50%; background: var(--bg-1); color: var(--ink-3); border: 1px solid var(--line); cursor: pointer; line-height: 1; font-size: 14px; }
.sg-rev__remove:hover { color: var(--neg); border-color: var(--neg); }
.sg-rev--add { display: flex; align-items: center; justify-content: center; min-height: 160px; border: 1.5px dashed var(--line-2); background: transparent; color: var(--ink-3); font-family: var(--font-display); font-weight: 700; cursor: pointer; border-radius: var(--r-lg); }
.sg-rev--add:hover { border-color: var(--accent); color: var(--accent-deep); }

@media (max-width: 1080px) { .sg-reviews { grid-template-columns: 1fr; } }
`;
