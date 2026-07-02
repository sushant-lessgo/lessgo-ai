// Shared CSS for the Surge closing CTA band (edit + published parity). `sg-` prefix.
// A "book a growth audit" band with an accent-soft glow. The data-surface wrapper
// paints the section bg; this paints only the inner card.

export const CTA_STYLES = `
.sg-cta-wrap { max-width: var(--max-w); margin: 0 auto; padding: var(--sec-pad-y) var(--sec-pad-x); }
.sg-cta {
  position: relative; border-radius: var(--r-xl); padding: clamp(48px,7vw,96px) clamp(28px,5vw,72px);
  background:
    radial-gradient(circle at 30% 20%, var(--accent-soft), transparent 60%),
    var(--surface);
  border: 1px solid var(--line); text-align: center; overflow: hidden; box-shadow: var(--shadow-m);
}
.sg-cta__inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }
.sg-cta__eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.13em;
  text-transform: uppercase; color: var(--accent-deep); display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;
}
.sg-cta__eyebrow::before { content: "↗"; }
.sg-cta__headline {
  font-family: var(--font-display); font-weight: 800; font-size: clamp(34px,5vw,60px);
  line-height: 1.02; letter-spacing: -0.035em; color: var(--ink); margin: 0 0 16px;
}
.sg-cta__lede { font-size: 18.5px; line-height: 1.55; color: var(--ink-2); font-weight: 500; margin: 0 auto 32px; max-width: 46ch; }
.sg-cta__actions { display: flex; gap: 12px; justify-content: center; align-items: center; flex-wrap: wrap; }
.sg-cta__caption { display: block; font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); margin-top: 18px; }

.sg-btn {
  display: inline-flex; align-items: center; gap: 8px; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 15px; letter-spacing: -0.01em;
  padding: 13px 22px; border-radius: var(--r-sm); white-space: nowrap; cursor: pointer; text-decoration: none;
  border: 0; transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease;
}
.sg-btn--primary { background: var(--accent); color: var(--accent-on); box-shadow: var(--shadow-accent); }
.sg-btn--primary:hover { transform: translateY(-1px); background: var(--accent-deep); }
.sg-btn--ghost { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--line-2); }
.sg-btn--ghost:hover { box-shadow: inset 0 0 0 1.5px var(--ink); }
`;
