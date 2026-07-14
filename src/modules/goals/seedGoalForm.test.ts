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
    layout: {
      sections: ['hero-aaaa1111', 'services-bbbb2222', 'cta-cccc3333'],
      sectionLayouts: {
        'hero-aaaa1111': 'TerminalHero',
        'services-bbbb2222': 'Grid',
        'cta-cccc3333': 'ArcCTA',
      },
    },
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

    // goal-ref-cta phase 1: seedGoalForm no longer writes a RESOLVED snapshot
    // `cta` here — it keeps only the form `buttonConfig`. The GOAL_REF `cta`
    // (`{ role:'primary', dest:'GOAL_REF', formId }`) is written separately by
    // stampGoalRefCtas (run right after seedGoalForm in finalize.ts).
    expect(cta.elementMetadata.cta_text.cta).toBeUndefined();

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

describe('seedGoalForm — injects a rendered leadForm section (scale-05)', () => {
  const findLeadFormId = (fc: any): string | undefined =>
    (fc.layout.sections as string[]).find((id) => id.startsWith('leadForm-'));

  it('injects a leadForm section near the bottom (not directly under the hero), wired to the seeded form', () => {
    const fc = makeFinalContent();
    seedGoalForm(fc as any, m1Goal('book-call'));

    const formId = Object.keys((fc as any).forms)[0];
    const leadFormId = findLeadFormId(fc);
    expect(leadFormId).toBeTruthy();

    // House rule: multi-field form lives in a dedicated section near the BOTTOM,
    // NOT immediately under the hero. With no footer here, it appends at the end.
    const sections = fc.layout.sections as string[];
    expect(sections.indexOf(leadFormId!)).not.toBe(sections.indexOf('hero-aaaa1111') + 1);
    expect(sections.indexOf(leadFormId!)).toBe(sections.length - 1);

    // sectionLayouts + content entry with the shared layout + form_id.
    expect((fc.layout as any).sectionLayouts[leadFormId!]).toBe('SharedLeadForm');
    const sec = (fc.content as any)[leadFormId!];
    expect(sec.layout).toBe('SharedLeadForm');
    expect(sec.elements.form_id).toBe(formId);
    expect(typeof sec.elements.form_headline).toBe('string');
    expect(sec.elements.form_headline.length).toBeGreaterThan(0);
  });

  it('inserts the leadForm section immediately BEFORE the footer when one exists', () => {
    const fc = makeFinalContent();
    // Add a footer so the bottom-placement rule has an anchor.
    (fc.layout.sections as string[]).push('footer-dddd4444');
    (fc.layout.sectionLayouts as any)['footer-dddd4444'] = 'Footer';
    (fc.content as any)['footer-dddd4444'] = { id: 'footer-dddd4444', layout: 'Footer', elements: {} };

    seedGoalForm(fc as any, m1Goal('book-call'));

    const sections = fc.layout.sections as string[];
    const leadFormId = findLeadFormId(fc);
    expect(leadFormId).toBeTruthy();
    // Sits right before the footer — the last content section on the page.
    expect(sections.indexOf(leadFormId!)).toBe(sections.indexOf('footer-dddd4444') - 1);
    // And it is NOT directly under the hero.
    expect(sections.indexOf(leadFormId!)).not.toBe(sections.indexOf('hero-aaaa1111') + 1);
  });

  it('injects exactly one leadForm section and is idempotent on re-seed', () => {
    const fc = makeFinalContent();
    seedGoalForm(fc as any, m1Goal('book-call'));
    // Second call — a form already exists, so the whole seed (incl. injection) no-ops.
    seedGoalForm(fc as any, m1Goal('book-call'));
    const count = (fc.layout.sections as string[]).filter((id) => id.startsWith('leadForm-')).length;
    expect(count).toBe(1);
  });

  it('does not inject a leadForm section for non-M1 goals', () => {
    const fc = makeFinalContent();
    seedGoalForm(fc as any, { intent: 'book-call', mechanism: 'M2' } as any);
    expect(findLeadFormId(fc)).toBeUndefined();
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
