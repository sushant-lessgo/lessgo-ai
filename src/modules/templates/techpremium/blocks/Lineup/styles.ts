// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES, CARD_STYLES } from '../shared/sharedStyles';

export const LINEUP_STYLES = `
.tp-sec-head h2, .tp-sec-head .tp-sec-head__h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-lineup-card { position:relative; }
.tp-lineup-x { position:absolute; top:12px; right:12px; width:22px; height:22px; background:var(--paper); border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; z-index:2; }
.tp-lineup-add { border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-body); font-size:14px; cursor:pointer; align-items:center; justify-content:center; min-height:220px; box-shadow:none; transform:none; }
.tp-lineup-add:hover { color:var(--forest); border-color:var(--forest); transform:none; box-shadow:none; }
`;

export const STYLES = SEC_HEAD_STYLES + CARD_STYLES + LINEUP_STYLES;
