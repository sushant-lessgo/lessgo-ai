// Server-safe published Lumen contact. Real <form data-lessgo-form> wired to
// form.v1.js → /api/forms/submit. Labels/placeholders carry data-en/data-nl(-ph)
// for the lumen.v1.js language toggle.

import React from 'react';
import { resolveCtaHref, externalLinkProps } from '@/utils/resolveCtaHref';
import { bilingualAttrs } from '../../i18nKeys';
import { CONTACT_STYLES } from './styles';
import { DEFAULT_CONTACT_FIELDS } from './contactFields';
import type { MVPFormField } from '@/types/core/forms';

interface Props {
  sectionId: string;
  form_id?: string;
  eyebrow?: string; eyebrow_nl?: string;
  headline?: string; headline_nl?: string;
  lede?: string; lede_nl?: string;
  based_in_label?: string; based_in_label_nl?: string;
  based_in?: string; based_in_nl?: string;
  phone?: string; email?: string;
  whatsapp_number?: string; whatsapp_label?: string; whatsapp_label_nl?: string;
  book_call_url?: string; book_call_label?: string; book_call_label_nl?: string;
  name_label?: string; name_label_nl?: string; name_ph?: string; name_ph_nl?: string;
  email_label?: string; email_label_nl?: string; email_ph?: string; email_ph_nl?: string;
  message_label?: string; message_label_nl?: string; message_ph?: string; message_ph_nl?: string;
  submit_text?: string; submit_text_nl?: string;
  form_note?: string; form_note_nl?: string;
  content?: any; publishedPageId?: string; pageOwnerId?: string;
}

const WA_ICON = (
  <svg className="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4z" /></svg>
);

export default function LumenContactFormPublished(props: Props) {
  const formId = props.form_id || '';
  const form = formId ? props.content?.forms?.[formId] : undefined;
  // Fall back to the shared defaults so fields always render even if the form
  // lookup is empty (e.g. forms not hydrated) — mirrors TechPremiumContact.
  const fields: MVPFormField[] = Array.isArray(form?.fields) && form.fields.length ? form.fields : DEFAULT_CONTACT_FIELDS;

  const wa = (props.whatsapp_number || '').replace(/[^0-9]/g, '');
  const waHref = wa ? `https://wa.me/${wa}` : '';
  const bookHref = resolveCtaHref(undefined, props.content?.forms, props.book_call_url || '#contact');

  // Bilingual placeholder per field id (falls back to schema-level placeholders).
  const phEn: Record<string, string> = { name: props.name_ph || '', email: props.email_ph || '', message: props.message_ph || '' };
  const phNl: Record<string, string> = { name: props.name_ph_nl || '', email: props.email_ph_nl || '', message: props.message_ph_nl || '' };
  const labelEn: Record<string, string> = { name: props.name_label || 'Name', email: props.email_label || 'Email', message: props.message_label || 'Message' };
  const labelNl: Record<string, string> = { name: props.name_label_nl || '', email: props.email_label_nl || '', message: props.message_label_nl || '' };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_STYLES }} />
      <section className="lm-contact" id="contact">
        <div className="lm-contact-in">
          <div className="lm-contact-copy">
            {props.eyebrow && <span className="lm-eyebrow" {...bilingualAttrs(props.eyebrow, props.eyebrow_nl || '')}>{props.eyebrow}</span>}
            <h2 {...bilingualAttrs(props.headline || '', props.headline_nl || '')} dangerouslySetInnerHTML={{ __html: props.headline || '' }} />
            {props.lede && <p className="lm-lede" {...bilingualAttrs(props.lede, props.lede_nl || '')} dangerouslySetInnerHTML={{ __html: props.lede }} />}
            <div className="lm-contact-details">
              {(props.based_in || props.based_in_label) && (
                <div className="lm-cd-row">
                  <span className="k" {...bilingualAttrs(props.based_in_label || 'Based in', props.based_in_label_nl || '')}>{props.based_in_label || 'Based in'}</span>
                  <span className="v" {...bilingualAttrs(props.based_in || '', props.based_in_nl || '')}>{props.based_in || ''}</span>
                </div>
              )}
              {props.phone && <div className="lm-cd-row"><span className="k">Phone</span><span className="v"><b>{props.phone}</b></span></div>}
              {props.email && <div className="lm-cd-row"><span className="k">Email</span><span className="v"><a href={`mailto:${props.email}`}>{props.email}</a></span></div>}
            </div>
            <div className="lm-contact-quick">
              {waHref && (
                <a className="lm-btn lm-btn--wa" href={waHref} target="_blank" rel="noopener noreferrer"
                   data-lessgo-cta="" data-lessgo-cta-role="primary"
                   {...bilingualAttrs(props.whatsapp_label || 'WhatsApp', props.whatsapp_label_nl || '')}>
                  {WA_ICON}<span {...bilingualAttrs(props.whatsapp_label || 'WhatsApp', props.whatsapp_label_nl || '')}>{props.whatsapp_label || 'WhatsApp'}</span>
                </a>
              )}
              <a className="lm-btn lm-btn--line" href={bookHref} {...externalLinkProps(bookHref)}
                 data-lessgo-cta="" data-lessgo-cta-role="secondary"
                 {...bilingualAttrs(props.book_call_label || 'Book a call', props.book_call_label_nl || '')}>{props.book_call_label || 'Book a call'}</a>
            </div>
          </div>

          <form
            className="lm-form"
            data-lessgo-form
            data-form-id={formId}
            data-page-id={props.publishedPageId}
            data-success-message={form?.successMessage || 'Enquiry received — I’ll reply within a day.'}
          >
            {fields.map((f) => {
              const fid = `${formId || 'contact'}-${f.id}`;
              const label = labelEn[f.id] || f.label || f.id;
              const labelNlV = labelNl[f.id] || '';
              const phEnV = phEn[f.id] ?? f.placeholder ?? '';
              const phNlV = phNl[f.id] ?? '';
              return (
                <div key={f.id} className="field">
                  <label htmlFor={fid} {...bilingualAttrs(label, labelNlV)}>{label}</label>
                  {f.type === 'textarea' ? (
                    <textarea id={fid} name={f.id} placeholder={phEnV} required={f.required} data-en-ph={phEnV} data-nl-ph={phNlV || phEnV} />
                  ) : (
                    <input id={fid} type={f.type || 'text'} name={f.id} placeholder={phEnV} required={f.required} data-en-ph={phEnV} data-nl-ph={phNlV || phEnV} />
                  )}
                </div>
              );
            })}
            <button type="submit" className="lm-btn lm-btn--fill submit"
              {...bilingualAttrs(props.submit_text || 'Send enquiry', props.submit_text_nl || '')}>
              {form?.submitButtonText || props.submit_text || 'Send enquiry'}
            </button>
            {props.form_note && <p className="note" {...bilingualAttrs(props.form_note, props.form_note_nl || '')}>{props.form_note}</p>}
          </form>
        </div>
      </section>
    </>
  );
}
