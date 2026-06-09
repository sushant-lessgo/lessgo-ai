'use client';

// src/modules/service/blocks/Testimonials/PullQuoteWithMark.tsx
// Hearth single pull-quote testimonial. Edit mode.
// Reference: Hearth - Warm Service.html lines 1485-1510, .testi-card (498-545).

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { HearthEditable } from '../../components/HearthEditable';
import { HearthAddImageOverlay } from '../../components/HearthAddImageOverlay';
import { useImageToolbar } from '@/hooks/useImageToolbar';

interface PullQuoteWithMarkContent {
  eyebrow: string;
  quote: string;
  author_name: string;
  author_role: string;
  author_company: string;
  author_photo: string;
  meta: string;
}

interface PullQuoteWithMarkProps {
  sectionId: string;
}

export default function PullQuoteWithMark({ sectionId }: PullQuoteWithMarkProps) {
  const { mode, blockContent, handleContentUpdate } = useServiceBlock<PullQuoteWithMarkContent>({
    sectionId,
  });
  const handleImageToolbar = useImageToolbar();

  const roleLine = [blockContent.author_role, blockContent.author_company]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="hearth-testi" data-section-id={sectionId}>
        {(blockContent.eyebrow || mode === 'edit') && (
          <HearthEditable
            as="div"
            mode={mode}
            sectionId={sectionId}
            elementKey="eyebrow"
            value={blockContent.eyebrow}
            onSave={(v) => handleContentUpdate('eyebrow', v)}
            enterBehavior="save"
            className="hearth-eyebrow"
            placeholder="Kind words"
          />
        )}
        <article className="hearth-testi__card">
          <div className="hearth-testi__mark" aria-hidden="true">"</div>
          <HearthEditable
            as="div"
            mode={mode}
            sectionId={sectionId}
            elementKey="quote"
            value={blockContent.quote}
            onSave={(v) => handleContentUpdate('quote', v)}
            multiline
            className="hearth-testi__quote"
            placeholder="A short, specific testimonial in the client's voice."
          />
          <div className="hearth-testi__who">
            <div
              className="hearth-testi__avatar"
              data-image-id={`${sectionId}-author-photo`}
              data-element-key="author_photo"
              style={{
                position: 'relative',
                backgroundImage: blockContent.author_photo
                  ? `url(${blockContent.author_photo})`
                  : 'linear-gradient(135deg, var(--clay), var(--accent))',
              }}
              onMouseUp={(e) => {
                if (mode === 'edit') {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  handleImageToolbar(`${sectionId}-author-photo`, {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                  });
                }
              }}
            >
              {mode === 'edit' && !blockContent.author_photo && (
                <HearthAddImageOverlay compact />
              )}
            </div>
            <div className="hearth-testi__who-text">
              <HearthEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey="author_name"
                value={blockContent.author_name}
                onSave={(v) => handleContentUpdate('author_name', v)}
                enterBehavior="save"
                className="hearth-testi__name"
                placeholder="Client name"
              />
              {(roleLine || mode === 'edit') && (
                <div className="hearth-testi__role">
                  <HearthEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="author_role"
                    value={blockContent.author_role}
                    onSave={(v) => handleContentUpdate('author_role', v)}
                    enterBehavior="save"
                    placeholder="Role"
                  />
                  {(blockContent.author_company || mode === 'edit') && (
                    <>
                      {blockContent.author_role && blockContent.author_company && ' · '}
                      <HearthEditable
                        as="span"
                        mode={mode}
                        sectionId={sectionId}
                        elementKey="author_company"
                        value={blockContent.author_company}
                        onSave={(v) => handleContentUpdate('author_company', v)}
                        enterBehavior="save"
                        placeholder="Company"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
        {(blockContent.meta || mode === 'edit') && (
          <HearthEditable
            as="div"
            mode={mode}
            sectionId={sectionId}
            elementKey="meta"
            value={blockContent.meta}
            onSave={(v) => handleContentUpdate('meta', v)}
            enterBehavior="save"
            className="hearth-testi__meta"
            placeholder="Optional meta line"
          />
        )}
      </section>
    </>
  );
}

const STYLES = `
.hearth-testi {
  max-width: 880px; margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
  text-align: center;
}
.hearth-testi__card {
  position: relative;
  background: var(--cream-1); border: 1px solid var(--sand);
  border-radius: var(--r-lg); padding: 56px 48px 36px;
  text-align: left;
  margin-top: 32px;
}
.hearth-testi__mark {
  position: absolute; top: 16px; left: 32px;
  font-family: var(--font-display); font-style: italic;
  font-size: 80px; line-height: 1; color: var(--accent);
}
.hearth-testi__quote {
  font-family: var(--font-display); font-weight: 400;
  font-size: 24px; line-height: 1.4; color: var(--ink); margin: 0 0 32px;
}
.hearth-testi__who {
  display: flex; align-items: center; gap: 14px;
  border-top: 1px solid var(--line); padding-top: 24px;
}
.hearth-testi__avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background-size: cover; background-position: center;
  cursor: pointer; flex-shrink: 0;
}
.hearth-testi__name {
  font-family: var(--font-display); font-weight: 500; font-size: 15px; color: var(--ink);
}
.hearth-testi__role {
  font-family: var(--font-display); font-style: italic;
  font-size: 13.5px; color: var(--ink-3); margin-top: 2px;
}
.hearth-testi__meta {
  font-family: var(--font-display); font-style: italic;
  font-size: 13px; color: var(--ink-3); margin-top: 24px;
}
`;
