// Shared CSS for the Surge About block (edit + published parity). All classes
// `sg-` prefixed. Ported from Surge HTML (.about lines 395-407, .sec-head 384-393).
// Block does NOT paint full-bleed section bg — the data-surface wrapper does.

export const ABOUT_STYLES = `
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

.sg-about { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: clamp(36px,5vw,72px); align-items: center; }
.sg-about__lede {
  font-family: var(--font-display); font-weight: 700; font-size: clamp(22px,2.6vw,30px);
  line-height: 1.22; letter-spacing: -0.02em; color: var(--ink); margin: 0 0 20px;
}
.sg-about__body { color: var(--ink-2); font-size: 16.5px; margin: 0 0 16px; max-width: 52ch; line-height: 1.6; }
.sg-about__tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
.sg-about__tag {
  font-family: var(--font-mono); font-size: 11.5px; font-weight: 500; color: var(--ink-2);
  background: var(--tint); padding: 7px 12px; border-radius: var(--r-pill); position: relative;
}
.sg-about__side { display: grid; gap: 12px; }
.sg-about__stat {
  border: 1px solid var(--line); border-radius: var(--r-lg); padding: 22px 24px;
  background: var(--surface); display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center;
  position: relative;
}
.sg-about__stat .big {
  font-family: var(--font-display); font-weight: 800; font-size: 42px; letter-spacing: -0.03em;
  color: var(--ink); line-height: 1; font-variant-numeric: tabular-nums;
}
.sg-about__stat .at { font-size: 14px; color: var(--ink-2); font-weight: 500; }
.sg-about__stat .at b { display: block; font-family: var(--font-display); font-weight: 700; color: var(--ink); font-size: 14.5px; }

.sg-about__add {
  background: transparent; border: 1px dashed var(--line-2); color: var(--ink-3);
  font-family: var(--font-body); font-size: 13px; cursor: pointer; border-radius: var(--r-md); padding: 10px 14px;
}
.sg-about__add:hover { border-color: var(--accent); color: var(--accent-deep); }
.sg-x-remove {
  position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%;
  background: var(--bg-1); border: 1px solid var(--line-2); color: var(--ink-2); font-size: 14px;
  line-height: 1; cursor: pointer; display: grid; place-items: center;
}
@media (max-width: 1080px) { .sg-about { grid-template-columns: 1fr; } }
`;
