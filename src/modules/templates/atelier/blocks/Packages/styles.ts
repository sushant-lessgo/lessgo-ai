// Atelier Packages CSS — edit + published parity. The `packages` capability's
// evidence section; 2–4 cards (capacity enforced by the manifest). Surface =
// paper-2. Provisional; refined in phase 9.

export const PACKAGES_STYLES = `
.lg-atelier-pkg__grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:clamp(16px,2.4vw,28px); margin-top:clamp(28px,4vw,44px); }
.lg-atelier-pkg__card{ border:1px solid var(--line); border-radius:var(--r); padding:clamp(22px,2.6vw,32px); background:var(--paper); display:flex; flex-direction:column; gap:0.6em; }
.lg-atelier-pkg__card--featured{ border-color:var(--accent-deep); }
.lg-atelier-pkg__name{ font-family:var(--ff-display); font-weight:600; font-size:1.3rem; }
.lg-atelier-pkg__price{ font-family:var(--ff-mono); color:var(--accent-deep); font-size:1rem; }
.lg-atelier-pkg__summary{ color:var(--ink-soft); font-size:0.94rem; }
.lg-atelier-pkg__features{ list-style:none; margin:0.4em 0 0; padding:0; display:flex; flex-direction:column; gap:0.4em; font-size:0.9rem; color:var(--ink-soft); }
.lg-atelier-pkg__features li::before{ content:"—"; color:var(--accent); margin-right:0.5em; }
.lg-atelier-pkg__cta{ margin-top:auto; }
`;
