'use client';

// src/modules/templates/lex/blocks/Testimonials/LetterOfReference.tsx
// Lex testimonial: a SINGLE letter-of-reference (PO correction 3 — the shared
// schema is flat, one quote + one author; NOT a card grid). Edit mode.
// Reference: Lex HTML .letter (789-834), markup (1810-1823).
//
// A3 — the monogram signature (.auth) is DERIVED from author_name (initials),
// not a fabricated field. Optional author_photo renders as a small framed avatar
// with the image toolbar so the field stays usable.

import React from 'react';
import { useLexBlock } from '../../hooks/useLexBlock';
import { LexEditable } from '../../components/LexEditable';
import { LexAddImageOverlay } from '../../components/LexAddImageOverlay';
import { useImageToolbar } from '@/hooks/useImageToolbar';

interface LetterOfReferenceContent {
  eyebrow: string;
  quote: string;
  author_name: string;
  author_role: string;
  author_company: string;
  author_photo: string;
  meta: string;
}

interface LetterOfReferenceProps {
  sectionId: string;
}

function initialsOf(name: string): string {
  const parts = (name || '').trim().split(/[\s.-]+/).filter(Boolean);
  if (!parts.length) return '—';
  return parts.map((p) => p.charAt(0).toUpperCase()).join('.') + '.';
}

export default function LetterOfReference({ sectionId }: LetterOfReferenceProps) {
  const { mode, blockContent, handleContentUpdate } = useLexBlock<LetterOfReferenceContent>({
    sectionId,
  });
  const handleImageToolbar = useImageToolbar();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <section className="lex-testi" data-section-id={sectionId}>
        {(blockContent.eyebrow || mode === 'edit') && (
          <div className="lex-testi__eyebrow">
            <LexEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey="eyebrow"
              value={blockContent.eyebrow}
              onSave={(v) => handleContentUpdate('eyebrow', v)}
              enterBehavior="save"
              placeholder="Letters of reference"
            />
          </div>
        )}

        <article className="lex-letter">
          <span className="lex-letter__ix">§</span>
          <div>
            <LexEditable
              as="div"
              mode={mode}
              sectionId={sectionId}
              elementKey="quote"
              value={blockContent.quote}
              onSave={(v) => handleContentUpdate('quote', v)}
              multiline
              className="lex-letter__quote"
              placeholder="A short letter of reference, in the client's own words, with one <em>emphasised</em> phrase."
            />
            <div className="lex-letter__signed">
              <div className="lex-letter__who">
                {(blockContent.author_photo || mode === 'edit') && (
                  <div
                    className="lex-letter__avatar"
                    data-image-id={`${sectionId}-author-photo`}
                    data-element-key="author_photo"
                    style={{
                      position: 'relative',
                      backgroundImage: blockContent.author_photo
                        ? `url(${blockContent.author_photo})`
                        : 'linear-gradient(135deg, var(--trust-soft), var(--paper-2))',
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
                    {mode === 'edit' && !blockContent.author_photo && <LexAddImageOverlay compact />}
                  </div>
                )}
                <div className="lex-letter__who-text">
                  <LexEditable
                    as="div"
                    mode={mode}
                    sectionId={sectionId}
                    elementKey="author_name"
                    value={blockContent.author_name}
                    onSave={(v) => handleContentUpdate('author_name', v)}
                    enterBehavior="save"
                    className="lex-letter__name"
                    placeholder="Client name"
                  />
                  <span className="lex-letter__role">
                    <LexEditable
                      as="span"
                      mode={mode}
                      sectionId={sectionId}
                      elementKey="author_role"
                      value={blockContent.author_role}
                      onSave={(v) => handleContentUpdate('author_role', v)}
                      enterBehavior="save"
                      placeholder="Relationship"
                    />
                    {(blockContent.author_company || mode === 'edit') && (
                      <>
                        {blockContent.author_role && blockContent.author_company && ' · '}
                        <LexEditable
                          as="span"
                          mode={mode}
                          sectionId={sectionId}
                          elementKey="author_company"
                          value={blockContent.author_company}
                          onSave={(v) => handleContentUpdate('author_company', v)}
                          enterBehavior="save"
                          placeholder="Since MCMLXXVIII"
                        />
                      </>
                    )}
                  </span>
                </div>
              </div>
              <span className="lex-letter__auth" aria-hidden="true">
                {initialsOf(blockContent.author_name)}
              </span>
            </div>
          </div>
        </article>

        {(blockContent.meta || mode === 'edit') && (
          <LexEditable
            as="div"
            mode={mode}
            sectionId={sectionId}
            elementKey="meta"
            value={blockContent.meta}
            onSave={(v) => handleContentUpdate('meta', v)}
            enterBehavior="save"
            className="lex-testi__meta"
            placeholder="Reproduced with permission · further references on request"
          />
        )}
      </section>
    </>
  );
}

const STYLES = `
.lex-testi {
  max-width: var(--max-w); margin: 0 auto;
  padding: var(--sec-pad-y) var(--sec-pad-x);
}
.lex-testi__eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-3); font-weight: 500;
  border-top: 1px solid var(--ink); padding-top: 28px; margin-bottom: 36px;
}
.lex-letter {
  border-top: 1px solid var(--ink); border-bottom: 1px solid var(--rule);
  padding: 40px 0; display: grid; grid-template-columns: 80px 1fr; gap: 28px;
}
@media (max-width: 720px) { .lex-letter { grid-template-columns: 1fr; gap: 16px; } }
.lex-letter__ix {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 24px; color: var(--trust); line-height: 1; padding-top: 4px;
}
.lex-letter__quote {
  margin: 0; font-family: var(--font-display); font-weight: 400;
  font-size: 26px; line-height: 1.4; letter-spacing: -0.005em; color: var(--ink);
  text-wrap: pretty;
}
.lex-letter__quote em { font-style: italic; color: var(--trust); }
.lex-letter__signed {
  margin-top: 24px; display: grid; grid-template-columns: 1fr auto; gap: 24px;
  align-items: end; border-top: 1px solid var(--rule); padding-top: 18px;
}
.lex-letter__who { display: flex; align-items: center; gap: 14px; }
.lex-letter__avatar {
  width: 44px; height: 44px; border-radius: 2px; flex-shrink: 0;
  background-size: cover; background-position: center;
  border: 1px solid var(--rule-strong); cursor: pointer;
}
.lex-letter__who-text { display: flex; flex-direction: column; gap: 4px; }
.lex-letter__name { font-family: var(--font-display); font-weight: 500; font-size: 16px; color: var(--ink); }
.lex-letter__role {
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--ink-3);
}
.lex-letter__auth {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 32px; color: var(--ink-2); line-height: 1;
}
.lex-testi__meta {
  font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 13px; color: var(--ink-3); margin-top: 24px;
}
`;
