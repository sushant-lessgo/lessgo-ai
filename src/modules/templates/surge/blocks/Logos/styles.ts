// Shared CSS for the Surge logo strip (edit + published parity). `sg-` prefixed.
// Ported from Surge HTML (lines 379-382). Block does NOT paint the section bg —
// the data-surface="bg-1" wrapper does.

export const LOGOS_STYLES = `
.sg-logos {
  padding: 26px var(--sec-pad-x);
  display: flex; align-items: center; gap: 30px; flex-wrap: wrap; justify-content: center;
}
.sg-logos__ll {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--ink-3);
}
.sg-logos__logo {
  font-family: var(--font-display); font-weight: 800; font-size: 19px;
  letter-spacing: -0.02em; color: var(--ink-3); opacity: 0.85;
}
.sg-logos__item { position: relative; display: inline-flex; align-items: center; }
.sg-logos__remove {
  margin-left: 6px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--bg); border: 1px solid var(--line); color: var(--ink-3);
  font-size: 12px; line-height: 1; cursor: pointer; display: grid; place-items: center;
}
.sg-logos__add {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em;
  color: var(--ink-3); background: transparent; border: 1px dashed var(--line-2);
  border-radius: var(--r-pill); padding: 6px 14px; cursor: pointer;
}
.sg-logos__add:hover { border-color: var(--accent); color: var(--accent-deep); }
`;
