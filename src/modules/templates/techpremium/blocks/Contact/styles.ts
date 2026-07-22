// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES, PH_STYLES, BTN_STYLES } from '../shared/sharedStyles';

const CONTACT_OWN = `
.tp-contact-in { display:grid; grid-template-columns:0.85fr 1.15fr; gap:clamp(36px,5vw,72px); align-items:start; }
.tp-contact-info { display:flex; flex-direction:column; gap:14px; }
.tp-cinfo { display:grid; grid-template-columns:auto 1fr; gap:16px; padding:20px 0; border-bottom:1px solid var(--line); }
.tp-cinfo:last-of-type { border-bottom:0; }
.tp-cinfo__ico { width:42px; height:42px; border-radius:10px; border:1px solid var(--line-2); display:grid; place-items:center; }
.tp-cinfo__ico svg { width:20px; height:20px; stroke:var(--forest); stroke-width:1.7; fill:none; }
.tp-cinfo__k { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3); margin-bottom:4px; }
.tp-cinfo__v { font-family:var(--font-display); font-weight:600; font-size:17px; color:var(--ink); }
.tp-cinfo__v a { color:inherit; text-decoration:none; }
.tp-cinfo__v a:hover { color:var(--forest); }
.tp-cinfo__sub { font-size:13px; color:var(--ink-2); margin-top:2px; }
.tp-cinfo__edit { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.tp-cinfo__edit select, .tp-cinfo__edit input { font-family:var(--font-mono); font-size:11px; border:1px solid var(--line-2); border-radius:var(--r); padding:4px 8px; color:var(--ink-2); }
.tp-cwa { display:block; margin-top:8px; }
.tp-cwa-btn { margin-top:0; }
.tp-cwa-href { display:block; width:100%; margin-top:6px; font-family:var(--font-mono); font-size:11px; border:1px solid var(--line-2); border-radius:var(--r); padding:5px 9px; color:var(--ink-2); }
.tp-lead-form { border:1px solid var(--line-2); border-radius:var(--r-lg); background:var(--paper); padding:clamp(24px,3vw,36px); box-shadow:0 18px 48px -34px color-mix(in oklch, var(--forest) 50%, transparent); }
.tp-form-heading { font-family:var(--font-display); font-weight:600; font-size:24px; color:var(--ink); margin:0 0 6px; }
.tp-form-note { color:var(--ink-2); font-size:14.5px; margin:0 0 24px; }
.tp-fgrid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.tp-field { display:flex; flex-direction:column; gap:7px; }
.tp-field.full { grid-column:1 / -1; }
.tp-field label { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); }
.tp-field label .tp-req, .tp-req { color:var(--lime-d); margin-left:3px; }
.tp-field input, .tp-field select, .tp-field textarea { font-family:var(--font-body); font-size:15px; color:var(--ink); background:var(--paper); border:1px solid var(--line-2); border-radius:var(--r); padding:12px 14px; width:100%; transition:border-color .15s ease, box-shadow .15s ease; }
.tp-field textarea { resize:vertical; min-height:120px; }
.tp-field input:focus, .tp-field select:focus, .tp-field textarea:focus { outline:0; border-color:var(--forest); box-shadow:0 0 0 3px var(--lime-dim); }
.tp-lead-form .tp-form-submit, .tp-lead-form button[type="submit"] { margin-top:18px; width:100%; }
.tp-form-foot { font-family:var(--font-mono); font-size:11px; color:var(--ink-3); margin-top:14px; text-align:center; letter-spacing:0.03em; }
.tp-contact-map { margin-top:clamp(40px,5vw,64px); }
.tp-map-ph { aspect-ratio:16/6; overflow:hidden; }
.tp-map-frame { position:absolute; inset:0; width:100%; height:100%; border:0; display:block; }
.tp-map-edit { display:flex; flex-direction:column; gap:5px; margin-top:10px; }
.tp-map-input { width:100%; font-family:var(--font-mono); font-size:11px; border:1px solid var(--line-2); border-radius:var(--r); padding:7px 10px; color:var(--ink-2); }
.tp-map-hint { font-family:var(--font-mono); font-size:10.5px; letter-spacing:0.02em; color:var(--ink-3); }
.tp-map-hint--bad { color:var(--lime-d); }
.tp-add { background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:6px 10px; border-radius:var(--r); cursor:pointer; align-self:flex-start; }
.tp-x { background:transparent; border:none; color:var(--ink-3); font-family:var(--font-mono); font-size:11px; cursor:pointer; }
@media (max-width:1040px){ .tp-contact-in { grid-template-columns:1fr; gap:40px; } }
@media (max-width:760px){ .tp-fgrid { grid-template-columns:1fr; } .tp-map-ph { aspect-ratio:4/3; } }
`;

export const CONTACT_STYLES = SEC_HEAD_STYLES + PH_STYLES + BTN_STYLES + CONTACT_OWN;
