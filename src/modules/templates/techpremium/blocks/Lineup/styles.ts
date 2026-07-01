// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES, CARD_STYLES } from '../shared/sharedStyles';

export const LINEUP_STYLES = `
.tp-sec-head h2, .tp-sec-head .tp-sec-head__h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-lineup-card { position:relative; }
.tp-managed-hint { margin:22px 0 0; font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.02em; line-height:1.5; color:var(--ink-3); text-align:center; }
.tp-managed-hint strong { color:var(--forest); font-weight:600; }
`;

export const STYLES = SEC_HEAD_STYLES + CARD_STYLES + LINEUP_STYLES;
