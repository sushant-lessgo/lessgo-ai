// Shared CSS for the Surge header (edit + published parity). All classes `sg-`
// prefixed. Ported from Surge HTML .nav/.brand/.btn (lines 258-291). The btn
// classes are (re)defined here so the header styles even when it renders before
// the hero. Header surface is `surface` (the data-surface wrapper paints it); the
// block adds only the bottom hairline.

export const HEADER_STYLES = `
.sg-nav {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center;
  padding: 18px var(--sec-pad-x); gap: 24px; border-bottom: 1px solid var(--line);
  position: relative; max-width: var(--max-w); margin: 0 auto;
}
.sg-brand { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 800; font-size: 19px; letter-spacing: -0.02em; color: var(--ink); }
.sg-brand__mark {
  width: 26px; height: 26px; border-radius: var(--r-xs); background: var(--ink);
  display: inline-flex; align-items: center; justify-content: center; flex: none;
}
.sg-brand__mark::before { content: "↗"; color: var(--accent); font-weight: 800; font-size: 16px; line-height: 1; }
.sg-nav-mid { display: flex; gap: 28px; justify-content: center; }
.sg-nav-mid a, .sg-nav-mid span { font-size: 14.5px; font-weight: 600; color: var(--ink-2); cursor: pointer; text-decoration: none; }
.sg-nav-mid a:hover, .sg-nav-mid span:hover { color: var(--ink); }
.sg-nav-right { display: flex; align-items: center; gap: 14px; }

.sg-btn {
  display: inline-flex; align-items: center; gap: 8px; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 15px; letter-spacing: -0.01em;
  padding: 13px 22px; border-radius: var(--r-sm); white-space: nowrap; cursor: pointer; text-decoration: none;
  border: 0; transition: transform 140ms ease, background 140ms ease, box-shadow 140ms ease;
}
.sg-btn--sm { padding: 9px 16px; font-size: 13.5px; }
.sg-btn--primary { background: var(--accent); color: var(--accent-on); box-shadow: var(--shadow-accent); }
.sg-btn--primary:hover { transform: translateY(-1px); background: var(--accent-deep); }

@media (max-width: 1080px) {
  .sg-nav { grid-template-columns: 1fr auto; }
  .sg-nav-mid { display: none; }
}
`;
