// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).

export const TRUST_STYLES = `
.tp-trust { padding: 0 var(--pad-x); }
.tp-trust__inner { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:clamp(24px,4vw,56px); padding:30px 0; max-width:var(--max-w); margin:0 auto; }
.tp-trust__metrics { display:flex; gap:28px; flex-wrap:wrap; }
.tp-trust__m { position:relative; }
.tp-trust__m .tp-trust__v { font-family:var(--font-display); font-weight:700; font-size:34px; letter-spacing:-0.03em; color:var(--forest); line-height:1; display:block; }
.tp-trust__m span { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3); margin-top:6px; display:block; }
.tp-trust__div { background:var(--line); width:1px; height:46px; }
.tp-trust__right { display:flex; flex-direction:column; gap:10px; flex:1; min-width:0; }
.tp-trust__label { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3); }
.tp-trust__logos { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:24px 40px; }
.tp-trust__logo { position:relative; display:inline-flex; align-items:center; height:auto; }
.tp-trust__logo img { height:48px; max-width:160px; object-fit:contain; }
.tp-trust__logoph { font-family:var(--font-mono); font-size:12px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-3); border:1px dashed var(--line-2); border-radius:var(--r); padding:14px 22px; }
.tp-trust__logo.is-edit { flex-direction:column; align-items:flex-start; height:auto; gap:6px; border:1px dashed var(--line-2); border-radius:var(--r); padding:8px; }
.tp-trust__logo-edit { display:inline-flex; align-items:center; gap:6px; }
.tp-trust__logo-up { display:inline-grid; place-items:center; width:24px; height:24px; border:1px solid var(--line-2); border-radius:var(--r); font-size:12px; color:var(--ink-2); cursor:pointer; }
.tp-trust__logo-up:hover { border-color:var(--forest); color:var(--forest); }
.tp-trust__logo-name { width:96px; font-family:var(--font-mono); font-size:11px; padding:4px 6px; border:1px solid var(--line-2); border-radius:var(--r); color:var(--ink); }
.tp-x { background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; }
.tp-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:4px 8px; border-radius:var(--r); cursor:pointer; }
@media (max-width:760px){ .tp-trust__div { display:none; } .tp-trust__logo img { height:38px; } .tp-trust__logos { gap:20px 28px; } }
`;
