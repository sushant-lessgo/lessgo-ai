// Atelier Footer CSS — edit + published parity. Surface = dark-2. Provisional.

export const FOOTER_STYLES = `
.lg-atelier-foot{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:24px; align-items:flex-start; }
.lg-atelier-foot__brand{ font-family:var(--ff-display); font-weight:600; font-size:1.3rem; color:var(--on-dark); }
.lg-atelier-foot__tagline{ margin-top:0.4em; color:var(--on-dark-soft); font-size:0.92rem; max-width:38ch; }
.lg-atelier-foot__contact{ display:flex; flex-direction:column; gap:0.4em; font-family:var(--ff-mono); font-size:0.84rem; color:var(--on-dark-soft); }
.lg-atelier-foot__contact a{ color:var(--on-dark-soft); text-decoration:none; }
.lg-atelier-foot__contact a:hover{ color:var(--accent); }
.lg-atelier-foot__social{ display:flex; gap:16px; font-family:var(--ff-mono); font-size:0.82rem; }
.lg-atelier-foot__social a{ color:var(--on-dark-soft); text-decoration:none; }
.lg-atelier-foot__copy{ width:100%; margin-top:clamp(28px,3vw,44px); padding-top:16px; border-top:1px solid var(--line-dark); font-family:var(--ff-mono); font-size:0.78rem; color:var(--on-dark-soft); }
`;
