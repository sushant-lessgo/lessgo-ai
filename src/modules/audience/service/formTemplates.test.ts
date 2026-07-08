// src/modules/audience/service/formTemplates.test.ts
import { describe, it, expect } from 'vitest';
import {
  getFormTemplateForIntent,
  getServiceFormTemplate,
  SERVICE_FORM_TEMPLATE_GOALS,
} from './formTemplates';
import type { GoalIntent } from '@/modules/goals/vocabulary';
import type { MVPFormFieldType } from '@/types/core/forms';

const FIELD_TYPES: MVPFormFieldType[] = ['text', 'email', 'tel', 'textarea', 'select'];

// Every M1 intent that must ship a dedicated template (scale-05 phase 4) +
// subscribe-newsletter (design call #6).
const M1_INTENTS: GoalIntent[] = [
  'enquiry',
  'request-quote',
  'book-call',
  'book-me',
  'enroll',
  'apply',
  'lead-magnet',
  'waitlist',
  'request-demo',
  'rsvp',
  'subscribe-newsletter',
];

describe('formTemplates — per-intent templates', () => {
  it.each(M1_INTENTS)('has a valid template for %s', (intent) => {
    const tpl = getFormTemplateForIntent(intent);
    expect(tpl).toBeTruthy();
    expect(tpl.name).toBeTruthy();
    expect(tpl.submitButtonText).toBeTruthy();
    expect(tpl.successMessage).toBeTruthy();
    expect(tpl.fields.length).toBeGreaterThan(0);
    // At least one email field for lead capture.
    expect(tpl.fields.some((f) => f.type === 'email')).toBe(true);
    // Field types all within the MVP set.
    for (const f of tpl.fields) {
      expect(FIELD_TYPES).toContain(f.type);
      expect(f.id).toBeTruthy();
      expect(f.label).toBeTruthy();
    }
    // select fields carry options.
    for (const f of tpl.fields) {
      if (f.type === 'select') expect((f.options ?? []).length).toBeGreaterThan(0);
    }
  });

  it('subscribe-newsletter: email required, name optional', () => {
    const tpl = getFormTemplateForIntent('subscribe-newsletter');
    const email = tpl.fields.find((f) => f.type === 'email');
    expect(email?.required).toBe(true);
    const name = tpl.fields.find((f) => f.id === 'name');
    expect(name?.required).toBe(false);
  });

  it('rsvp: has an attendee-count select', () => {
    const tpl = getFormTemplateForIntent('rsvp');
    const attendees = tpl.fields.find((f) => f.id === 'attendees');
    expect(attendees?.type).toBe('select');
    expect((attendees?.options ?? []).length).toBeGreaterThan(0);
  });

  it('book-me: has event date + event type fields', () => {
    const tpl = getFormTemplateForIntent('book-me');
    expect(tpl.fields.find((f) => f.id === 'event_date')).toBeTruthy();
    const type = tpl.fields.find((f) => f.id === 'event_type');
    expect(type?.type).toBe('select');
  });

  it('falls back to book-call for an intent without a template', () => {
    const tpl = getFormTemplateForIntent('order-via-platform');
    expect(tpl.name).toBe('Book a call');
  });
});

describe('formTemplates — legacy wrapper', () => {
  it('SERVICE_FORM_TEMPLATE_GOALS unchanged (FormBuilder picker)', () => {
    expect(SERVICE_FORM_TEMPLATE_GOALS).toEqual(['book-call', 'request-quote', 'lead-magnet']);
  });

  it('getServiceFormTemplate maps legacy ServiceGoal → intent template', () => {
    expect(getServiceFormTemplate('book-call').name).toBe('Book a call');
    expect(getServiceFormTemplate('request-quote').name).toBe('Request a quote');
    expect(getServiceFormTemplate('lead-magnet').name).toBe('Get the resource');
    // download-portfolio → lead-magnet (via SERVICE_GOAL_TO_INTENT).
    expect(getServiceFormTemplate('download-portfolio').name).toBe('Get the resource');
    expect(getServiceFormTemplate('subscribe-newsletter').name).toBe('Subscribe');
    // null → book-call fallback.
    expect(getServiceFormTemplate(null).name).toBe('Book a call');
  });
});
