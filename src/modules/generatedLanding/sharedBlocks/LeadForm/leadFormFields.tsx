// Shared LeadForm layout + field markup. PLAIN module — NO 'use client', no
// hooks — so it can be imported by BOTH the edit twin (LeadForm.tsx) and the
// server-safe published twin (LeadForm.published.tsx) without dragging client
// code into the static-markup path (dual-renderer firewall). Modeled on
// Vestria's leadFormMarkup + VestriaLeadForm.core split, but TEMPLATE-AGNOSTIC:
// styled via self-contained CSS + a few common CSS vars (--accent / --line /
// --font-*) with neutral fallbacks, so it renders correctly on every template.

import React from 'react';
import type { MVPFormField } from '@/types/core/forms';

export const LEAD_FORM_DEFAULT_HEADLINE = 'Get in touch';
export const LEAD_FORM_SUBMIT_FALLBACK = 'Submit';
export const LEAD_FORM_SUCCESS_FALLBACK = "Thanks — we'll be in touch soon.";

/** Self-contained styles injected once per block (mirrors Vestria's CONTACT_STYLES
 *  approach — no dependency on public/published.css so it works in any template). */
export const LEAD_FORM_STYLES = `
.lg-lead{width:100%;}
.lg-lead-pad{padding:clamp(48px,8vw,96px) 20px;}
.lg-lead__inner{max-width:640px;margin:0 auto;}
.lg-lead__h{font-family:var(--font-display,inherit);font-size:clamp(24px,4vw,34px);line-height:1.15;margin:0 0 24px;color:inherit;font-weight:700;text-align:center;}
.lg-lead__card{background:#ffffff;border:1px solid var(--line,rgba(0,0,0,0.12));border-radius:var(--r-lg,16px);padding:clamp(24px,4vw,36px);box-shadow:var(--shadow-card,0 1px 3px rgba(0,0,0,0.08));}
.lg-fld{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;}
.lg-fld label{font-size:13px;font-weight:600;font-family:var(--font-body,inherit);color:#1a1a1a;}
.lg-req{color:#dc2626;margin-left:2px;}
.lg-fld input,.lg-fld select,.lg-fld textarea{width:100%;padding:11px 13px;border:1px solid var(--line,rgba(0,0,0,0.18));border-radius:var(--r-md,10px);background:#fff;color:#111;font-size:15px;font-family:var(--font-body,inherit);box-sizing:border-box;}
.lg-fld input:focus,.lg-fld select:focus,.lg-fld textarea:focus{outline:2px solid var(--accent,#2563eb);outline-offset:1px;border-color:var(--accent,#2563eb);}
.lg-lead__foot{margin-top:8px;}
.lg-lead__btn{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:13px 20px;border:none;border-radius:var(--r-md,10px);background:var(--accent,#2563eb);color:var(--accent-ink,#ffffff);font-size:15px;font-weight:600;font-family:var(--font-body,inherit);cursor:pointer;}
.lg-lead__note{margin:12px 0 0;font-size:13px;text-align:center;color:#1a1a1a;opacity:0.6;}
`;

/** Render one MVP form field → labeled input/select/textarea. `name={field.id}`
 *  IS the submission key (form.v1.js builds the payload from FormData). */
export function renderLeadField(f: MVPFormField, formId: string) {
  const fid = `${formId || 'lead'}-${f.id}`;
  return (
    <div key={f.id} className="lg-fld">
      <label htmlFor={fid}>{f.label}{f.required && <span className="lg-req">*</span>}</label>
      {f.type === 'textarea' ? (
        <textarea id={fid} name={f.id} placeholder={f.placeholder} required={f.required} rows={4} />
      ) : f.type === 'select' ? (
        <select id={fid} name={f.id} required={f.required} defaultValue="">
          <option value="">{f.placeholder || 'Select…'}</option>
          {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input id={fid} type={f.type} name={f.id} placeholder={f.placeholder} required={f.required} />
      )}
    </div>
  );
}

/**
 * SINGLE-SOURCE lead-form layout. The heading and the form itself arrive as
 * prebuilt nodes from each wrapper (edit = inert + editable heading, published =
 * real <form data-lessgo-form> + static heading), so both renderers emit
 * byte-identical structure/classes. The inner `#form-section` node is the anchor
 * the hero GOAL_REF + CTA scrollTo target; scroll-margin-top lives HERE (not the
 * outer type-based wrapper) so the sticky header doesn't overlap the heading.
 */
export function LeadFormCore({
  headingSlot,
  formNode,
}: {
  headingSlot: React.ReactNode;
  formNode: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LEAD_FORM_STYLES }} />
      <section className="lg-lead lg-lead-pad">
        <div id="form-section" className="lg-lead__inner" style={{ scrollMarginTop: 80 }}>
          {headingSlot}
          <div className="lg-lead__card">{formNode}</div>
        </div>
      </section>
    </>
  );
}

export default LeadFormCore;
