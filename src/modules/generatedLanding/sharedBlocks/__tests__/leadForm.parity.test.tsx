// scale-05 phase 5 — shared LeadForm block: dual-renderer parity + firewall-split
// registry resolution + published <form data-lessgo-form> contract.
//
// The edit twin reads useEditStore → we mock it (tests aren't in the
// published path, so importing the edit twin here is fine).

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import type { MVPForm } from '@/types/core/forms';

const FORM_ID = 'form-123';
const LEAD_SECTION_ID = 'leadForm-abcd1234';

const SEEDED_FORM: MVPForm = {
  id: FORM_ID,
  name: 'Book a call',
  fields: [
    { id: 'name', type: 'text', label: 'Full name', placeholder: 'Your name', required: true },
    { id: 'email', type: 'email', label: 'Work email', placeholder: 'you@co.com', required: true },
    { id: 'topic', type: 'select', label: 'Topic', placeholder: 'Select…', required: false, options: ['A', 'B'] },
    { id: 'notes', type: 'textarea', label: 'Notes', placeholder: '…', required: false },
  ],
  submitButtonText: 'Book a call',
  successMessage: 'Booked — see you soon.',
} as MVPForm;

// Mock the store BEFORE importing the edit twin. NOTE: forms live at the
// store's TOP LEVEL (`state.forms`, the FormsSlice) — NOT under `content` —
// exactly as the real edit store (formActions.ts writes `state.forms[id]`).
// A previous version of this mock nested forms under `content.forms`, which
// masked F1: the edit twin read `store.content?.forms` (always undefined at
// runtime) yet the mis-seeded mock let the test pass. Keep forms top-level.
vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: (selector?: (s: any) => any) => {
    const state = {
      content: {
        [LEAD_SECTION_ID]: {
          id: LEAD_SECTION_ID,
          layout: 'SharedLeadForm',
          elements: { form_id: FORM_ID, form_headline: 'Book a call' },
        },
      },
      forms: { [FORM_ID]: SEEDED_FORM },
      updateElementContent: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

import LeadForm from '../LeadForm/LeadForm';
import LeadFormPublished from '../LeadForm/LeadForm.published';
import { resolveSharedBlock } from '../registry';
import { resolveSharedBlockPublished } from '../registry.published';
import { getComponent as getEditComponent } from '../../componentRegistry';
import { getComponent as getPublishedComponent } from '../../componentRegistry.published';

function publishedMarkup() {
  return renderToStaticMarkup(
    <LeadFormPublished
      sectionId={LEAD_SECTION_ID}
      content={{ forms: { [FORM_ID]: SEEDED_FORM } }}
      publishedPageId="page-1"
      pageOwnerId="owner-1"
      form_id={FORM_ID}
      form_headline="Book a call"
    />
  );
}

describe('shared LeadForm — firewall-split registry resolution', () => {
  it('resolves the edit twin through the edit registry (lowercase key)', () => {
    expect(resolveSharedBlock('leadform')).toBe(LeadForm);
    // Casing tolerated by the resolver (defensive).
    expect(resolveSharedBlock('leadForm')).toBe(LeadForm);
  });

  it('resolves the published twin through the published registry', () => {
    expect(resolveSharedBlockPublished('leadform')).toBe(LeadFormPublished);
  });

  it('componentRegistry (edit) dispatches a real leadForm-<uuid> id BEFORE template dispatch', () => {
    const C = getEditComponent(LEAD_SECTION_ID, 'SharedLeadForm', 'service', 'hearth');
    expect(C).toBe(LeadForm);
  });

  it('componentRegistry.published dispatches leadform to the published twin', () => {
    // Published renderer extracts the type first, then calls getComponent(type,…).
    const C = getPublishedComponent('leadform', 'SharedLeadForm', 'service', 'hearth');
    expect(C).toBe(LeadFormPublished);
  });
});

describe('shared LeadForm — published <form> contract (form.v1.js)', () => {
  it('emits data-lessgo-form with the exact dataset keys form.v1.js reads', () => {
    const html = publishedMarkup();
    expect(html).toContain('data-lessgo-form');
    expect(html).toContain(`data-form-id="${FORM_ID}"`);
    expect(html).toContain('data-page-id="page-1"');
    expect(html).toContain('data-owner-id="owner-1"');
    expect(html).toContain('data-success-message="Booked — see you soon."');
  });

  it('renders every seeded field (name=field.id = submission key) + submit button', () => {
    const html = publishedMarkup();
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="topic"');
    expect(html).toContain('name="notes"');
    expect(html).toContain('type="submit"');
    expect(html).toContain('Book a call');
  });

  it('carries the #form-section anchor (hero GOAL_REF + CTA scrollTo target)', () => {
    expect(publishedMarkup()).toContain('id="form-section"');
  });
});

describe('shared LeadForm — edit twin reads the top-level FormsSlice (F1 regression)', () => {
  it('renders one field per seeded form field against a top-level-seeded store', () => {
    const edit = renderToStaticMarkup(<LeadForm sectionId={LEAD_SECTION_ID} />);
    // Each MVP field renders exactly one `<div class="lg-fld">` wrapper.
    const fieldCount = (edit.match(/class="lg-fld"/g) || []).length;
    expect(fieldCount).toBe(SEEDED_FORM.fields.length);
    // …and NOT the empty-form fallback the bug produced (0 fields + "Submit").
    expect(fieldCount).toBeGreaterThan(0);
    // Uses the seeded submit label, not the fallback — the "Submit" tell of F1.
    expect(edit).toContain('Book a call');
    expect(edit).not.toContain('>Submit<');
  });
});

describe('shared LeadForm — dual-renderer parity', () => {
  it('edit + published emit the same field DOM + #form-section anchor', () => {
    const pub = publishedMarkup();
    const edit = renderToStaticMarkup(<LeadForm sectionId={LEAD_SECTION_ID} />);

    for (const marker of [
      'id="form-section"',
      'class="lg-lead lg-lead-pad"',
      'class="lg-lead__card"',
      'name="name"',
      'name="email"',
      'name="topic"',
      'name="notes"',
      'lg-lead__btn',
    ]) {
      expect(pub, `published missing ${marker}`).toContain(marker);
      expect(edit, `edit missing ${marker}`).toContain(marker);
    }

    // Published has the real <form> attrs; edit is an inert preview (no submit
    // wiring). This asymmetry is intentional (mirrors Vestria).
    expect(pub).toContain('data-lessgo-form');
    expect(edit).not.toContain('data-lessgo-form');
  });
});
