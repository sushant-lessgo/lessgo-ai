// F1 regression — the Vestria lead-form EDIT twin must read the seeded form from
// the store's TOP-LEVEL FormsSlice (`state.forms`), NOT `store.content.forms`.
//
// Before the fix VestriaLeadForm.tsx read `store.content?.forms?.[formId]`, which
// is always undefined at runtime (the edit store keeps forms at `state.forms`),
// so the twin silently fell back to DEFAULT_VESTRIA_LEAD_FIELDS (7 generic fields
// + the generic "Send request" label) and ignored the seeded M1 form entirely.
//
// The block wrapper, primitives + core are mocked to a passthrough so the test
// isolates the store read → field selection → renderVestriaLeadField path.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import type { MVPForm } from '@/types/core/forms';

const FORM_ID = 'form-vestria-1';
const SECTION_ID = 'contact-abcd1234';

// A DISTINCT seeded form: 3 fields + a custom submit label. Distinct from the
// 7-field DEFAULT_VESTRIA_LEAD_FIELDS so the fix (uses seeded) is unmistakably
// separable from the bug (falls back to defaults).
const SEEDED_FORM: MVPForm = {
  id: FORM_ID,
  name: 'Book a survey',
  fields: [
    { id: 'name', type: 'text', label: 'Full name', placeholder: 'Your name', required: true },
    { id: 'email', type: 'email', label: 'Work email', placeholder: 'you@co.com', required: true },
    { id: 'brief', type: 'textarea', label: 'Brief', placeholder: '…', required: false },
  ],
  submitButtonText: 'Book a survey',
  successMessage: 'Booked.',
} as MVPForm;

vi.mock('../../hooks/useVestriaBlock', () => ({
  useVestriaBlock: () => ({
    blockContent: { form_id: FORM_ID, form_note: '' },
    handleContentUpdate: vi.fn(),
    handleCollectionUpdate: vi.fn(),
  }),
}));

vi.mock('../editPrimitives', () => ({
  VestriaEditProvider: ({ children }: any) => children,
  editPrimitives: {},
  useVestriaEditCtx: () => ({}),
}));

vi.mock('./VestriaLeadForm.core', () => ({
  VestriaLeadFormCore: ({ formNode }: any) => formNode,
}));

// forms live at the store TOP LEVEL — the whole point of F1.
vi.mock('@/hooks/useEditStoreLegacy', () => ({
  useEditStoreLegacy: () => ({ forms: { [FORM_ID]: SEEDED_FORM } }),
}));

import VestriaLeadForm from './VestriaLeadForm';

describe('Vestria lead-form edit twin — reads top-level FormsSlice (F1)', () => {
  it('renders the seeded form fields, not the 7-field default fallback', () => {
    const html = renderToStaticMarkup(<VestriaLeadForm sectionId={SECTION_ID} />);
    const fieldCount = (html.match(/class="vs-fld"/g) || []).length;
    expect(fieldCount).toBe(SEEDED_FORM.fields.length); // 3, not 7
    // Seeded submit label, not the generic VESTRIA_LEAD_SUBMIT_TEXT ("Send request").
    expect(html).toContain('Book a survey');
    expect(html).not.toContain('Send request');
  });
});
