'use client';

// Surge single testimonial (edit) — featured dark review card. Serif quote mark,
// large quote, author avatar (photo or initials) + name + role/company.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { SurgeAddImageOverlay } from '../../components/SurgeAddImageOverlay';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { TESTI_STYLES } from './styles';

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

function initials(name: string): string {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'AK';
}

export default function PullQuoteWithMark({ sectionId }: PullQuoteWithMarkProps) {
  const { mode, blockContent, handleContentUpdate, isExcluded } = useServiceBlock<PullQuoteWithMarkContent>({ sectionId });
  const handleImageToolbar = useImageToolbar();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TESTI_STYLES }} />
      <section className="sg-testi" data-section-id={sectionId}>
        {(blockContent.eyebrow || (mode === 'edit' && !isExcluded('eyebrow'))) && (
          <div className="sg-testi__head">
            <SurgeEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              className="sg-testi__eyebrow"
              placeholder="In their words"
            />
          </div>
        )}
        <article className="sg-review">
          <div className="sg-review__mark" aria-hidden="true">&#8220;</div>
          <SurgeEditable
            as="p"
            mode={mode}
            sectionId={sectionId}
            elementKey="quote"
            value={blockContent.quote}
            onSave={(v) => handleContentUpdate('quote', v)}
            multiline
            className="sg-review__quote"
            placeholder="A short, specific testimonial — the number they moved, in the client's voice."
          />
          <div className="sg-review__by">
            <div
              className="sg-review__av"
              data-image-id={`${sectionId}-author-photo`}
              data-element-key="author_photo"
              style={{ backgroundImage: blockContent.author_photo ? `url(${blockContent.author_photo})` : undefined }}
              onMouseUp={(e) => {
                if (mode === 'edit') {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  handleImageToolbar(`${sectionId}-author-photo`, { x: rect.left + rect.width / 2, y: rect.top - 10 });
                }
              }}
            >
              {!blockContent.author_photo && initials(blockContent.author_name)}
              {mode === 'edit' && !blockContent.author_photo && <SurgeAddImageOverlay compact />}
            </div>
            <div>
              <SurgeEditable
                as="span"
                mode={mode}
                sectionId={sectionId}
                elementKey="author_name"
                value={blockContent.author_name}
                onSave={(v) => handleContentUpdate('author_name', v)}
                enterBehavior="save"
                className="sg-review__name"
                placeholder="Client name"
              />
              {(blockContent.author_role || blockContent.author_company || mode === 'edit') && (
                <div className="sg-review__role">
                  <SurgeEditable
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
                      {blockContent.author_role && blockContent.author_company && ', '}
                      <SurgeEditable
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
        {(blockContent.meta || (mode === 'edit' && !isExcluded('meta'))) && (
          <SurgeEditable
            as="div"
            mode={mode}
            sectionId={sectionId}
            elementKey="meta"
            value={blockContent.meta}
            onSave={(v) => handleContentUpdate('meta', v)}
            enterBehavior="save"
            className="sg-review__meta"
            placeholder="Optional meta line"
          />
        )}
      </section>
    </>
  );
}
