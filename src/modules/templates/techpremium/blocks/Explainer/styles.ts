// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES, PH_STYLES, BTN_STYLES } from '../shared/sharedStyles';

export const EXPLAINER_STYLES = `
.tp-explain{ display:grid; grid-template-columns:1fr 1fr; gap:clamp(36px,5vw,72px); align-items:center; }
.tp-explain + .tp-explain{ margin-top:clamp(48px,6vw,88px); }
.tp-explain.flip .tp-explain-media{ order:2; }
.tp-explain-media{ position:relative; }
.tp-explain-media .tp-ph{ aspect-ratio:4/3; }
.tp-explain-video{ position:absolute; inset:0; width:100%; height:100%; border:0; display:block; border-radius:var(--r-lg); }
.tp-explain-media-edit{ display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.tp-explain-media-edit input{ width:100%; font-family:var(--font-mono); font-size:11px; padding:6px 8px; border:1px solid var(--line-2); border-radius:var(--r); background:var(--paper); color:var(--ink); }
.tp-explain-up{ display:inline-flex; align-items:center; justify-content:center; gap:6px; font-family:var(--font-mono); font-size:11px; letter-spacing:0.03em; color:var(--forest-d); background:var(--lime); border-radius:var(--r); padding:7px 10px; cursor:pointer; }
.tp-explain-up:hover{ background:color-mix(in oklch, var(--lime) 95%, black); }
.tp-explain-copy h3.tp-explain-h3{ font-family:var(--font-display); font-weight:600; font-size:clamp(24px,3vw,34px); letter-spacing:-0.018em; line-height:1.15; color:var(--ink); margin:14px 0 14px; }
.tp-explain-copy p.tp-explain-p{ color:var(--ink-2); font-size:16px; line-height:1.65; margin:0 0 18px; max-width:46ch; }
.tp-explain-list{ list-style:none; padding:0; margin:0 0 22px; display:flex; flex-direction:column; gap:12px; }
.tp-explain-list li{ display:grid; grid-template-columns:auto 1fr auto; align-items:start; gap:12px; font-size:15px; color:var(--ink-2); }
.tp-explain-list li svg{ width:20px; height:20px; stroke:var(--lime-d); stroke-width:2; fill:none; margin-top:1px; }
.tp-explain-remove{ display:inline-flex; margin-top:8px; background:transparent; border:1px solid var(--line-2); border-radius:var(--r); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:6px 12px; cursor:pointer; }
.tp-explain-add{ display:block; width:100%; margin-top:clamp(48px,6vw,88px); border:1px dashed var(--line-2); border-radius:var(--r-lg); background:transparent; color:var(--ink-3); font-family:var(--font-body); font-size:14px; padding:18px; cursor:pointer; }
.tp-explain-add:hover{ border-color:var(--forest); color:var(--forest); }
.tp-x{ background:transparent; border:none; color:var(--ink-3); font-size:12px; cursor:pointer; }
.tp-add{ background:transparent; border:1px dashed var(--line-2); color:var(--ink-3); font-family:var(--font-mono); font-size:11px; padding:4px 8px; border-radius:var(--r); cursor:pointer; }
@media (max-width:1040px){ .tp-explain, .tp-explain.flip{ grid-template-columns:1fr; gap:40px; } .tp-explain-media{ order:0 !important; } }
`;

export const STYLES = SEC_HEAD_STYLES + PH_STYLES + BTN_STYLES + EXPLAINER_STYLES;
