'use client';

// Surge multi-review testimonials grid (edit). Collection of 1-3 reviews; first
// card is featured (dark). 1 item → single featured card (works for one), 2-3 → grid.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { SurgeAddImageOverlay } from '../../components/SurgeAddImageOverlay';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { REVIEWGRID_STYLES } from './ReviewGrid.styles';

interface Review {
  id: string;
  quote: string;
  author_name: string;
  author_role: string;
  author_company: string;
  author_photo: string;
}

interface ReviewGridContent {
  eyebrow: string;
  headline: string;
  reviews: Review[];
}

interface ReviewGridProps {
  sectionId: string;
}

function initials(name: string): string {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '—';
}

export default function ReviewGrid({ sectionId }: ReviewGridProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate, isExcluded } =
    useServiceBlock<ReviewGridContent>({ sectionId });
  const handleImageToolbar = useImageToolbar();

  const reviews = blockContent.reviews || [];

  const updateField = (id: string, key: keyof Review, value: string) => {
    handleCollectionUpdate(
      'reviews',
      reviews.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  const addReview = () => {
    if (reviews.length >= 3) return;
    handleCollectionUpdate('reviews', [
      ...reviews,
      { id: `t${Date.now()}`, quote: '', author_name: '', author_role: '', author_company: '', author_photo: '' },
    ]);
  };

  const removeReview = (id: string) => {
    if (reviews.length <= 1) return;
    handleCollectionUpdate('reviews', reviews.filter((r) => r.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: REVIEWGRID_STYLES }} />
      <section className="sg-rev-section" data-section-id={sectionId}>
        {(blockContent.eyebrow || blockContent.headline || mode === 'edit') && (
          <div className="sg-rev-head">
            {(blockContent.eyebrow || (mode === 'edit' && !isExcluded('eyebrow'))) && (
              <SurgeEditable
                as="div"
                mode={mode}
                sectionId={sectionId}
                elementKey="eyebrow"
                value={blockContent.eyebrow}
                onSave={(v) => handleContentUpdate('eyebrow', v)}
                enterBehavior="save"
                className="sg-rev-eyebrow"
                placeholder="In their words"
              />
            )}
            {(blockContent.headline || (mode === 'edit' && !isExcluded('headline'))) && (
              <SurgeEditable
                as="h2"
                mode={mode}
                sectionId={sectionId}
                elementKey="headline"
                value={blockContent.headline}
                onSave={(v) => handleContentUpdate('headline', v)}
                enterBehavior="save"
                className="sg-rev-title"
                placeholder="What clients <em>actually say</em>"
              />
            )}
          </div>
        )}

        <div className="sg-reviews">
          {reviews.map((r, idx) => (
            <article key={r.id} className={`sg-rev${idx === 0 ? ' sg-rev--feat' : ''}`}>
              <div className="sg-rev__mark" aria-hidden="true">&#8220;</div>
              <SurgeEditable
                as="p"
                mode={mode}
                sectionId={sectionId}
                elementKey={`reviews_quote_${r.id}`}
                value={r.quote}
                onSave={(v) => updateField(r.id, 'quote', v)}
                multiline
                className="sg-rev__quote"
                placeholder="A short, specific testimonial — the number they moved, in the client's voice."
              />
              <div className="sg-rev__by">
                <div
                  className="sg-rev__av"
                  data-image-id={`${sectionId}-${r.id}-photo`}
                  data-element-key={`images.${r.id}.src`}
                  style={{ backgroundImage: r.author_photo ? `url(${r.author_photo})` : undefined }}
                  onMouseUp={(e) => {
                    if (mode === 'edit') {
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      handleImageToolbar(`${sectionId}-${r.id}-photo`, { x: rect.left + rect.width / 2, y: rect.top - 10 });
                    }
                  }}
                >
                  {!r.author_photo && initials(r.author_name)}
                  {mode === 'edit' && !r.author_photo && <SurgeAddImageOverlay compact />}
                </div>
                <div>
                  <SurgeEditable
                    as="span"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey={`reviews_author_name_${r.id}`}
                    value={r.author_name}
                    onSave={(v) => updateField(r.id, 'author_name', v)}
                    enterBehavior="save"
                    className="sg-rev__name"
                    placeholder="Client name"
                  />
                  <div className="sg-rev__role">
                    <SurgeEditable
                      as="span"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey={`reviews_author_role_${r.id}`}
                      value={r.author_role}
                      onSave={(v) => updateField(r.id, 'author_role', v)}
                      enterBehavior="save"
                      placeholder="Role"
                    />
                    {(r.author_role && r.author_company) ? ', ' : ''}
                    <SurgeEditable
                      as="span"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey={`reviews_author_company_${r.id}`}
                      value={r.author_company}
                      onSave={(v) => updateField(r.id, 'author_company', v)}
                      enterBehavior="save"
                      placeholder="Company"
                    />
                  </div>
                </div>
              </div>
              {mode === 'edit' && reviews.length > 1 && (
                <button type="button" className="sg-rev__remove" onClick={() => removeReview(r.id)} aria-label="Remove testimonial">×</button>
              )}
            </article>
          ))}
          {mode === 'edit' && reviews.length < 3 && (
            <button type="button" className="sg-rev sg-rev--add" onClick={addReview}>+ Add testimonial</button>
          )}
        </div>
      </section>
    </>
  );
}
