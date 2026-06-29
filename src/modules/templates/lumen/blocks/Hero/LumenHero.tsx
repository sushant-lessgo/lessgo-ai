'use client';

// Lumen hero (edit). 2-col: left = copy (eyebrow, display headline w/ italic
// brass <em>, lede, dual CTA, "for ..." who-line); right = portrait photo with a
// brass viewfinder frame-line, a badge, and a Fig. caption. Consumes LumenHero.

import React from 'react';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { LumenEditable } from '../../components/LumenEditable';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { HERO_STYLES } from './styles';

interface LumenHeroContent {
  eyebrow: string; eyebrow_nl: string;
  headline: string; headline_nl: string;
  lede: string; lede_nl: string;
  cta_text: string; cta_text_nl: string;
  secondary_cta_text: string; secondary_cta_text_nl: string;
  who_text: string; who_text_nl: string;
  badge_text: string; badge_text_nl: string;
  fig_caption: string; fig_caption_nl: string;
  fig_number: string; fig_ratio: string;
  hero_image: string;
}

export default function LumenHero({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate } = useLumenBlock<LumenHeroContent>({ sectionId });
  const edit = mode === 'edit';

  // Naayom (TechPremium) inline image-replace pattern: hidden file input +
  // uploadImage(file, {sectionId, elementKey}) — store auto-persists (no toolbar).
  const uploadImage = (useEditStore() as any).uploadImage as
    | ((file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>)
    | undefined;
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const onPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadImage) return;
    setPhotoUploading(true);
    try { await uploadImage(file, { sectionId, elementKey: 'hero_image' }); }
    catch { /* surfaced by the store */ }
    finally { setPhotoUploading(false); }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <section className="lm-hero" data-section-id={sectionId} id="top">
        <div className="lm-hero-in">
          <div className="lm-hero-copy">
            <LumenEditable
              as="span" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="eyebrow" onSave={handleContentUpdate}
              enterBehavior="save" className="lm-eyebrow" placeholder="Corporate photography · your city"
            />
            <LumenEditable
              as="h1" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="headline" onSave={handleContentUpdate}
              className="lm-hero__display" placeholder="The version of your company that wins the room."
            />
            <LumenEditable
              as="p" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="lede" onSave={handleContentUpdate}
              multiline className="lm-lede" placeholder="What you make companies look like…"
            />
            <div className="lm-hero-actions">
              <LumenEditable
                as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                content={blockContent} elementKey="cta_text" onSave={handleContentUpdate}
                enterBehavior="save" isButton={editLang === 'en'}
                className="lm-btn lm-btn--fill" placeholder="See recent work"
              />
              <LumenEditable
                as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                content={blockContent} elementKey="secondary_cta_text" onSave={handleContentUpdate}
                enterBehavior="save" isButton={editLang === 'en'}
                className="lm-btn lm-btn--line" placeholder="Request a quote"
              />
            </div>
            <LumenEditable
              as="p" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="who_text" onSave={handleContentUpdate}
              enterBehavior="save" className="lm-hero-who" placeholder="For law firms · consultancies · startups"
            />
          </div>

          <div className="lm-hero-art">
            <div className="lm-ph lm-shot port on-dark">
              {blockContent.hero_image ? (
                <img src={blockContent.hero_image} alt={blockContent.badge_text || 'Hero portrait'} />
              ) : (
                <span className="lm-ph__tag">Hero portrait — executive, on-brand</span>
              )}
              {blockContent.badge_text && (
                <LumenEditable
                  as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                  content={blockContent} elementKey="badge_text" onSave={handleContentUpdate}
                  enterBehavior="save" className="lm-badge" placeholder="On location"
                />
              )}
              {edit && (
                <span className="lm-photo-edit">
                  <label className="lm-photo-edit__btn">
                    {photoUploading ? 'Uploading…' : (blockContent.hero_image ? 'Change photo' : '↥ Add photo')}
                    <input type="file" accept="image/*" onChange={onPhotoFile} hidden disabled={photoUploading} />
                  </label>
                  {blockContent.hero_image && (
                    <button type="button" className="lm-photo-edit__x" onClick={() => handleContentUpdate('hero_image', '')}>remove</button>
                  )}
                </span>
              )}
            </div>
            <span className="lm-frameline" />
            <div className="lm-fig">
              <span className="n">{blockContent.fig_number || 'Fig. 01'}</span>
              <LumenEditable
                as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                content={blockContent} elementKey="fig_caption" onSave={handleContentUpdate}
                enterBehavior="save" placeholder="Executive portrait"
              />
              <span className="ratio">{blockContent.fig_ratio || '4:5'}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
