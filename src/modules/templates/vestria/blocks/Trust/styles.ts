// Client-strip CSS (edit + published parity). `vs-` prefixed. Block does NOT
// paint the paper-2 section bg or its border-block — the [data-surface="paper-2"]
// wrapper does. Ported from the Vestria mock (.clients).

export const TRUST_STYLES = `
.vs-clients{ padding:clamp(40px,5vw,58px) 0; }
.vs-clients__lab{ text-align:center; font-family:var(--ff-mono); font-size:0.72rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:28px; display:block; }
.vs-clients__row{ display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:clamp(24px,4.5vw,60px); }
.vs-logo{ font-family:var(--ff-display); font-weight:600; font-size:1.28rem; color:var(--ink); opacity:0.62; letter-spacing:0.01em; display:flex; align-items:baseline; gap:0.4em; transition:opacity .2s; }
.vs-logo:hover{ opacity:1; }
.vs-logo__sub{ font-family:var(--ff-mono); font-size:0.6rem; letter-spacing:0.12em; color:var(--accent-deep); text-transform:uppercase; }
`;
