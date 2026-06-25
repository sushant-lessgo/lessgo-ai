// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES } from '../shared/sharedStyles';

export const PROCESS_STYLES = SEC_HEAD_STYLES + `
.tp-how-steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:0; border:1px solid var(--line); border-radius:var(--r-lg); overflow:hidden; background:var(--paper); }
.tp-how-steps[data-count="4"]{ grid-template-columns:repeat(4,1fr); }
.tp-step{ padding:34px 30px; border-right:1px solid var(--line); position:relative; display:flex; flex-direction:column; }
.tp-step:last-child{ border-right:0; }
.tp-flow{ position:absolute; top:46px; right:-9px; z-index:2; width:18px; height:18px; border-radius:50%; background:var(--paper); border:1px solid var(--line-2); display:grid; place-items:center; color:var(--lime-d); font-size:11px; }
.tp-step:last-child .tp-flow{ display:none; }
.tp-ico{ width:46px; height:46px; border-radius:10px; background:var(--lime-dim); display:grid; place-items:center; margin-bottom:20px; }
.tp-ico svg{ width:24px; height:24px; stroke:var(--forest); }
.tp-sn{ font-family:var(--font-mono); font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:var(--lime-d); }
.tp-step__h3{ font-family:var(--font-display); font-weight:600; font-size:23px; margin:8px 0 10px; color:var(--ink); }
.tp-step__p{ margin:0; color:var(--ink-2); font-size:15px; line-height:1.62; }
.tp-step__remove{ position:absolute; top:12px; right:12px; width:22px; height:22px; background:transparent; border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; z-index:3; }
.tp-step-add{ margin-top:24px; background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:10px 16px; border-radius:var(--r); cursor:pointer; }
.tp-step-add:hover{ color:var(--forest); border-color:var(--forest); }
@media (max-width:760px){ .tp-how-steps, .tp-how-steps[data-count="4"]{ grid-template-columns:1fr; } .tp-step{ border-right:0; border-bottom:1px solid var(--line); } .tp-step:last-child{ border-bottom:0; } .tp-flow{ display:none; } }
`;
