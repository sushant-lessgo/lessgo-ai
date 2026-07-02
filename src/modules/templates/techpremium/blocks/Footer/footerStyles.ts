// Shared footer + WhatsApp-FAB CSS (edit + published). tp- prefixed port of
// naayom.css .footer* + .wa-fab. Keeps the Phase-2 newsletter (.tp-news*) classes.

export const FOOTER_STYLES = `
.tp-footer { background:var(--forest-d); color:oklch(0.84 0.022 140 / 0.82); font-family:var(--font-body); }
.tp-footer__top { display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr; gap:36px; padding:var(--pad-y) var(--pad-x) 44px; max-width:var(--max-w); margin:0 auto; }
.tp-footer__brand-wm { display:inline-flex; align-items:center; gap:11px; font-family:var(--font-display); font-weight:700; font-size:21px; letter-spacing:-0.02em; color:var(--paper); }
.tp-footer__mk { width:34px; height:34px; border-radius:7px; background:oklch(0.34 0.045 158); display:grid; place-items:center; position:relative; flex-shrink:0; }
.tp-footer__mk::before { content:""; width:14px; height:14px; border-radius:50%; border:2px solid var(--lime); }
.tp-footer__mk::after { content:""; position:absolute; width:5px; height:5px; border-radius:50%; background:var(--lime); }
.tp-footer__img { height:32px; width:auto; max-width:200px; object-fit:contain; flex-shrink:0; }
.tp-footer__blurb { font-size:14px; line-height:1.7; max-width:34ch; margin:18px 0; color:oklch(0.84 0.022 140 / 0.78); }
.tp-footer__contact { font-family:var(--font-mono); font-size:12.5px; line-height:1.9; letter-spacing:0.02em; }
.tp-footer__contact a { color:inherit; text-decoration:none; }
.tp-footer__contact a:hover { color:var(--paper); }
.tp-footer__social { display:flex; flex-wrap:wrap; align-items:flex-start; gap:10px; margin-top:18px; }
.tp-footer__social a { width:34px; height:34px; border:1px solid var(--line-dk); border-radius:var(--r); display:grid; place-items:center; color:oklch(0.84 0.022 140 / 0.7); }
.tp-footer__social a:hover { border-color:var(--lime); color:var(--lime); }
.tp-footer__social svg { width:16px; height:16px; }
/* Social edit cluster (edit-only chrome; published renders icons only) */
.tp-soc-edit { display:inline-flex; flex-direction:column; gap:6px; align-items:flex-start; }
.tp-soc-pop { display:flex; align-items:center; gap:6px; }
.tp-soc-pop select, .tp-soc-pop input { background:transparent; color:var(--paper); border:1px solid var(--line-dk); border-radius:var(--r); padding:5px 8px; font-family:var(--font-mono); font-size:11px; outline:none; }
.tp-soc-pop input { width:150px; }
.tp-soc-pop input::placeholder { color:oklch(0.84 0.022 140 / 0.5); }
.tp-soc-pop select option { color:#111; }
.tp-soc-pop button { background:transparent; border:1px solid var(--line-dk); color:oklch(0.84 0.022 140 / 0.7); border-radius:var(--r); padding:5px 8px; cursor:pointer; font-family:var(--font-mono); font-size:11px; line-height:1; }
.tp-soc-pop button:hover { border-color:var(--lime); color:var(--lime); }
.tp-footer__col h4 { font-family:var(--font-mono); font-size:11px; font-weight:500; letter-spacing:0.18em; text-transform:uppercase; color:var(--lime); margin:0 0 16px; }
.tp-footer__col ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:11px; }
.tp-footer__col li { font-size:14px; }
.tp-footer__link { color:inherit; text-decoration:none; }
.tp-footer__link:hover { color:var(--paper); }
.tp-footer__bottom { border-top:1px solid var(--line-dk); padding:20px var(--pad-x); max-width:var(--max-w); margin:0 auto; display:flex; flex-wrap:wrap; gap:12px 26px; align-items:center; justify-content:space-between; font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.04em; }
.tp-footer__legal { display:flex; flex-wrap:wrap; gap:8px 18px; }
.tp-footer__legal a { color:inherit; text-decoration:none; }
.tp-footer__legal a:hover { color:var(--paper); }
/* Phase-2 newsletter capture (kept) */
.tp-news { display:flex; border:1px solid var(--line-dk); border-radius:var(--r); overflow:hidden; max-width:320px; margin:18px 0; }
.tp-news__input { flex:1; border:0; background:transparent; color:var(--paper); padding:10px 12px; font:inherit; font-size:13px; outline:none; }
.tp-news__input::placeholder { color:oklch(0.84 0.022 140 / 0.55); }
.tp-news__btn { background:var(--lime); color:var(--forest-d); padding:0 14px; border:0; font-family:var(--font-mono); font-size:12px; font-weight:600; cursor:pointer; }
.tp-news__btn:disabled { opacity:0.6; cursor:default; }
.tp-news-done { font-family:var(--font-mono); font-size:12px; color:var(--lime); max-width:320px; padding:6px 0; }
/* Floating WhatsApp widget */
.tp-wa-fab { position:fixed; right:clamp(16px,3vw,28px); bottom:clamp(16px,3vw,28px); z-index:80; display:inline-flex; align-items:center; gap:10px; padding:12px 18px 12px 14px; background:var(--wa); color:#fff; border-radius:999px; font-family:var(--font-display); font-weight:600; font-size:14.5px; text-decoration:none; box-shadow:0 14px 34px -12px oklch(0.55 0.16 150 / 0.6); transition:transform .16s ease, box-shadow .16s ease; }
.tp-wa-fab:hover { transform:translateY(-2px); box-shadow:0 18px 40px -12px oklch(0.55 0.16 150 / 0.7); }
.tp-wa-fab svg { width:24px; height:24px; flex:none; }
.tp-wa-fab .tp-wa-label { white-space:nowrap; }
@media (max-width:1040px){ .tp-footer__top { grid-template-columns:1fr 1fr; gap:32px 24px; } }
@media (max-width:760px){ .tp-wa-fab { padding:14px; } .tp-wa-fab .tp-wa-label { display:none; } }
@media (max-width:520px){ .tp-footer__top { grid-template-columns:1fr; } }
`;
