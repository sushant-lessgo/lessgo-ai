// Shared CSS for the Surge packages block (edit + published parity). `sg-` prefix.
// Tight precise pricing cards; the featured tier gets accent emphasis. Surge has
// no native pricing section, so this is composed in Surge's card language.

export const PKG_STYLES = `
.sg-pkg { max-width: var(--max-w); margin: 0 auto; padding: var(--sec-pad-y) var(--sec-pad-x); }
.sg-pkg__head { max-width: 720px; margin: 0 auto 44px; text-align: center; }
.sg-sec-eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.13em;
  text-transform: uppercase; color: var(--accent-deep); display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;
}
.sg-sec-eyebrow::before { content: "↗"; }
.sg-sec-title { font-family: var(--font-display); font-weight: 800; font-size: clamp(32px,4vw,50px); line-height: 1.02; letter-spacing: -0.035em; margin: 0; color: var(--ink); }
.sg-sec-dek { font-size: 18px; color: var(--ink-2); margin: 16px auto 0; font-weight: 500; max-width: 60ch; }

.sg-pkg__grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; align-items: stretch; }
@media (max-width: 980px) { .sg-pkg__grid { grid-template-columns: 1fr; } }
.sg-pkg__card {
  position: relative; background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--r-lg); padding: 30px 26px 26px; display: flex; flex-direction: column; gap: 6px;
}
.sg-pkg__card.is-featured { border: 1.5px solid var(--accent); box-shadow: var(--shadow-m); }
.sg-pkg__name { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
.sg-pkg__card.is-featured .sg-pkg__name { color: var(--accent-deep); }
.sg-pkg__amount { font-family: var(--font-display); font-weight: 800; font-size: clamp(34px,4vw,48px); line-height: 1; letter-spacing: -0.03em; color: var(--ink); margin: 10px 0 2px; font-variant-numeric: tabular-nums; }
.sg-pkg__per { font-family: var(--font-mono); font-size: 11.5px; color: var(--ink-3); }
.sg-pkg__features { list-style: none; padding: 0; margin: 18px 0 24px; display: grid; gap: 9px; }
.sg-pkg__features li { font-family: var(--font-mono); font-size: 13px; color: var(--ink-2); padding-left: 18px; position: relative; }
.sg-pkg__features li::before { content: "›"; position: absolute; left: 2px; color: var(--accent); font-weight: 700; }
.sg-pkg__cta { width: 100%; justify-content: center; margin-top: auto; }

.sg-btn {
  display: inline-flex; align-items: center; gap: 8px; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 15px; letter-spacing: -0.01em;
  padding: 13px 22px; border-radius: var(--r-sm); white-space: nowrap; cursor: pointer; text-decoration: none;
  border: 0; transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease;
}
.sg-btn--primary { background: var(--accent); color: var(--accent-on); box-shadow: var(--shadow-accent); }
.sg-btn--primary:hover { transform: translateY(-1px); background: var(--accent-deep); }
.sg-btn--soft { background: var(--accent-soft); color: var(--accent-deep); }
.sg-btn--soft:hover { background: var(--tint-2); }

.sg-pkg__edit-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; }
.sg-pkg__feature-toggle, .sg-pkg__remove {
  background: var(--bg-1); border: 1px solid var(--line); color: var(--ink-2);
  font-size: 11px; padding: 4px 10px; border-radius: 999px; cursor: pointer;
}
.sg-pkg__remove { padding: 0 8px; font-size: 16px; line-height: 1; }
.sg-pkg__add {
  background: transparent; border: 1px dashed var(--line-2); color: var(--ink-2);
  font-family: var(--font-display); font-weight: 700; font-size: 15px; cursor: pointer;
  border-radius: var(--r-lg); min-height: 260px; display: flex; align-items: center; justify-content: center;
}
.sg-pkg__add:hover { border-color: var(--accent); color: var(--accent-deep); }
`;
