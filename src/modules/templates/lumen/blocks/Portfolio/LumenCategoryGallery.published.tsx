// Server-safe published Lumen portfolio. Category covers carry data-lumen-* so
// lumen.v1.js opens the lightbox; one .lm-lb modal is rendered once. data-en/data-nl
// for the language toggle.

import React from 'react';
import { bilingualAttrs } from '../../i18nKeys';
import { PORTFOLIO_STYLES } from './styles';

interface Img { id?: string; src?: string; }
interface Category {
  id?: string; group?: string; group_nl?: string; name?: string; name_nl?: string;
  index_label?: string; index_label_nl?: string; ratio?: string; fig?: string;
  cover_image?: string; images?: Img[];
}
interface Props {
  sectionId: string;
  eyebrow?: string; eyebrow_nl?: string;
  headline?: string; headline_nl?: string;
  lede?: string; lede_nl?: string;
  categories?: Category[];
}

export default function LumenCategoryGalleryPublished(props: Props) {
  const cats = Array.isArray(props.categories) ? props.categories : [];
  const groups: string[] = [];
  cats.forEach((c) => { const g = c.group || 'Work'; if (!groups.includes(g)) groups.push(g); });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PORTFOLIO_STYLES }} />
      <section className="lm-pf" id="work">
        <div className="lm-pf-in">
          <div className="lm-sec-head">
            {props.eyebrow && <span className="lm-eyebrow" {...bilingualAttrs(props.eyebrow, props.eyebrow_nl || '')}>{props.eyebrow}</span>}
            <h2 {...bilingualAttrs(props.headline || '', props.headline_nl || '')} dangerouslySetInnerHTML={{ __html: props.headline || '' }} />
            {props.lede && <p className="lm-lede" {...bilingualAttrs(props.lede, props.lede_nl || '')} dangerouslySetInnerHTML={{ __html: props.lede }} />}
          </div>

          {groups.map((g) => {
            const groupCats = cats.filter((c) => (c.group || 'Work') === g);
            const first = groupCats[0];
            const groupNl = first?.group_nl || '';
            return (
              <div className="lm-pf-group" key={g}>
                <div className="lm-sec-rule">
                  <h2 {...bilingualAttrs(g, groupNl)}>{g}</h2>
                  {first?.index_label && (
                    <span className="idx" {...bilingualAttrs(first.index_label, first.index_label_nl || '')}>{first.index_label}</span>
                  )}
                </div>
                <div className={`lm-pf-cards ${first?.ratio === 'port' ? 'port' : 'land'}`}>
                  {groupCats.map((c, i) => {
                    const srcs = (c.images || []).map((im) => im.src || '').filter(Boolean);
                    return (
                      <button
                        key={c.id || i}
                        type="button"
                        className="lm-pf-card"
                        data-lumen-gallery={c.id || `g${i}`}
                        data-lumen-name={c.name || ''}
                        data-lumen-name-nl={c.name_nl || ''}
                        data-lumen-group={g}
                        data-lumen-group-nl={groupNl}
                        data-lumen-fig={c.fig || ''}
                        data-lumen-ratio={c.ratio === 'port' ? 'port' : 'land'}
                        data-lumen-images={JSON.stringify(srcs)}
                      >
                        <div className={`lm-ph lm-shot ${c.ratio === 'port' ? 'port' : 'land'}`}>
                          {c.cover_image ? <img src={c.cover_image} alt={c.name || ''} /> : <span className="lm-ph__tag">{(c.name || 'Category')} — cover</span>}
                          <span className="open">Open gallery</span>
                        </div>
                        <div className="lm-fig">
                          <span className="n">{`Fig. ${c.fig || '—'}`}</span>
                          <span {...bilingualAttrs(c.name || '', c.name_nl || '')}>{c.name || ''}</span>
                          <span className="ratio">{c.ratio === 'port' ? '4:5' : '3:2'} · {srcs.length || (c.images || []).length}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Lightbox — populated by lumen.v1.js on cover click */}
      <div className="lm-lb" id="lm-lightbox" role="dialog" aria-modal="true" aria-label="Gallery">
        <div className="lm-lb-scrim" data-lm-lb-close />
        <div className="lm-lb-stage">
          <div className="lm-lb-head">
            <div className="lm-lb-title">
              <span className="grp" id="lm-lb-grp" />
              <span className="cat" id="lm-lb-cat" />
            </div>
            <button className="lm-lb-close" type="button" data-lm-lb-close aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div className="lm-lb-body">
            <button className="lm-lb-arrow" type="button" id="lm-lb-prev" aria-label="Previous">
              <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <div className="lm-lb-frame">
              <div className="lm-ph land" id="lm-lb-img"><span className="lm-ph__tag" id="lm-lb-tag" /></div>
            </div>
            <button className="lm-lb-arrow" type="button" id="lm-lb-next" aria-label="Next">
              <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="lm-lb-foot">
            <span className="lm-lb-cap" id="lm-lb-fig" />
            <div className="lm-lb-dots" id="lm-lb-dots" />
            <span className="lm-lb-count"><b id="lm-lb-i">1</b> / <span id="lm-lb-n">1</span></span>
          </div>
        </div>
      </div>
    </>
  );
}
