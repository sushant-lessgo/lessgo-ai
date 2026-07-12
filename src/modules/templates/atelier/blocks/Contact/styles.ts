// Atelier Contact CSS — edit + published parity. Surface = paper-2. Provisional
// contact block; the shared lead-form placement lands in the phase-9 visual port.

export const CONTACT_STYLES = `
.lg-atelier-contact{ display:grid; grid-template-columns:1.1fr 0.9fr; gap:clamp(28px,5vw,72px); align-items:start; }
.lg-atelier-contact__lede{ margin-top:1.1em; color:var(--ink-soft); max-width:48ch; }
.lg-atelier-contact__details{ display:flex; flex-direction:column; gap:0.5em; font-family:var(--ff-mono); font-size:0.9rem; }
.lg-atelier-contact__details a{ color:var(--accent-deep); text-decoration:none; }
@media(max-width:820px){ .lg-atelier-contact{ grid-template-columns:1fr; } }
`;
