'use client';

// Lumen contact (edit). Left: copy + contact detail rows + WhatsApp/book-call
// buttons. Right: enquiry form (inert preview in edit; the live form.v1.js wiring
// is in the published variant). Consumes LumenContactForm.

import React from 'react';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { LumenEditable } from '../../components/LumenEditable';
import { CONTACT_STYLES } from './styles';

const waHref = (num?: string, prefill?: string) => {
  const wa = (num || '').replace(/[^0-9]/g, '');
  if (!wa) return '';
  return `https://wa.me/${wa}${prefill ? `?text=${encodeURIComponent(prefill)}` : ''}`;
};

interface Content { [k: string]: any; }

export default function LumenContactForm({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate } = useLumenBlock<Content>({ sectionId });
  const wa = waHref(blockContent.whatsapp_number);

  const ed = (key: string, props: any = {}) => (
    <LumenEditable
      mode={mode} sectionId={sectionId} editLang={editLang}
      content={blockContent} elementKey={key} onSave={handleContentUpdate} {...props}
    />
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_STYLES }} />
      <section className="lm-contact" data-section-id={sectionId} id="contact">
        <div className="lm-contact-in">
          <div className="lm-contact-copy">
            {ed('eyebrow', { as: 'span', enterBehavior: 'save', className: 'lm-eyebrow', placeholder: 'Get in touch' })}
            {ed('headline', { as: 'h2', placeholder: "Let's book your shoot." })}
            {ed('lede', { as: 'p', multiline: true, className: 'lm-lede', placeholder: 'Tell me about your team or event…' })}
            <div className="lm-contact-details">
              <div className="lm-cd-row">
                {ed('based_in_label', { as: 'span', enterBehavior: 'save', className: 'k', placeholder: 'Based in' })}
                {ed('based_in', { as: 'span', enterBehavior: 'save', className: 'v', placeholder: 'Your city · region' })}
              </div>
              <div className="lm-cd-row">
                <span className="k">Phone</span>
                {ed('phone', { as: 'span', enterBehavior: 'save', className: 'v' })}
              </div>
              <div className="lm-cd-row">
                <span className="k">Email</span>
                {ed('email', { as: 'span', enterBehavior: 'save', className: 'v' })}
              </div>
            </div>
            <div className="lm-contact-quick">
              {wa && ed('whatsapp_label', { as: 'span', enterBehavior: 'save', isButton: editLang === 'en', className: 'lm-btn lm-btn--wa', placeholder: 'WhatsApp' })}
              {ed('book_call_label', { as: 'span', enterBehavior: 'save', isButton: editLang === 'en', className: 'lm-btn lm-btn--line', placeholder: 'Book a call' })}
            </div>
          </div>

          <form className="lm-form" onSubmit={(e) => e.preventDefault()} aria-label="Enquiry form (preview)">
            <div className="field">
              {ed('name_label', { as: 'label', enterBehavior: 'save', placeholder: 'Name' })}
              <input type="text" disabled placeholder={blockContent[editLang === 'nl' ? 'name_ph_nl' : 'name_ph'] || 'Your name'} />
            </div>
            <div className="field">
              {ed('email_label', { as: 'label', enterBehavior: 'save', placeholder: 'Email' })}
              <input type="email" disabled placeholder={blockContent[editLang === 'nl' ? 'email_ph_nl' : 'email_ph'] || 'you@company.com'} />
            </div>
            <div className="field">
              {ed('message_label', { as: 'label', enterBehavior: 'save', placeholder: 'Message' })}
              <textarea disabled placeholder={blockContent[editLang === 'nl' ? 'message_ph_nl' : 'message_ph'] || ''} />
            </div>
            {ed('submit_text', { as: 'span', enterBehavior: 'save', isButton: editLang === 'en', className: 'lm-btn lm-btn--fill submit', placeholder: 'Send enquiry' })}
            {ed('form_note', { as: 'p', enterBehavior: 'save', className: 'note', placeholder: 'Prefer WhatsApp? …' })}
          </form>
        </div>
      </section>
    </>
  );
}
