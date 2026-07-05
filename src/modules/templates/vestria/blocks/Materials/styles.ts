// Materials CSS (edit + published parity). `vs-` prefixed. Ported from the
// Vestria mock (.fabric / .fab-grid / .swatches / .fab-list). Block does NOT
// paint a full-bleed section bg — the data-surface wrapper (paper-2) does.
//
// Swatch colour is an inline style (item.color — manual_preferred content), so
// the CSS carries only the frame/label chrome.

export const MATERIALS_STYLES = `
.vs-fab-grid{ display:grid; grid-template-columns:1fr 1.15fr; gap:clamp(36px,5vw,80px); align-items:center; }
.vs-swatches{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.vs-sw{ position:relative; aspect-ratio:1; border:1px solid var(--line); overflow:hidden; box-shadow:inset 0 0 0 6px oklch(1 0 0 / 0.14); }
.vs-sw__lab{ position:absolute; inset:auto 0 0 0; background:oklch(1 0 0 / 0.86); padding:7px 10px; font-family:var(--ff-mono); font-size:0.6rem; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink); }
.vs-sw__code{ color:var(--accent-deep); }
.vs-fab__h2{ font-size:clamp(1.9rem,3.6vw,2.9rem); margin-top:0.5em; }
.vs-fab__lede{ color:var(--ink-soft); margin-top:1em; }
.vs-fab-list{ margin-top:1.6em; display:flex; flex-direction:column; }
.vs-fab-row{ display:flex; justify-content:space-between; gap:16px; padding:14px 0; border-top:1.5px dashed var(--line); align-items:baseline; }
.vs-fab-row__name{ font-family:var(--ff-display); font-size:1.14rem; font-weight:600; }
.vs-fab-row__use{ color:var(--ink-soft); font-size:0.92rem; text-align:right; max-width:26ch; }
@media(max-width:820px){ .vs-fab-grid{ grid-template-columns:1fr; gap:34px; } }
`;
