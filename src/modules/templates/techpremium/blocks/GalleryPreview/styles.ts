// Plain (non-'use client') styles module — imported by BOTH the edit block and
// the published renderer. CSS strings must NOT live in a 'use client' file or they
// become an empty client reference on the published page (see project memory).
import { SEC_HEAD_STYLES, PH_STYLES, LIGHTBOX_STYLES } from '../shared/sharedStyles';

export const GALLERY_STYLES = `
.tp-sec-head h2 { font-family:var(--font-display); font-weight:600; font-size:clamp(30px,4vw,46px); letter-spacing:-0.018em; line-height:1.1; color:var(--ink); margin:0; }
[data-surface="forest-d"] .tp-sec-head h2, [data-surface="forest"] .tp-sec-head h2 { color:var(--paper); }
.tp-masonry{ column-count:4; column-gap:16px; }
.tp-masonry .tp-gitem{ break-inside:avoid; margin-bottom:16px; display:block; width:100%; }
.tp-gitem{ cursor:zoom-in; position:relative; }
.tp-gitem .tp-ghover{ position:absolute; inset:0; display:grid; place-items:center; opacity:0; transition:opacity .16s ease; }
.tp-gitem .tp-ghover svg{ width:26px; height:26px; stroke:#fff; stroke-width:2; fill:none; }
.tp-gitem:hover .tp-ghover{ opacity:1; background:oklch(0.255 0.038 159 / 0.4); border-radius:var(--r-lg); }
.tp-gedit{ position:relative; z-index:3; display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.tp-ginput{ width:100%; font-family:var(--font-mono); font-size:11px; padding:6px 8px; border:1px solid var(--line-dk); border-radius:var(--r); background:var(--forest-d); color:var(--paper); }
.tp-gx{ align-self:flex-start; background:transparent; border:1px solid var(--line-dk); color:oklch(0.78 0.03 140); font-size:12px; padding:2px 8px; border-radius:var(--r); cursor:pointer; }
.tp-managed-hint{ margin:22px 0 0; font-family:var(--font-mono); font-size:11.5px; letter-spacing:0.02em; line-height:1.5; color:oklch(0.78 0.03 140); text-align:center; }
.tp-managed-hint strong{ color:var(--lime); font-weight:600; }
@media (max-width:1040px){ .tp-masonry{ column-count:3; } }
@media (max-width:760px){ .tp-masonry{ column-count:2; } }
@media (max-width:520px){ .tp-masonry{ column-count:1; } }
`;

export const STYLES = SEC_HEAD_STYLES + PH_STYLES + LIGHTBOX_STYLES + GALLERY_STYLES;
