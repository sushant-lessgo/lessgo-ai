// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES } from '../shared/sharedStyles';

export const PROBLEM_STYLES = SEC_HEAD_STYLES + `
.tp-problem-in{ display:grid; grid-template-columns:0.85fr 1.15fr; gap:clamp(40px,6vw,80px); align-items:start; }
.tp-problem-lead{ position:sticky; top:96px; display:flex; flex-direction:column; }
.tp-problem-lead__h2{ font-family:var(--font-display); font-weight:600; letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin-top:16px; font-size:clamp(28px,3.6vw,42px); }
.tp-problem-lead__lede{ margin-top:18px; max-width:42ch; }
.tp-pain{ display:flex; flex-direction:column; }
.tp-pain-row{ display:grid; grid-template-columns:auto 1fr; gap:22px; padding:26px 0; border-bottom:1px solid var(--line-dk); position:relative; }
.tp-pain-row:first-child{ padding-top:0; }
.tp-pain-row:last-child{ border-bottom:0; padding-bottom:0; }
.tp-pain-row .tp-n{ font-family:var(--font-mono); font-size:12px; font-weight:600; letter-spacing:0.1em; color:var(--lime); padding-top:5px; }
.tp-pain-row__h3{ font-family:var(--font-display); font-weight:600; font-size:21px; margin-bottom:7px; color:var(--paper); }
.tp-pain-row__p{ margin:0; color:oklch(0.84 0.025 140 / 0.78); font-size:15.5px; line-height:1.65; max-width:52ch; }
.tp-pain-row__remove{ position:absolute; top:0; right:0; width:22px; height:22px; background:transparent; border:1px solid var(--line-dk); border-radius:50%; color:var(--paper); font-size:13px; line-height:1; cursor:pointer; }
.tp-pain-add{ margin-top:24px; align-self:flex-start; background:transparent; border:1px dashed var(--line-dk); color:var(--paper); font-family:var(--font-body); font-size:14px; padding:10px 16px; border-radius:var(--r); cursor:pointer; }
.tp-pain-add:hover{ border-color:var(--lime); color:var(--lime); }
@media (max-width:1040px){ .tp-problem-in{ grid-template-columns:1fr; gap:40px; } .tp-problem-lead{ position:static; } }
`;
