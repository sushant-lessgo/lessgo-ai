'use client';

// Lumen priced-service cards (edit). Section head + 2-col card grid. Each card:
// name + always-visible Dutch tagline + price (+ mono unit) + pitch + ticked
// deliverables + enquiry link. Bilingual twins routed by the active edit-language.

import React from 'react';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { LumenEditable } from '../../components/LumenEditable';
import { SERVICES_STYLES } from './styles';

interface Deliverable { id: string; text?: string; text_nl?: string; }
interface Service {
  id: string;
  name?: string; name_nl?: string;
  dutch_tagline?: string;
  price?: string; price_unit?: string; price_unit_nl?: string;
  pitch?: string; pitch_nl?: string;
  cta_text?: string; cta_text_nl?: string;
  deliverables?: Deliverable[];
}
interface Content {
  eyebrow: string; eyebrow_nl: string;
  headline: string; headline_nl: string;
  lede: string; lede_nl: string;
  services: Service[];
}

const Tick = () => (
  <span className="lm-tick"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></span>
);

export default function LumenPricedServiceCards({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate, handleCollectionUpdate } =
    useLumenBlock<Content>({ sectionId });
  const edit = mode === 'edit';
  const services = blockContent.services || [];

  const updateSvc = (id: string, key: string, value: string) =>
    handleCollectionUpdate('services', services.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  const updateDeliv = (sid: string, did: string, key: string, value: string) =>
    handleCollectionUpdate('services', services.map((s) =>
      s.id === sid ? { ...s, deliverables: (s.deliverables || []).map((d) => (d.id === did ? { ...d, [key]: value } : d)) } : s));
  const addSvc = () => {
    if (services.length >= 6) return;
    handleCollectionUpdate('services', [...services, {
      id: `s${Date.now()}`, name: 'New service', name_nl: '', dutch_tagline: '',
      price: '€0', price_unit: 'ex. btw', price_unit_nl: '', pitch: '', pitch_nl: '',
      cta_text: 'Request a quote', cta_text_nl: '',
      deliverables: [{ id: `d${Date.now()}`, text: 'What you get', text_nl: '' }],
    }]);
  };
  const removeSvc = (id: string) => {
    if (services.length <= 1) return;
    handleCollectionUpdate('services', services.filter((s) => s.id !== id));
  };
  const addDeliv = (sid: string) =>
    handleCollectionUpdate('services', services.map((s) =>
      s.id === sid ? { ...s, deliverables: [...(s.deliverables || []), { id: `d${Date.now()}`, text: 'New line', text_nl: '' }] } : s));
  const removeDeliv = (sid: string, did: string) =>
    handleCollectionUpdate('services', services.map((s) =>
      s.id === sid ? { ...s, deliverables: (s.deliverables || []).filter((d) => d.id !== did) } : s));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SERVICES_STYLES }} />
      <section className="lm-svc-sec" data-section-id={sectionId}>
        <div className="lm-svc-wrap">
          <div className="lm-sec-head">
            <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="eyebrow" onSave={handleContentUpdate}
              enterBehavior="save" className="lm-eyebrow" placeholder="Services & pricing" />
            <LumenEditable as="h2" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="headline" onSave={handleContentUpdate}
              enterBehavior="save" placeholder="Four ways to photograph your business." />
            <LumenEditable as="p" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="lede" onSave={handleContentUpdate}
              multiline className="lm-lede" placeholder="Clear packages, plain deliverables." />
          </div>

          <div className="lm-svc-grid">
            {services.map((s) => (
              <article className="lm-svc" key={s.id}>
                <div className="lm-svc-top">
                  <div className="lm-svc-name">
                    <LumenEditable as="h3" mode={mode} sectionId={sectionId} editLang={editLang}
                      content={s} elementKey="name" onSave={(k, v) => updateSvc(s.id, k, v)}
                      enterBehavior="save" placeholder="Service name" />
                    <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang="en"
                      content={s} elementKey="dutch_tagline" onSave={(k, v) => updateSvc(s.id, k, v)}
                      enterBehavior="save" className="lm-nl-sub" placeholder="Dutch subtitle" />
                  </div>
                  <div className="lm-svc-price">
                    <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang="en"
                      content={s} elementKey="price" onSave={(k, v) => updateSvc(s.id, k, v)}
                      enterBehavior="save" placeholder="€250" />
                    <LumenEditable as="small" mode={mode} sectionId={sectionId} editLang={editLang}
                      content={s} elementKey="price_unit" onSave={(k, v) => updateSvc(s.id, k, v)}
                      enterBehavior="save" placeholder="ex. btw" />
                  </div>
                </div>
                <LumenEditable as="p" mode={mode} sectionId={sectionId} editLang={editLang}
                  content={s} elementKey="pitch" onSave={(k, v) => updateSvc(s.id, k, v)}
                  multiline className="lm-svc-pitch" placeholder="One-line pitch for this package." />
                <ul className="lm-svc-deliv">
                  {(s.deliverables || []).map((d) => (
                    <li key={d.id}>
                      <Tick />
                      <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                        content={d} elementKey="text" onSave={(k, v) => updateDeliv(s.id, d.id, k, v)}
                        enterBehavior="save" placeholder="What you get" />
                      {edit && (s.deliverables || []).length > 1 && (
                        <button type="button" className="lm-deliv-rm" onClick={() => removeDeliv(s.id, d.id)} aria-label="Remove">×</button>
                      )}
                    </li>
                  ))}
                  {edit && (
                    <li style={{ gridTemplateColumns: '1fr' }}>
                      <button type="button" className="lm-deliv-add" onClick={() => addDeliv(s.id)}>+ Add deliverable</button>
                    </li>
                  )}
                </ul>
                <div className="lm-svc-foot">
                  <a>
                    <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                      content={s} elementKey="cta_text" onSave={(k, v) => updateSvc(s.id, k, v)}
                      enterBehavior="save" placeholder="Request a quote →" />
                  </a>
                </div>
                {edit && services.length > 1 && (
                  <button type="button" className="lm-svc-rm" onClick={() => removeSvc(s.id)} aria-label="Remove service">×</button>
                )}
              </article>
            ))}
          </div>
          {edit && services.length < 6 && (
            <button type="button" className="lm-svc-add" onClick={addSvc}>+ Add service</button>
          )}
        </div>
      </section>
    </>
  );
}
