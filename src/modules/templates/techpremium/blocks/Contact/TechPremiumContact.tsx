'use client';

// TechPremium Contact page block (Phase 4c) — edit mode.
// 2-col: contact-info rows (left) + lead form (right) + map placeholder.
// The form is a non-functional PREVIEW here (fields from DEFAULT_CONTACT_FIELDS);
// on the published page it becomes a real <form data-lessgo-form> wired to
// form.v1.js → /api/forms/submit. Surface paper. Ported from naayom.blocks.css
// .contact-in / .cinfo / .lead-form / .fgrid / .map-ph.

import React from 'react';
import * as Icons from 'lucide-react';
import { useTechPremiumBlock } from '../../hooks/useTechPremiumBlock';
import { TechPremiumEditable } from '../../components/TechPremiumEditable';
import { SEC_HEAD_STYLES, PH_STYLES, BTN_STYLES } from '../shared/sharedStyles';
import { DEFAULT_CONTACT_FIELDS, CONTACT_SUBMIT_TEXT } from './contactFields';
import { mapEmbedSrc } from './mapEmbedSrc';
import type { MVPFormField } from '@/types/core/forms';

interface InfoRow { id: string; icon: string; k: string; v: string; href: string; sub: string }
interface Content {
  eyebrow: string; headline: string; lede: string;
  form_id: string; form_heading: string; form_note: string; form_foot: string;
  whatsapp_text: string; whatsapp_href: string; map_caption: string; map_embed: string;
  info: InfoRow[];
}
interface Props { sectionId: string }
const rid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;


const ICON_CHOICES = ['Phone', 'Mail', 'MapPin', 'Clock', 'MessageCircle'];

/** Shared field preview (edit = inert inputs). Mirrors the published markup. */
export function renderContactField(field: MVPFormField, formId: string, key?: string) {
  const fid = `${formId || 'contact'}-${field.id}`;
  return (
    <div key={key ?? field.id} className={`tp-field${field.type === 'textarea' ? ' full' : ''}`}>
      <label htmlFor={fid}>{field.label}{field.required && <span className="tp-req">*</span>}</label>
      {field.type === 'textarea' ? (
        <textarea id={fid} name={field.id} placeholder={field.placeholder} required={field.required} rows={4} />
      ) : field.type === 'select' ? (
        <select id={fid} name={field.id} required={field.required} defaultValue="">
          <option value="">{field.placeholder || 'Select…'}</option>
          {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input id={fid} type={field.type} name={field.id} placeholder={field.placeholder} required={field.required} />
      )}
    </div>
  );
}

export default function TechPremiumContact({ sectionId }: Props) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } = useTechPremiumBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const info = blockContent.info || [];
  const fields = DEFAULT_CONTACT_FIELDS;

  const setInfo = (id: string, k: keyof InfoRow, v: string) =>
    handleCollectionUpdate('info', info.map((r) => (r.id === id ? { ...r, [k]: v } : r)));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CONTACT_STYLES }} />
      <section className="tp-sec tp-contact" data-section-id={sectionId}>
        <div className="tp-sec__inner">
          <div className="tp-sec-head">
            {(blockContent.eyebrow || edit) && (
              <TechPremiumEditable as="span" className="tp-eyebrow" mode={mode} sectionId={sectionId} elementKey="eyebrow" value={blockContent.eyebrow} onSave={(v) => handleContentUpdate('eyebrow', v)} enterBehavior="save" placeholder="Contact" />
            )}
            <TechPremiumEditable as="h2" mode={mode} sectionId={sectionId} elementKey="headline" value={blockContent.headline} onSave={(v) => handleContentUpdate('headline', v)} enterBehavior="save" placeholder="Let’s map it to your setup." />
            {(blockContent.lede || edit) && (
              <TechPremiumEditable as="p" className="tp-lede" mode={mode} sectionId={sectionId} elementKey="lede" value={blockContent.lede} onSave={(v) => handleContentUpdate('lede', v)} multiline placeholder="Tell us your setup — WhatsApp is the fastest." />
            )}
          </div>

          <div className="tp-contact-in">
            {/* Left — contact info */}
            <div className="tp-contact-info">
              {info.map((r) => {
                const Icon = (Icons as any)[r.icon] || Icons.Phone;
                return (
                  <div key={r.id} className="tp-cinfo">
                    <span className="tp-cinfo__ico"><Icon /></span>
                    <div>
                      <div className="tp-cinfo__k">
                        <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`info_k_${r.id}`} value={r.k} onSave={(v) => setInfo(r.id, 'k', v)} enterBehavior="save" placeholder="Call / WhatsApp" />
                      </div>
                      <div className="tp-cinfo__v">
                        <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`info_v_${r.id}`} value={r.v} onSave={(v) => setInfo(r.id, 'v', v)} enterBehavior="save" placeholder="+91 99999 99999" />
                      </div>
                      {(r.sub || edit) && (
                        <div className="tp-cinfo__sub">
                          <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey={`info_sub_${r.id}`} value={r.sub} onSave={(v) => setInfo(r.id, 'sub', v)} enterBehavior="save" placeholder="Mon–Sat, 9am–7pm" />
                        </div>
                      )}
                      {edit && (
                        <div className="tp-cinfo__edit">
                          <select value={r.icon} onChange={(e) => setInfo(r.id, 'icon', e.target.value)} aria-label="Icon">
                            {ICON_CHOICES.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                          </select>
                          <input value={r.href} onChange={(e) => setInfo(r.id, 'href', e.target.value)} placeholder="tel:/mailto: link (optional)" />
                          <button type="button" className="tp-x" onClick={() => handleCollectionUpdate('info', info.filter((x) => x.id !== r.id))}>× row</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {edit && info.length < 4 && (
                <button type="button" className="tp-add" onClick={() => handleCollectionUpdate('info', [...info, { id: rid('ci'), icon: 'Phone', k: 'Label', v: 'Value', href: '', sub: '' }])}>+ contact row</button>
              )}

              {(blockContent.whatsapp_text || edit) && (
                <span className="tp-cwa">
                  <TechPremiumEditable as="span" className="tp-btn2 wa tp-cwa-btn" isButton mode={mode} sectionId={sectionId} elementKey="whatsapp_text" value={blockContent.whatsapp_text} onSave={(v) => handleContentUpdate('whatsapp_text', v)} enterBehavior="save" placeholder="Chat on WhatsApp" />
                  {edit && (
                    <input className="tp-cwa-href" value={blockContent.whatsapp_href || ''} onChange={(e) => handleContentUpdate('whatsapp_href', e.target.value)} placeholder="WhatsApp link (https://wa.me/…)" />
                  )}
                </span>
              )}
            </div>

            {/* Right — lead form preview (real on published) */}
            <form className="tp-lead-form" onSubmit={(e) => e.preventDefault()}>
              <TechPremiumEditable as="h2" className="tp-form-heading" mode={mode} sectionId={sectionId} elementKey="form_heading" value={blockContent.form_heading} onSave={(v) => handleContentUpdate('form_heading', v)} enterBehavior="save" placeholder="Book a demo" />
              {(blockContent.form_note || edit) && (
                <TechPremiumEditable as="p" className="tp-form-note" mode={mode} sectionId={sectionId} elementKey="form_note" value={blockContent.form_note} onSave={(v) => handleContentUpdate('form_note', v)} multiline placeholder="No pricing pressure — just a 30-minute walkthrough." />
              )}
              <div className="tp-fgrid">
                {fields.map((f) => renderContactField(f, blockContent.form_id))}
              </div>
              <span className="tp-btn2 lime tp-form-submit">{CONTACT_SUBMIT_TEXT}</span>
              {(blockContent.form_foot || edit) && (
                <TechPremiumEditable as="p" className="tp-form-foot" mode={mode} sectionId={sectionId} elementKey="form_foot" value={blockContent.form_foot} onSave={(v) => handleContentUpdate('form_foot', v)} placeholder="By submitting you agree to be contacted about your enquiry." />
              )}
            </form>
          </div>

          {(() => {
            const src = mapEmbedSrc(blockContent.map_embed);
            const badEmbed = !!(blockContent.map_embed && !src);
            return (
              <div className="tp-contact-map">
                <div className="tp-ph tp-map-ph">
                  {src ? (
                    <iframe className="tp-map-frame" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen title="Location map" />
                  ) : (
                    <span className="tp-tag">
                      <TechPremiumEditable as="span" mode={mode} sectionId={sectionId} elementKey="map_caption" value={blockContent.map_caption} onSave={(v) => handleContentUpdate('map_caption', v)} enterBehavior="save" placeholder="Embedded map — your location" />
                    </span>
                  )}
                </div>
                {edit && (
                  <div className="tp-map-edit">
                    <input
                      className="tp-map-input"
                      value={blockContent.map_embed || ''}
                      onChange={(e) => handleContentUpdate('map_embed', e.target.value)}
                      placeholder="Paste Google Maps ‘Embed a map’ link or <iframe> code"
                    />
                    {badEmbed
                      ? <span className="tp-map-hint tp-map-hint--bad">Not a Google Maps embed link — use Share → Embed a map.</span>
                      : <span className="tp-map-hint">Google Maps → Share → Embed a map → paste here. Leave empty to hide.</span>}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </section>
    </>
  );
}

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
.tp-lead-form { border:1px solid var(--line-2); border-radius:var(--r-lg); background:var(--paper); padding:clamp(24px,3vw,36px); box-shadow:0 18px 48px -34px oklch(0.30 0.04 158 / 0.5); }
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
