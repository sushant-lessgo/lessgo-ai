// Atelier Quote band CSS — edit + published parity. Surface = dark (the band's
// colour comes from the section wrapper's data-surface; the block does NOT paint
// its own full-bleed background). Provisional.

export const QUOTE_STYLES = `
.lg-atelier-quote{ text-align:center; max-width:34ch; margin:0 auto; }
.lg-atelier-quote__q{ font-family:var(--ff-display); font-weight:500; font-size:clamp(1.7rem,3.6vw,2.8rem); line-height:1.2; margin:0; }
.lg-atelier-quote__cite{ display:block; margin-top:1.2em; font-family:var(--ff-mono); font-size:0.8rem; letter-spacing:0.08em; color:var(--on-dark-soft); }
`;
