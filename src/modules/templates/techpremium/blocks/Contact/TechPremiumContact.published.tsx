// TechPremium Contact page block (Phase 4c) — published (server-safe, no hooks).
// Emits a real <form data-lessgo-form …> wired to form.v1.js → /api/forms/submit
// → FormSubmission (dashboard). form.v1.js loads only when content.forms is
// non-empty (ensureContactForm guarantees it) and replaces the form with its own
// success UI on submit, so this block emits no success state of its own.

import React from 'react';
import * as Icons from 'lucide-react';
import { CONTACT_STYLES, mapEmbedSrc } from './TechPremiumContact';
import { DEFAULT_CONTACT_FIELDS, CONTACT_SUBMIT_TEXT } from './contactFields';
import type { MVPFormField } from '@/types/core/forms';

interface InfoRow { id?: string; icon?: string; k?: string; v?: string; href?: string; sub?: string }
interface Props {
  sectionId: string;
  eyebrow?: string; headline?: string; lede?: string;
  form_id?: string; form_heading?: string; form_note?: string; form_foot?: string;
  whatsapp_text?: string; whatsapp_href?: string; map_caption?: string; map_embed?: string;
  info?: InfoRow[];
  content?: any; publishedPageId?: string; pageOwnerId?: string;
}

function field(f: MVPFormField, formId: string) {
  const fid = `${formId || 'contact'}-${f.id}`;
  return (
    <div key={f.id} className={`tp-field${f.type === 'textarea' ? ' full' : ''}`}>
      <label htmlFor={fid}>{f.label}{f.required && <span className="tp-req">*</span>}</label>
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

export default function TechPremiumContactPublished(props: Props) {
  const info = Array.isArray(props.info) ? props.info : [];
  const formId = props.form_id || '';
  const form = formId ? props.content?.forms?.[formId] : undefined;
  const fields: MVPFormField[] = Array.isArray(form?.fields) && form.fields.length ? form.fields : DEFAULT_CONTACT_FIELDS;

  const waRaw = props.whatsapp_href || '';
  const waHref = waRaw && waRaw !== '#' ? waRaw : '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_STYLES }} />
      <section className="tp-sec tp-contact">
        <div className="tp-sec__inner">
          <div className="tp-sec-head">
            {props.eyebrow && <span className="tp-eyebrow">{props.eyebrow}</span>}
            {props.headline && <h2 dangerouslySetInnerHTML={{ __html: props.headline }} />}
            {props.lede && <p className="tp-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
          </div>

          <div className="tp-contact-in">
            <div className="tp-contact-info">
              {info.map((r, i) => {
                const Icon = (Icons as any)[r.icon || 'Phone'] || Icons.Phone;
                return (
                  <div key={r.id || i} className="tp-cinfo">
                    <span className="tp-cinfo__ico"><Icon /></span>
                    <div>
                      {r.k && <div className="tp-cinfo__k">{r.k}</div>}
                      {r.v && <div className="tp-cinfo__v">{r.href ? <a href={r.href}>{r.v}</a> : r.v}</div>}
                      {r.sub && <div className="tp-cinfo__sub">{r.sub}</div>}
                    </div>
                  </div>
                );
              })}
              {props.whatsapp_text && waHref && (
                <a className="tp-btn2 wa tp-cwa-btn" href={waHref} target="_blank" rel="noopener">{props.whatsapp_text}</a>
              )}
            </div>

            <form
              className="tp-lead-form"
              data-lessgo-form
              data-form-id={formId}
              data-page-id={props.publishedPageId}
              data-owner-id={props.pageOwnerId}
              data-success-message={form?.successMessage || 'Request received — we’ll be in touch.'}
            >
              {props.form_heading && <h2 className="tp-form-heading">{props.form_heading}</h2>}
              {props.form_note && <p className="tp-form-note">{props.form_note}</p>}
              <div className="tp-fgrid">
                {fields.map((f) => field(f, formId))}
              </div>
              <button type="submit" className="tp-btn2 lime tp-form-submit">{form?.submitButtonText || CONTACT_SUBMIT_TEXT}</button>
              {props.form_foot && <p className="tp-form-foot">{props.form_foot}</p>}
            </form>
          </div>

          {(() => {
            const src = mapEmbedSrc(props.map_embed);
            if (!src && props.map_caption === undefined) return null;
            return (
              <div className="tp-contact-map">
                <div className="tp-ph tp-map-ph">
                  {src
                    ? <iframe className="tp-map-frame" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen title="Location map" />
                    : <span className="tp-tag">{props.map_caption || 'Map'}</span>}
                </div>
              </div>
            );
          })()}
        </div>
      </section>
    </>
  );
}
