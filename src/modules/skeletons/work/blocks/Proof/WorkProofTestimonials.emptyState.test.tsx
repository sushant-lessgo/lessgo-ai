// Regression (QA-0719 B6): atelier testimonials rendered an empty band (heading over
// a zero-card grid) when no praise was collected — a silent-omission-in-disguise that
// violates the greyed-placeholder policy. Fix: the single-source core takes an
// `editable` prop and branches on empty quotes — PUBLISHED omits the whole band,
// the EDITOR shows a visible greyed placeholder card. Non-empty = unchanged in both.
//
// Renders the core through the PUBLISHED primitives via renderToStaticMarkup (the
// coreParity pattern) — the empty-state branch keys on `editable`, not on which
// primitive set is injected, so this exercises the real logic without a store.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makePublishedPrimitives } from '../publishedPrimitives';
import { WorkProofTestimonialsCore } from './WorkProofTestimonials.core';

const E = makePublishedPrimitives();
const sectionId = 'proof-empty';

function render(content: any, editable: boolean): string {
  return renderToStaticMarkup(
    React.createElement(WorkProofTestimonialsCore, { content, E, sectionId, editable }),
  );
}

describe('WorkProofTestimonials empty-state (B6)', () => {
  it('published + zero quotes → omits the band entirely (renders null)', () => {
    const html = render({ heading: 'What clients say', quotes: [] }, false);
    // Pre-fix: a <section class="wk-proof"> with the heading + empty grid renders.
    expect(html).toBe('');
    expect(html).not.toContain('wk-proof');
    expect(html).not.toContain('What clients say');
  });

  it('editor + zero quotes → renders a visible greyed placeholder card', () => {
    const html = render({ heading: 'What clients say', quotes: [] }, true);
    // Pre-fix: no placeholder marker existed (only the hover-only "+ Quote" affordance).
    expect(html).toContain('data-wk-proof-empty');
    expect(html).toContain('wk-proof__empty');
    expect(html).toContain('Add a client testimonial');
  });

  it('one quote → BOTH modes still render the card (unchanged)', () => {
    const content = { heading: 'What clients say', quotes: [{ id: 'q1', text: 'Loved every frame.', source: 'Client' }] };
    for (const editable of [true, false]) {
      const html = render(content, editable);
      expect(html, `editable=${editable}`).toContain('Loved every frame.');
      expect(html, `editable=${editable}`).toContain('wk-proof__card');
      expect(html, `editable=${editable}`).not.toContain('data-wk-proof-empty');
    }
  });
});
