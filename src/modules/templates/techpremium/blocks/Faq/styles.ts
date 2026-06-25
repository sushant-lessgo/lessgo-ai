// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES } from '../shared/sharedStyles';

export const FAQ_STYLES = SEC_HEAD_STYLES + `
.tp-faq-list{ max-width:860px; margin:0 auto; border-top:1px solid var(--line); }
.tp-faq-item{ border-bottom:1px solid var(--line); position:relative; }
.tp-faq-item summary{ list-style:none; cursor:pointer; padding:22px 4px; display:flex; align-items:center; justify-content:space-between; gap:20px; font-family:var(--font-display); font-weight:600; font-size:18px; color:var(--ink); }
.tp-faq-item summary::-webkit-details-marker{ display:none; }
.tp-faq-item__q{ flex:1; }
.tp-faq-item .tp-pm{ flex:none; width:20px; height:20px; position:relative; }
.tp-faq-item .tp-pm::before,.tp-faq-item .tp-pm::after{ content:""; position:absolute; background:var(--lime-d); transition:transform .2s ease; }
.tp-faq-item .tp-pm::before{ left:0; right:0; top:9px; height:2px; }
.tp-faq-item .tp-pm::after{ top:0; bottom:0; left:9px; width:2px; }
.tp-faq-item[open] .tp-pm::after{ transform:scaleY(0); }
.tp-faq-item p{ margin:0 0 22px; color:var(--ink-2); font-size:15.5px; line-height:1.65; max-width:72ch; }
.tp-faq-item__remove{ position:absolute; top:22px; right:36px; width:22px; height:22px; background:transparent; border:1px solid var(--line-2); border-radius:50%; color:var(--ink-3); font-size:13px; line-height:1; cursor:pointer; z-index:2; }
.tp-faq-add{ display:block; margin:24px auto 0; background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:10px 16px; border-radius:var(--r); cursor:pointer; }
.tp-faq-add:hover{ color:var(--forest); border-color:var(--forest); }
`;
