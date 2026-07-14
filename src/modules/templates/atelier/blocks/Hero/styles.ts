// Atelier Hero CSS — Atelier×Kontur "Tile A" cover slider + marquee + inner-page
// page-head. Ported from the approved design (styles.css COVER / MARQUEE /
// page-head). atl-* → lg-atelier-; keyframe atl-scrollx → lg-atelier-scrollx.
// Placeholder rules are SCOPED under .lg-atelier-cover so they don't collide with
// the shared HATCH placeholder used by the (still-provisional) 9b content blocks.
// Edit + published share this string (parity). Section surface = dark.

export const HERO_STYLES = `
/* ---------- cover ---------- */
.lg-atelier-cover{ position:relative; min-height:clamp(560px, 90vh, 920px); display:flex; align-items:center; justify-content:center; overflow:hidden; }
.lg-atelier-slides{ position:absolute; inset:0; }
.lg-atelier-slide{ position:absolute; inset:0; opacity:0; transition:opacity 1.2s ease; }
.lg-atelier-slide.is-active{ opacity:1; }
.lg-atelier-slide-ph{ position:absolute; inset:0; }
.lg-atelier-slide-img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.lg-atelier-cover .lg-atelier-ph{ position:absolute; inset:0; overflow:hidden; background:oklch(0.24 0.010 60);
  background-image:linear-gradient(160deg, oklch(0 0 0 / 0.35), transparent 55%), repeating-linear-gradient(45deg, oklch(1 0 0 / 0.05) 0 1px, transparent 1px 16px); }
.lg-atelier-ph-num{ position:absolute; right:4vw; bottom:-0.12em; font-family:var(--ff-display); font-weight:800; font-size:clamp(180px,32vw,460px); line-height:1; letter-spacing:-0.05em; color:oklch(1 0 0 / 0.07); user-select:none; }
@media (prefers-reduced-motion: reduce){ .lg-atelier-slide{ transition:none; } }
.lg-atelier-cover::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, oklch(0.13 0.01 60 / 0.45) 0%, oklch(0.13 0.01 60 / 0.14) 40%, oklch(0.13 0.01 60 / 0.52) 100%); z-index:1; pointer-events:none; }
.lg-atelier-cover-in{ position:relative; z-index:2; text-align:center; color:var(--paper); padding:110px var(--gutter) 130px; max-width:1100px; display:flex; flex-direction:column; align-items:center; }
.lg-atelier-cover-in .lg-atelier-label{ color:oklch(0.94 0.006 95); }
.lg-atelier-cover__h1{ color:#fff; font-weight:700; letter-spacing:-0.045em; line-height:0.9; margin-top:26px; font-size:clamp(52px, 9vw, 138px); }
.lg-atelier-cover__h1 em{ font-style:normal; color:var(--accent); }
.lg-atelier-tagline{ font-family:var(--ff-body); font-weight:300; font-size:clamp(17px, 2vw, 22px); line-height:1.5; color:oklch(0.94 0.006 95 / 0.92); max-width:44ch; margin:26px 0 0; }
.lg-atelier-cover-actions{ display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin-top:40px; }

/* ---------- arrows / dots / scroll ---------- */
.lg-atelier-arrows{ position:absolute; inset:0; z-index:3; pointer-events:none; }
.lg-atelier-arrow{ pointer-events:auto; position:absolute; top:50%; transform:translateY(-50%); width:52px; height:52px; display:grid; place-items:center; color:#fff; border:1px solid var(--line-dark); background:oklch(0.16 0.01 60 / 0.35); cursor:pointer; transition:background .2s, border-color .2s, color .2s; }
.lg-atelier-arrow:hover{ border-color:var(--accent); color:var(--accent); }
.lg-atelier-arrow svg{ width:20px; height:20px; stroke:currentColor; stroke-width:1.6; fill:none; }
.lg-atelier-arrow-prev{ left:clamp(14px,2.5vw,34px); }
.lg-atelier-arrow-next{ right:clamp(14px,2.5vw,34px); }
.lg-atelier-dots{ position:absolute; bottom:26px; left:50%; transform:translateX(-50%); z-index:3; display:flex; gap:12px; }
.lg-atelier-dot{ width:10px; height:10px; border-radius:50%; border:1px solid oklch(1 0 0 / 0.75); background:transparent; padding:0; cursor:pointer; transition:background .2s, border-color .2s, transform .2s; }
.lg-atelier-dot[aria-current="true"]{ background:var(--accent); border-color:var(--accent); transform:scale(1.15); }
.lg-atelier-scroll{ position:absolute; bottom:22px; left:var(--gutter); z-index:2; color:oklch(0.94 0.006 95 / 0.7); font-weight:600; font-size:10px; letter-spacing:0.3em; text-transform:uppercase; display:flex; align-items:center; gap:12px; }
.lg-atelier-scroll-line{ width:44px; height:1px; background:oklch(0.94 0.006 95 / 0.5); }

/* ---------- marquee (hero region, home) ---------- */
.lg-atelier-marquee{ background:var(--ink); color:var(--paper); overflow:hidden; }
.lg-atelier-marquee-track{ display:inline-flex; white-space:nowrap; will-change:transform; animation:lg-atelier-scrollx 32s linear infinite; }
.lg-atelier-marquee-track span{ font-family:var(--ff-display); font-weight:500; font-size:clamp(20px,2.6vw,30px); letter-spacing:-0.01em; padding:14px 0; display:inline-flex; align-items:center; }
.lg-atelier-marquee-track span::after{ content:"✳"; color:var(--accent); margin:0 clamp(22px,3vw,44px); font-size:0.7em; }
@keyframes lg-atelier-scrollx{ to{ transform:translateX(-50%); } }
@media (prefers-reduced-motion: reduce){ .lg-atelier-marquee-track{ animation:none; } }

/* ---------- page head (inner pages) ---------- */
.lg-atelier-page-head{ padding:calc(clamp(64px,9vw,120px) * var(--space)) 0 calc(clamp(44px,6vw,80px) * var(--space)); }
.lg-atelier-page-head__h1{ font-size:clamp(44px,7.5vw,110px); font-weight:700; letter-spacing:-0.045em; line-height:0.9; color:#fff; margin-top:22px; }
.lg-atelier-page-head__h1 em{ font-style:normal; color:var(--accent); }
.lg-atelier-page-head__lede{ color:var(--on-dark-soft); margin:22px 0 0; max-width:52ch; }

/* ---------- responsive ---------- */
@media (max-width:1100px){ .lg-atelier-cover .lg-atelier-slide-tag{ display:none; } }
@media (max-width:900px){ .lg-atelier-arrow{ width:44px; height:44px; } }
@media (max-width:560px){
  .lg-atelier-cover-actions .lg-atelier-btn{ flex:1; }
  .lg-atelier-scroll{ display:none; }
  .lg-atelier-dots{ bottom:20px; }
}
`;
