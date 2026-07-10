'use client';

// src/modules/templates/meridian/blocks/Hero/EditorialPhotoHero.tsx
// Meridian hero VARIANT (scale-09 phase 6) — "Editorial Photo". Photo-led skin
// for the same Hero contract as TerminalHero: same content slots, hero_image is
// the dominant element. Edit mode. requiresAssets: photos (gated in the manifest
// / editor selector — the block itself just renders the striped drop-target
// empty state until an image is uploaded).
// Reference: design_handoff_meridian/"Meridian Variant - Hero (Editorial Photo).html".
// CSS-only (shared EDITORIAL_PHOTO_HERO_STYLES) — editor/published stay in lockstep.

import React from 'react';
import { useMeridianBlock } from '../../hooks/useMeridianBlock';
import { MeridianEditable } from '../../components/MeridianEditable';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { EDITORIAL_PHOTO_HERO_STYLES } from './EditorialPhotoHero.styles';

interface EditorialPhotoHeroContent {
  status_text: string;
  audience_tag: string;
  headline: string;
  lede: string;
  cta_text: string;
  cta_subtext: string;
  secondary_cta_text: string;
  caption: string;
  hero_image: string;
}

interface EditorialPhotoHeroProps {
  sectionId: string;
}

export default function EditorialPhotoHero({ sectionId }: EditorialPhotoHeroProps) {
  const { mode, blockContent, handleContentUpdate } =
    useMeridianBlock<EditorialPhotoHeroContent>({ sectionId });

  const uploadImage = useEditStore((s) => (s as any).uploadImage) as
    | ((file: File, t?: { sectionId: string; elementKey: string }) => Promise<string | void>)
    | undefined;
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const onPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadImage) return;
    setPhotoUploading(true);
    try { await uploadImage(file, { sectionId, elementKey: 'hero_image' }); }
    catch (err) { /* surfaced by the store */ }
    finally { setPhotoUploading(false); }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EDITORIAL_PHOTO_HERO_STYLES }} />
      <section className="mrd-hep" data-section-id={sectionId}>
        <div className="mrd-hep__copy">
          {(blockContent.status_text || blockContent.audience_tag || mode === 'edit') && (
            <div className="mrd-hep__top">
              <span className="mrd-hep__status">
                <span className="mrd-hep__dot" />
                <MeridianEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="status_text"
                  value={blockContent.status_text}
                  onSave={(v) => handleContentUpdate('status_text', v)}
                  enterBehavior="save"
                  placeholder="status · live now"
                />
              </span>
              {(blockContent.audience_tag || mode === 'edit') && (
                <MeridianEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="audience_tag"
                  value={blockContent.audience_tag}
                  onSave={(v) => handleContentUpdate('audience_tag', v)}
                  enterBehavior="save"
                  className="mrd-hep__tag"
                  placeholder="for your audience"
                />
              )}
            </div>
          )}

          <MeridianEditable
            as="h1"
            mode={mode}
            sectionId={sectionId}
            elementKey="headline"
            value={blockContent.headline}
            onSave={(v) => handleContentUpdate('headline', v)}
            enterBehavior="save"
            className="mrd-hep__headline"
            placeholder="Your headline with an <em>accent</em>"
          />

          <MeridianEditable
            as="p"
            mode={mode}
            sectionId={sectionId}
            elementKey="lede"
            value={blockContent.lede}
            onSave={(v) => handleContentUpdate('lede', v)}
            multiline
            className="mrd-hep__lede"
            placeholder="One long sentence framing the value, then one short."
          />

          <div className="mrd-hep__actions">
            <div className="mrd-hep__cta-wrap">
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="cta_text"
                value={blockContent.cta_text}
                onSave={(v) => handleContentUpdate('cta_text', v)}
                enterBehavior="save"
                isButton
                className="mrd-btn mrd-btn--primary mrd-btn--lg mrd-btn--arrow"
                placeholder="Start building"
              />
              {(blockContent.cta_subtext || mode === 'edit') && (
                <MeridianEditable
                  as="span"
                  mode={mode}
                  sectionId={sectionId}
                  elementKey="cta_subtext"
                  value={blockContent.cta_subtext}
                  onSave={(v) => handleContentUpdate('cta_subtext', v)}
                  enterBehavior="save"
                  className="mrd-hep__cta-sub"
                  placeholder="no credit card · 14-day trial"
                />
              )}
            </div>
            {(blockContent.secondary_cta_text || mode === 'edit') && (
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="secondary_cta_text"
                value={blockContent.secondary_cta_text}
                onSave={(v) => handleContentUpdate('secondary_cta_text', v)}
                enterBehavior="save"
                isButton
                className="mrd-btn mrd-btn--ghost mrd-btn--lg"
                placeholder="Read the docs"
              />
            )}
          </div>
        </div>

        <div className="mrd-hep__media">
          <div className="mrd-hep__frame">
            <div className="mrd-hep__img">
              {blockContent.hero_image ? (
                <img src={blockContent.hero_image} alt="" />
              ) : (
                <span className="mrd-hep__slot-lbl">
                  <b>hero_image</b><br />product shot / team / dashboard — 4:5 or wider
                </span>
              )}
            </div>
            {(blockContent.caption || mode === 'edit') && (
              <MeridianEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="caption"
                value={blockContent.caption}
                onSave={(v) => handleContentUpdate('caption', v)}
                enterBehavior="save"
                className="mrd-hep__caption"
                placeholder="A short caption for the image"
              />
            )}
            {mode === 'edit' && (
              <span className="mrd-hep__photo-edit">
                <label className="mrd-hep__photo-btn">
                  {photoUploading ? 'Uploading…' : (blockContent.hero_image ? 'Change photo' : '↥ Add photo')}
                  <input type="file" accept="image/*" onChange={onPhotoFile} hidden disabled={photoUploading} />
                </label>
                {blockContent.hero_image && (
                  <button type="button" className="mrd-hep__photo-x" onClick={() => handleContentUpdate('hero_image', '')}>remove</button>
                )}
              </span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
