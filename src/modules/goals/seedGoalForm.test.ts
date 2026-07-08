// src/modules/goals/seedGoalForm.test.ts
import { describe, it, expect } from 'vitest';
import { seedGoalForm } from './seedGoalForm';
import type { Brief } from '@/types/brief';
import type { MVPFormFieldType } from '@/types/core/forms';

type BriefGoal = NonNullable<Brief['goal']>;

const FIELD_TYPES: MVPFormFieldType[] = ['text', 'email', 'tel', 'textarea', 'select'];

/** A minimal finalContent with a hero + cta section (uuid-suffixed ids). */
function makeFinalContent() {
  return {
    layout: { sections: ['hero-aaaa1111', 'services-bbbb2222', 'cta-cccc3333'] },
    content: {
      'hero-aaaa1111': {
        id: 'hero-aaaa1111',
        layout: 'TerminalHero',
        elements: { headline: 'Hi', cta_text: 'Get started' },
      },
      'services-bbbb2222': {
        id: 'services-bbbb2222',
        layout: 'Grid',
        elements: { headline: 'What we do' },
      },
      'cta-cccc3333': {
        id: 'cta-cccc3333',
        layout: 'ArcCTA',
        elements: { headline: 'Ready?', cta_text: 'Book a call' },
      },
    },
  };
}

function m1Goal(intent: BriefGoal['intent']): BriefGoal {
  return { intent, mechanism: 'M1' };
}

describe('seedGoalForm — M1 seeds a placed + wired form', () => {
  it('creates a form in finalContent.forms and wires the CTA section', () => {
    const fc = makeFinalContent();
    seedGoalForm(fc as any, m1Goal('book-call'));

    // Form created.
    const forms = (fc as any).forms;
    expect(forms).toBeTruthy();
    const formIds = Object.keys(forms);
    expect(formIds).toHaveLength(1);
    const formId = formIds[0];
    expect(formId).toMatch(/^form-\d+$/);

    const form = forms[formId];
    expect(form.id).toBe(formId);
    expect(Array.isArray(form.fields)).toBe(true);
    expect(form.fields.length).toBeGreaterThan(0);
    // Dashboard integration so submissions land in the dashboard.
    expect(form.integrations?.some((i: any) => i.type === 'dashboard')).toBe(true);

    // CTA section wired — placement/marker + buttonConfig + cta match the
    // manual ButtonConfigurationModal path.
    const cta = fc.content['cta-cccc3333'];
    expect(cta.elements.cta_embed).toBe(`form:${formId}`);
    // Button label preserved (not clobbered).
    expect(cta.elements.cta_text).toBe('Book a call');

    const bc = cta.elementMetadata.cta_text.buttonConfig;
    expect(bc).toMatchObject({
      type: 'form',
      ctaType: 'primary',
      formId,
      behavior: 'scrollTo',
    });

    const newCta = cta.elementMetadata.cta_text.cta;
    expect(newCta).toEqual({
      role: 'primary',
      dest: { kind: 'section', anchor: 'form-section' },
      formId,
    });

    // Section-level ctaConfig mirrors the modal write.
    expect(cta.cta).toMatchObject({
      type: 'form',
      formId,
      behavior: 'scrollTo',
      variant: 'primary',
      size: 'medium',
    });
  });

  it('leaves the hero cta_text untouched (hero stays GOAL_REF)', () => {
    const fc = makeFinalContent();
    seedGoalForm(fc as any, m1Goal('book-call'));
    const hero = fc.content['hero-aaaa1111'];
    expect(hero.elements.cta_text).toBe('Get started');
    expect(hero.elements.cta_embed).toBeUndefined();
    expect(hero.elementMetadata).toBeUndefined();
  });

  it('all seeded form field types are within MVPFormFieldType', () => {
    const fc = makeFinalContent();
    seedGoalForm(fc as any, m1Goal('request-quote'));
    const form = Object.values((fc as any).forms)[0] as any;
    for (const f of form.fields) {
      expect(FIELD_TYPES).toContain(f.type);
    }
  });
});

describe('seedGoalForm — subscribe-newsletter (email capture)', () => {
  it('seeds an email-capture form even if the incoming mechanism differs', () => {
    const fc = makeFinalContent();
    // Belt-and-suspenders: intent forces M1 even if mechanism is stale.
    seedGoalForm(fc as any, { intent: 'subscribe-newsletter', mechanism: 'M4' } as any);
    const forms = (fc as any).forms;
    expect(Object.keys(forms)).toHaveLength(1);
    const form = Object.values(forms)[0] as any;
    const email = form.fields.find((f: any) => f.type === 'email');
    expect(email).toBeTruthy();
    expect(email.required).toBe(true);
    const name = form.fields.find((f: any) => f.id === 'name');
    expect(name?.required).toBe(false);
  });
});

describe('seedGoalForm — no-op cases', () => {
  it.each(['M2', 'M3', 'M4', 'M5'] as const)('does nothing for %s', (mech) => {
    const fc = makeFinalContent();
    seedGoalForm(fc as any, { intent: 'book-call', mechanism: mech } as any);
    expect((fc as any).forms).toBeUndefined();
    expect(fc.content['cta-cccc3333'].elements.cta_embed).toBeUndefined();
    expect(fc.content['cta-cccc3333'].elementMetadata).toBeUndefined();
  });

  it('is idempotent — no double-seed when a form already exists', () => {
    const fc = makeFinalContent();
    (fc as any).forms = { 'form-existing': { id: 'form-existing', fields: [] } };
    seedGoalForm(fc as any, m1Goal('book-call'));
    expect(Object.keys((fc as any).forms)).toEqual(['form-existing']);
    expect(fc.content['cta-cccc3333'].elements.cta_embed).toBeUndefined();
  });

  it('tolerates null/empty inputs', () => {
    expect(() => seedGoalForm(null, m1Goal('book-call'))).not.toThrow();
    expect(() => seedGoalForm({}, null)).not.toThrow();
    expect(() => seedGoalForm({ content: {} }, m1Goal('book-call'))).not.toThrow();
  });
});

describe('seedGoalForm — target selection', () => {
  it('falls back to the hero section when no cta/contact section exists', () => {
    const fc = {
      content: {
        'hero-aaaa1111': {
          id: 'hero-aaaa1111',
          elements: { cta_text: 'Start' },
        },
      },
    };
    seedGoalForm(fc as any, m1Goal('waitlist'));
    const formId = Object.keys((fc as any).forms)[0];
    expect(fc.content['hero-aaaa1111'].elements.cta_embed).toBe(`form:${formId}`);
  });
});
