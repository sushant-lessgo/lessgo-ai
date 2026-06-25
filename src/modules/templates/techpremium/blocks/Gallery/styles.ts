// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES, PH_STYLES } from '../shared/sharedStyles';

const GALLERY_OWN = `
.tp-sec-head h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
[data-surface="forest-d"] .tp-sec-head h2, [data-surface="forest"] .tp-sec-head h2 { color:var(--paper); }
.tp-gfilter{ display:flex; flex-wrap:wrap; gap:10px; margin-bottom:32px; justify-content:center; }
.tp-gfilter button{ font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-2); border:1px solid var(--line-2); border-radius:999px; padding:8px 15px; background:transparent; cursor:pointer; transition:all .15s ease; }
.tp-gfilter button.is-active{ background:var(--forest); border-color:var(--forest); color:var(--paper); }
.tp-ggrid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.tp-ggrid .tp-gitem .tp-ph{ aspect-ratio:1/1; border-radius:var(--r-lg); }
.tp-gitem{ cursor:zoom-in; position:relative; }
.tp-ghover{ position:absolute; inset:0; display:grid; place-items:center; opacity:0; transition:opacity .16s ease; }
.tp-ghover svg{ width:26px; height:26px; stroke:#fff; stroke-width:2; fill:none; }
.tp-gitem:hover .tp-ghover{ opacity:1; background:oklch(0.255 0.038 159 / 0.4); border-radius:var(--r-lg); }
@media (max-width:1040px){ .tp-ggrid{ grid-template-columns:repeat(3,1fr); } }
@media (max-width:760px){ .tp-ggrid{ grid-template-columns:repeat(2,1fr); } }
.tp-gctl{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:-16px 0 28px; justify-content:center; }
.tp-gctl__f{ display:inline-flex; align-items:center; gap:4px; border:1px dashed var(--line-2); border-radius:var(--r); padding:4px 6px; }
.tp-gedit{ position:relative; z-index:3; display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.tp-ginput{ width:100%; font-family:var(--font-mono); font-size:11px; padding:6px 8px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); color:var(--ink); }
.tp-gsel{ width:100%; font-family:var(--font-mono); font-size:11px; padding:6px 8px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); color:var(--ink); }
.tp-gx{ align-self:flex-start; background:transparent; border:1px solid var(--line-2); color:var(--ink-3); font-size:12px; padding:2px 8px; border-radius:var(--r); cursor:pointer; }
.tp-x { background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; }
.tp-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:4px 8px; border-radius:var(--r); cursor:pointer; }
.tp-gadd{ display:block; margin:24px auto 0; border:1px dashed var(--line-2); border-radius:var(--r-lg); background:transparent; color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:12px 24px; cursor:pointer; }
.tp-gadd:hover{ border-color:var(--forest); color:var(--forest); }
.tp-gimport{ max-width:560px; margin:0 auto 28px; border:1px solid var(--line-2); border-radius:var(--r-lg); background:var(--paper); padding:14px 16px; }
.tp-gimport__row{ display:flex; flex-wrap:wrap; align-items:center; gap:14px; }
.tp-gimport__upload{ display:inline-flex; align-items:center; gap:6px; font-family:var(--font-display); font-weight:600; font-size:13.5px; color:var(--forest-d); background:var(--lime); border-radius:var(--r); padding:9px 16px; cursor:pointer; }
.tp-gimport__upload.is-busy{ background:var(--lime-dim); color:var(--ink-2); cursor:progress; }
.tp-gimport__cat{ display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:11px; color:var(--ink-3); }
.tp-gimport__cat select{ font-family:var(--font-mono); font-size:11px; padding:5px 8px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); color:var(--ink); }
.tp-gimport__count{ margin-left:auto; font-family:var(--font-mono); font-size:11px; color:var(--ink-3); }
.tp-gimport__urls{ margin-top:12px; }
.tp-gimport__urls summary{ font-family:var(--font-mono); font-size:11px; color:var(--ink-2); cursor:pointer; }
.tp-gimport__urls textarea{ width:100%; margin-top:8px; font-family:var(--font-mono); font-size:11px; line-height:1.5; padding:8px 10px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); color:var(--ink); resize:vertical; }
.tp-gimport__msg{ margin-top:10px; font-family:var(--font-mono); font-size:11px; color:var(--forest); }
`;

export const GALLERY_STYLES = SEC_HEAD_STYLES + PH_STYLES + GALLERY_OWN;

export const STYLES = GALLERY_STYLES;
