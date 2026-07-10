'use client';

// Lumen About block (edit). 2-col: left = photographer portrait (uploaded
// about_image, with a brass frameline + fig caption); right = eyebrow, headline,
// body paragraphs, an italic signature, and two CTAs. Bilingual twins routed by
// the active edit-language (signature/fig_number are language-agnostic → 'en').

import React from 'react';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { LumenEditable } from '../../components/LumenEditable';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { ABOUT_STYLES } from './styles';

interface AboutContent {
  eyebrow: string; eyebrow_nl: string;
  headline: string; headline_nl: string;
  body: string; body_nl: string;
  body2: string; body2_nl: string;
  signature: string;
  cta_text: string; cta_text_nl: string;
  secondary_cta_text: string; secondary_cta_text_nl: string;
  fig_caption: string; fig_caption_nl: string;
  fig_number: string;
  about_image: string;
}

export default function LumenPhotographerAbout({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate, isExcluded } =
    useLumenBlock<AboutContent>({ sectionId });
  const edit = mode === 'edit';

  // Naayom (TechPremium) inline image-replace pattern: hidden file input +
  // uploadImage(file, {sectionId, elementKey}) — store auto-persists (no toolbar).
  const uploadImage = useEditStore((s) => (s as any).uploadImage) as
    | ((file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>)
    | undefined;
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const onPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadImage) return;
    setPhotoUploading(true);
    try { await uploadImage(file, { sectionId, elementKey: 'about_image' }); }
    catch { /* surfaced by the store */ }
    finally { setPhotoUploading(false); }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ABOUT_STYLES }} />
      <div className="lm-about-in" data-section-id={sectionId}>
        <div className="lm-about-portrait">
          <div className="lm-ph">
            {blockContent.about_image ? (
              <img src={blockContent.about_image} alt={blockContent.fig_caption || 'Portrait'} />
            ) : (
              <span className="lm-ph-tag">Portrait of the photographer</span>
            )}
            {edit && (
              <span className="lm-photo-edit">
                <label className="lm-photo-edit__btn">
                  {photoUploading ? 'Uploading…' : (blockContent.about_image ? 'Change photo' : '↥ Add photo')}
                  <input type="file" accept="image/*" onChange={onPhotoFile} hidden disabled={photoUploading} />
                </label>
                {blockContent.about_image && (
                  <button type="button" className="lm-photo-edit__x" onClick={() => handleContentUpdate('about_image', '')}>remove</button>
                )}
              </span>
            )}
          </div>
          <span className="lm-frameline" />
          <div className="lm-fig">
            <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang="en"
              content={blockContent} elementKey="fig_number" onSave={handleContentUpdate}
              enterBehavior="save" className="lm-fig-n" placeholder="Fig. 08" />
            <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="fig_caption" onSave={handleContentUpdate}
              enterBehavior="save" placeholder="Portrait, your city" />
            <span className="lm-fig-ratio">4:5</span>
          </div>
        </div>

        <div className="lm-about-copy">
          {(blockContent.eyebrow || (edit && !isExcluded('eyebrow'))) && (
            <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="eyebrow" onSave={handleContentUpdate}
              enterBehavior="save" className="lm-eyebrow" placeholder="About" />
          )}
          <LumenEditable as="h2" mode={mode} sectionId={sectionId} editLang={editLang}
            content={blockContent} elementKey="headline" onSave={handleContentUpdate}
            enterBehavior="save" placeholder="I’m a corporate photographer in <em>your city.</em>" />
          <LumenEditable as="p" mode={mode} sectionId={sectionId} editLang={editLang}
            content={blockContent} elementKey="body" onSave={handleContentUpdate}
            multiline placeholder="What you do, who you serve, and the outcome for the client." />
          {(blockContent.body2 || (edit && !isExcluded('body2'))) && (
            <LumenEditable as="p" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="body2" onSave={handleContentUpdate}
              multiline placeholder="An optional second paragraph." />
          )}
          {(blockContent.signature || edit) && (
            <LumenEditable as="div" mode={mode} sectionId={sectionId} editLang="en"
              content={blockContent} elementKey="signature" onSave={handleContentUpdate}
              enterBehavior="save" className="lm-about-sign" placeholder="Your Name" />
          )}
          <div className="lm-about-actions">
            <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
              content={blockContent} elementKey="cta_text" onSave={handleContentUpdate}
              enterBehavior="save" isButton={editLang === 'en'} className="lm-btn lm-btn-brass"
              placeholder="Request a quote" />
            {(blockContent.secondary_cta_text || (edit && !isExcluded('secondary_cta_text'))) && (
              <LumenEditable as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                content={blockContent} elementKey="secondary_cta_text" onSave={handleContentUpdate}
                enterBehavior="save" isButton={editLang === 'en'} className="lm-btn lm-btn-line"
                placeholder="See the work" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
