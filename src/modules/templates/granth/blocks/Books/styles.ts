// Books (पुस्तकें / GranthJacketShelf) CSS. Ported from template-design/WRDirection1Granth.html
// (.books/.book/.cover). CSS-typeset book jackets with page-block shadow + inset
// frame; a real uploaded cover replaces the face. `gr-` prefixed.

export const BOOKS_STYLES = `
.gr-books__eyebrow{ text-align:center; }
.gr-books__heading{ text-align:center; margin-bottom:8px; }
.gr-books__lead{ text-align:center; color:var(--ink-soft); max-width:44ch; margin:0 auto; font-family:var(--font-body); font-size:var(--fs-body); line-height:var(--lh-body); }
.gr-book-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:40px 32px; margin-top:60px; }
.gr-book{ text-align:center; }
.gr-cover{ aspect-ratio:2/3; display:flex; flex-direction:column; justify-content:space-between; padding:26px 18px; border:1px solid var(--hairline); background:var(--paper-2); position:relative; box-shadow:6px 8px 0 -2px var(--paper-2), 6px 8px 0 -1px var(--hairline); transition:transform .25s ease; overflow:hidden; }
.gr-book:hover .gr-cover{ transform:translateY(-5px); }
.gr-cover::before{ content:""; position:absolute; inset:9px; border:1px solid var(--hairline); pointer-events:none; z-index:2; }
.gr-cover__top{ font-family:var(--font-caption); font-size:.62rem; letter-spacing:.28em; color:var(--ink-soft); text-transform:uppercase; }
.gr-cover__title{ font-family:var(--font-display); font-size:1.35rem; line-height:1.5; }
.gr-cover__author{ font-family:var(--font-caption); font-size:.7rem; letter-spacing:.2em; color:var(--accent); }
.gr-cover-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:1; }
.gr-cover--v2{ background:linear-gradient(170deg,var(--paper-2),color-mix(in srgb,var(--ink) 12%,var(--paper-2))); }
.gr-cover--v3{ background:var(--accent); color:var(--accent-ink); }
.gr-cover--v3 .gr-cover__top, .gr-cover--v3 .gr-cover__author{ color:var(--accent-ink); opacity:.8; }
.gr-cover--v3::before{ border-color:rgba(255,255,255,.35); }
.gr-book__title{ font-family:var(--font-display); font-size:1.15rem; font-weight:400; margin-top:22px; }
.gr-book__meta{ font-family:var(--font-caption); font-size:.82rem; color:var(--ink-soft); margin-top:2px; line-height:1.7; }
.gr-book__sep{ color:var(--ink-soft); padding:0 .3em; }
.gr-buy{ display:inline-block; margin-top:12px; font-family:var(--font-caption); font-size:.86rem; letter-spacing:.05em; border-bottom:1px solid var(--accent); padding-bottom:2px; color:var(--accent); }
@media (max-width:720px){ .gr-book-grid{ grid-template-columns:repeat(2,1fr); gap:32px 20px; } }
`;
