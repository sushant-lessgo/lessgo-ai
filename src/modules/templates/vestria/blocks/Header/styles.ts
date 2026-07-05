// Header CSS (util bar + nav) — edit + published parity. Ported from the mock
// (.util + .nav). The util strip is an INNER element of the header block (its own
// bg is allowed — not a full-bleed section paint; the section surface is paper).
// Sticky positioning works published; the scroll-shadow JS nicety is skipped v1.

export const HEADER_STYLES = `
.vs-util{ background:var(--dark-2); color:var(--on-dark-soft); font-size:0.8rem; font-family:var(--ff-mono); letter-spacing:0.04em; }
.vs-util__row{ display:flex; justify-content:space-between; align-items:center; gap:16px; min-height:40px; }
.vs-util a{ color:var(--on-dark-soft); transition:.15s; text-decoration:none; }
.vs-util a:hover{ color:var(--accent); }
.vs-util__right{ display:flex; gap:22px; align-items:center; }
.vs-util__sep{ color:var(--accent); }
@media(max-width:720px){ .vs-util__note{ display:none; } .vs-util{ font-size:0.72rem; } }
.vs-nav{ position:sticky; top:0; z-index:50; background:oklch(0.975 0.004 252 / 0.86); backdrop-filter:blur(12px); border-bottom:1px solid var(--line-soft); }
.vs-nav__row{ display:flex; align-items:center; justify-content:space-between; height:76px; gap:24px; }
.vs-brand{ display:flex; align-items:baseline; gap:0.5em; font-family:var(--ff-display); font-size:1.5rem; font-weight:700; letter-spacing:0.01em; color:var(--ink); text-decoration:none; }
.vs-brand__logo{ display:inline-flex; align-items:center; }
.vs-brand__logo img{ max-height:40px; width:auto; display:block; }
.vs-brand__mark{ font-size:0.6rem; font-family:var(--ff-mono); letter-spacing:0.2em; color:var(--accent-deep); text-transform:uppercase; transform:translateY(-0.4em); }
.vs-nav__mid{ display:flex; gap:32px; font-weight:500; font-size:0.96rem; }
.vs-nav__mid a,.vs-nav__link{ position:relative; padding:4px 0; color:var(--ink-soft); transition:color .15s; text-decoration:none; }
.vs-nav__mid a:hover,.vs-nav__link:hover{ color:var(--ink); }
.vs-nav__link::after{ content:""; position:absolute; left:0; bottom:-2px; height:1.5px; width:0; background:var(--accent); transition:width .2s; }
.vs-nav__link:hover::after{ width:100%; }
.vs-nav__cta{ display:flex; align-items:center; gap:14px; }
@media(max-width:980px){ .vs-nav__mid{ display:none; } .vs-nav__row{ height:66px; } }
@media(max-width:560px){ .vs-nav__cta .vs-btn.vs-ghost{ display:none; } }
`;
