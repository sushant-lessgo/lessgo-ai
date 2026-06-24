// Shared CSS for the Surge testimonial (edit + published parity). `sg-` prefixed.
// Surge's FEATURED dark review card. Ported from Surge HTML (.review.feat 457-471).

export const TESTI_STYLES = `
.sg-testi { max-width: 760px; margin: 0 auto; padding: var(--sec-pad-y) var(--sec-pad-x); }
.sg-testi__head { margin-bottom: 28px; }
.sg-testi__eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.13em;
  text-transform: uppercase; color: var(--accent-deep); display: inline-flex; align-items: center; gap: 8px;
}
.sg-testi__eyebrow::before { content: "↗"; }
.sg-review {
  background: var(--panel); color: oklch(0.92 0.01 265); border: 1px solid var(--panel-line);
  border-radius: var(--r-lg); padding: 30px 30px 26px; display: flex; flex-direction: column;
}
.sg-review__mark { font-family: var(--font-serif); font-size: 52px; line-height: 0.6; color: var(--accent); height: 26px; }
.sg-review__quote { font-size: 19px; line-height: 1.5; color: oklch(0.95 0.01 265); margin: 18px 0 24px; font-weight: 500; }
.sg-review__quote em { color: var(--accent); }
.sg-review__by { display: flex; align-items: center; gap: 12px; margin-top: auto; }
.sg-review__av {
  width: 42px; height: 42px; border-radius: 50%; background: var(--panel-2); color: var(--accent);
  display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 800; font-size: 14px;
  background-size: cover; background-position: center; flex-shrink: 0; position: relative;
}
.sg-review__name { display: block; font-family: var(--font-display); font-weight: 700; font-size: 14.5px; color: #fff; }
.sg-review__role { font-family: var(--font-mono); font-size: 10.5px; color: oklch(0.68 0.02 265); margin-top: 2px; }
.sg-review__meta { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); text-align: center; margin-top: 22px; }
`;
