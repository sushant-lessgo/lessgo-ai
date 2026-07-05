// Testimonials (dark quote grid) CSS — edit + published parity. `vs-` prefixed.
// Ported from the Vestria mock (.testi / .quote). The DARK section background
// comes from the data-surface="dark" wrapper — the block only paints card
// borders/inner tones, scoped under .vs-testi.

export const TESTIMONIALS_STYLES = `
.vs-testi .vs-tag{ color:var(--accent); }
.vs-testi .vs-tag::before,.vs-testi .vs-tag::after{ border-color:var(--accent); }
.vs-testi .vs-h2{ color:#fff; }
.vs-testi__grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(18px,2.4vw,30px); margin-top:clamp(30px,4vw,50px); }
.vs-quote{ border:1px solid var(--line-dark); padding:clamp(24px,2.6vw,34px); display:flex; flex-direction:column; gap:20px; background:oklch(0.945 0.01 80 / 0.02); }
.vs-quote__mk{ font-family:var(--ff-display); font-size:3rem; line-height:0.4; color:var(--accent); height:0.5em; }
.vs-quote__p{ color:var(--on-dark); font-size:1.06rem; line-height:1.55; flex:1; margin:0; }
.vs-quote__who{ display:flex; flex-direction:column; gap:2px; border-top:1.5px dashed var(--line-dark); padding-top:16px; }
.vs-quote__nm{ font-weight:700; color:#fff; }
.vs-quote__rl{ font-family:var(--ff-mono); font-size:0.7rem; letter-spacing:0.08em; color:var(--on-dark-soft); text-transform:uppercase; }
@media(max-width:860px){ .vs-testi__grid{ grid-template-columns:1fr; } }
`;
