// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES } from '../shared/sharedStyles';
import { READOUT_STYLES } from '../Readout/TechPremiumReadout';

export const COMPAT_STYLES = `
.tp-sec-head h2, .tp-compat-copy h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
.tp-compat-in{ display:grid; grid-template-columns:0.9fr 1.1fr; gap:clamp(36px,5vw,72px); align-items:center; }
.tp-compat-copy{ display:flex; flex-direction:column; gap:16px; }
.tp-compat-chips{ display:flex; flex-wrap:wrap; gap:12px; margin-top:24px; }
.tp-compat-chip{ display:inline-flex; align-items:center; gap:9px; border:1px solid var(--line-2); border-radius:999px; padding:9px 16px 9px 13px; background:var(--paper); font-size:14px; font-weight:500; color:var(--ink); }
.tp-compat-chip .tp-d{ width:7px; height:7px; border-radius:50%; background:var(--lime-d); }
.tp-compat-readout{ display:grid; gap:14px; }
.tp-x{ background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; margin-left:2px; }
.tp-add{ background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:6px 12px; border-radius:999px; cursor:pointer; }
@media (max-width:1040px){ .tp-compat-in{ grid-template-columns:1fr; gap:40px; } }
`;

export const STYLES = SEC_HEAD_STYLES + READOUT_STYLES + COMPAT_STYLES;
