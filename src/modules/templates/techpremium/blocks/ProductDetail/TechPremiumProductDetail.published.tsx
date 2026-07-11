// src/modules/templates/techpremium/blocks/ProductDetail/TechPremiumProductDetail.published.tsx
// Server-safe published product detail. Renders the full record; gallery prev/next/
// thumbs/zoom + shared lightbox are wired by a per-block inline <script> (idempotent,
// no-op when its markup is absent, reduced-motion irrelevant — CSS opacity only).

import React from 'react';
import { ChevronLeft, ChevronRight, Expand, Check } from 'lucide-react';
import { PD_STYLES } from './styles';

interface Img { id?: string; src?: string; tag?: string }
interface Badge { id?: string; label?: string; tone?: string }
interface Feature { id?: string; text?: string }
interface Spec { id?: string; key?: string; value?: string }
interface RelatedCard { id?: string; model?: string; name?: string; oneLiner?: string; image?: string; cardSpec?: string; href?: string }
interface Props {
  sectionId: string;
  model?: string; name?: string; oneLiner?: string; lede?: string; note?: string;
  enquireText?: string; whatsappText?: string;
  images?: Img[]; badges?: Badge[]; features?: Feature[]; specs?: Spec[]; related?: RelatedCard[];
}

const WA_NUMBER = '919999999999'; // placeholder; replaced with the brand number at go-live

export default function TechPremiumProductDetailPublished(props: Props) {
  const images = (Array.isArray(props.images) ? props.images : []).filter((i) => i && (i.src || i.tag));
  const badges = Array.isArray(props.badges) ? props.badges : [];
  const features = Array.isArray(props.features) ? props.features.filter((f) => f?.text) : [];
  const specs = Array.isArray(props.specs) ? props.specs.filter((s) => s?.key || s?.value) : [];
  const related = Array.isArray(props.related) ? props.related : [];
  const multi = images.length > 1;
  const waText = encodeURIComponent(`Hi, I'm interested in the ${props.model || props.name || 'product'}.`);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PD_STYLES }} />
      <section className="tp-pd">
        <div className="tp-pd__inner">
          <div className="tp-crumb">
            <a href="/">Home</a> <span className="tp-sep">/</span> <a href="/products">Products</a> <span className="tp-sep">/</span> {props.model || props.name || 'Product'}
          </div>

          <div className="tp-pd-top">
            <div className="tp-pd-gallery" data-tp-pd>
              <div className="tp-pd-stage">
                {images.map((im, i) => (
                  <div key={i} className={`tp-pd-slide${i === 0 ? ' is-active' : ''}`} data-cap={im.tag || ''}>
                    {im.src ? <img src={im.src} alt={im.tag || ''} loading="lazy" decoding="async" /> : <span className="tp-pd-ph">{im.tag || `Image ${i + 1}`}</span>}
                  </div>
                ))}
                {multi && (
                  <>
                    <button type="button" className="tp-pd-nav prev" data-prev aria-label="Previous"><ChevronLeft size={18} /></button>
                    <button type="button" className="tp-pd-nav next" data-next aria-label="Next"><ChevronRight size={18} /></button>
                  </>
                )}
                {images.length > 0 && <button type="button" className="tp-pd-zoom" data-zoom aria-label="Expand"><Expand size={16} /></button>}
                <span className="tp-pd-count"><span className="tp-cur">1</span> / {images.length || 1}</span>
              </div>
              {multi && (
                <div className="tp-pd-thumbs">
                  {images.map((im, i) => (
                    <button key={i} type="button" className={`tp-pd-thumb${i === 0 ? ' is-active' : ''}`} data-thumb={i} aria-label={`Image ${i + 1}`}>
                      {im.src ? <img src={im.src} alt="" loading="lazy" decoding="async" /> : <span className="tp-pd-ph sm">{i + 1}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="tp-pd-info">
              {props.model && <span className="tp-pd-model">{props.model}</span>}
              {props.name && <h1 className="tp-pd-h1">{props.name}</h1>}
              {props.lede && <p className="tp-pd-lede" dangerouslySetInnerHTML={{ __html: props.lede }} />}
              {badges.length > 0 && (
                <div className="tp-pd-meta">
                  {badges.filter((b) => b?.label).map((b, i) => (
                    <span key={i} className={`tp-pill${b.tone === 'teal' ? ' teal' : ''}`}><span className="tp-dot" />{b.label}</span>
                  ))}
                </div>
              )}
              <div className="tp-pd-actions">
                <a className="tp-pd-btn lime" href="/contact">{props.enquireText || 'Enquire'}</a>
                <a className="tp-pd-btn wa" href={`https://wa.me/${WA_NUMBER}?text=${waText}`}>{props.whatsappText || 'Ask on WhatsApp'}</a>
              </div>
              {props.note && <p className="tp-pd-note" dangerouslySetInnerHTML={{ __html: props.note }} />}

              {features.length > 0 && (
                <div className="tp-pd-specs">
                  <h2>What it does</h2>
                  <ul className="tp-feat-list">
                    {features.map((f, i) => <li key={i}><Check size={20} /><span>{f.text}</span></li>)}
                  </ul>
                </div>
              )}
              {specs.length > 0 && (
                <div className="tp-pd-specs">
                  <h2>Specifications</h2>
                  <div className="tp-spec-list">
                    {specs.map((s, i) => <div key={i} className="tp-spec-row"><span className="tp-spec-k">{s.key}</span><span className="tp-spec-v">{s.value}</span></div>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <div className="tp-pd-related">
              <div className="tp-related-head"><h2>Related <em>products</em></h2></div>
              <div className="tp-pcards">
                {related.map((r, i) => (
                  <a key={i} className="tp-pcard" href={r.href || '#'}>
                    <div className="tp-pshot">{r.image ? <img src={r.image} alt={r.name || ''} loading="lazy" decoding="async" /> : <span className="tp-pshot__ph">{r.model || 'Product'}</span>}</div>
                    <div className="tp-pbody">
                      {r.model && <span className="tp-pmodel">{r.model}</span>}
                      {r.name && <h4 className="tp-ph4">{r.name}</h4>}
                      {r.oneLiner && <p className="tp-pp">{r.oneLiner}</p>}
                      <div className="tp-pfoot">{r.cardSpec ? <span className="tp-pspecs">{r.cardSpec}</span> : <span />}<span className="tp-penq">View details →</span></div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Gallery + lightbox behavior is now wired by the shared naayom.v1.js asset
          (injected by htmlGenerator on TechPremium pages) — markup contract is the
          [data-tp-pd] / .tp-lightbox classes below, unchanged from Phase 3. */}
    </>
  );
}
