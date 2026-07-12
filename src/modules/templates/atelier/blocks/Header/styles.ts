// Atelier Header CSS (sticky nav) — edit + published parity. Provisional; refined
// in the phase-9 visual port. The section surface is paper; the block does NOT
// paint a full-bleed background (padding is inside the wrapper).

export const HEADER_STYLES = `
.lg-atelier-nav{ position:sticky; top:0; z-index:50; background:oklch(0.976 0.006 70 / 0.86); backdrop-filter:blur(12px); border-bottom:1px solid var(--line-soft); }
.lg-atelier-nav__row{ display:flex; align-items:center; justify-content:space-between; height:74px; gap:24px; }
.lg-atelier-brand{ display:flex; align-items:baseline; gap:0.5em; font-family:var(--ff-display); font-size:1.4rem; font-weight:600; letter-spacing:0.01em; color:var(--ink); text-decoration:none; }
.lg-atelier-brand__logo img{ max-height:38px; width:auto; display:block; }
.lg-atelier-nav__mid{ display:flex; gap:30px; font-weight:500; font-size:0.95rem; }
.lg-atelier-nav__link{ position:relative; padding:4px 0; color:var(--ink-soft); transition:color .15s; text-decoration:none; }
.lg-atelier-nav__link:hover{ color:var(--ink); }
.lg-atelier-nav__cta{ display:flex; align-items:center; gap:14px; }
@media(max-width:980px){ .lg-atelier-nav__mid{ display:none; } .lg-atelier-nav__row{ height:64px; } }
`;
