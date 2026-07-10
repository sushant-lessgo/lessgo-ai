// src/modules/goals/goalToDestination.test.ts
// scale-04 (phase 2) — per-mechanism coverage for goalToDestination.

import { describe, it, expect } from 'vitest';
import { goalToDestination } from './goalToDestination';
import { legacyGoalToBriefGoal } from '@/modules/brief/bridge';
import type { Brief } from '@/types/brief';

type Goal = NonNullable<Brief['goal']>;
const goal = (g: Goal): Goal => g;

describe('goalToDestination', () => {
  describe('undefined / unresolvable', () => {
    it('returns undefined for no goal', () => {
      expect(goalToDestination(undefined, { forms: {} })).toBeUndefined();
      expect(goalToDestination(null, { forms: {} })).toBeUndefined();
    });
  });

  describe('M1 — on-site form', () => {
    it('returns the #form-section anchor + first form id', () => {
      const result = goalToDestination(
        goal({ intent: 'enquiry', mechanism: 'M1' }),
        { forms: { 'form-abc': {}, 'form-def': {} } },
      );
      expect(result).toEqual({
        dest: { kind: 'section', anchor: 'form-section' },
        formId: 'form-abc',
      });
    });

    it('returns the anchor with undefined formId when no forms exist', () => {
      const result = goalToDestination(
        goal({ intent: 'apply', mechanism: 'M1' }),
        { forms: {} },
      );
      expect(result).toEqual({
        dest: { kind: 'section', anchor: 'form-section' },
        formId: undefined,
      });
    });

    // goal-ref-cta phase 3 (F23) — multipage M1 cross-page resolution.
    it('stays a same-page anchor when the form is on the CURRENT page', () => {
      const result = goalToDestination(
        goal({ intent: 'book-call', mechanism: 'M1' }),
        { forms: { 'form-abc': {} }, currentPagePath: '/contact', formPagePath: '/contact' },
      );
      expect(result).toEqual({
        dest: { kind: 'section', anchor: 'form-section' },
        formId: 'form-abc',
      });
    });

    it('emits a cross-page `page` dest (bare pathSlug, NO formId key) when the form is on another page', () => {
      const result = goalToDestination(
        goal({ intent: 'book-call', mechanism: 'M1' }),
        { forms: { 'form-abc': {} }, currentPagePath: '/', formPagePath: '/contact' },
      );
      // Bare host-relative pathSlug — middleware/KV serve it (Spec deviation): NOT /p/<slug>/contact.
      expect(result).toEqual({ dest: { kind: 'page', pathSlug: '/contact' } });
      // NO formId key — a page dest is navigation, not an on-site form connection,
      // so normalizeCtas down-converts it to {type:'page'}, never {type:'form'}.
      expect(result).not.toHaveProperty('formId');
    });

    it('falls back to the same-page anchor when only currentPagePath is known (no form page)', () => {
      const result = goalToDestination(
        goal({ intent: 'book-call', mechanism: 'M1' }),
        { forms: { 'form-abc': {} }, currentPagePath: '/' },
      );
      expect(result).toEqual({
        dest: { kind: 'section', anchor: 'form-section' },
        formId: 'form-abc',
      });
    });
  });

  describe('M2 — direct channel', () => {
    it('parses a wa.me URL into a whatsapp Destination (no formId)', () => {
      const result = goalToDestination(
        goal({ intent: 'enquiry', mechanism: 'M2', destination: 'https://wa.me/15551234' }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'whatsapp', number: '15551234' } });
      expect(result).not.toHaveProperty('formId');
    });

    it('parses tel: into a call Destination', () => {
      const result = goalToDestination(
        goal({ intent: 'book-call', mechanism: 'M2', destination: 'tel:+15550000' }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'call', number: '+15550000' } });
    });

    it('parses mailto: into an email Destination', () => {
      const result = goalToDestination(
        goal({ intent: 'enquiry', mechanism: 'M2', destination: 'mailto:hi@x.com' }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'email', addr: 'hi@x.com' } });
    });

    it('returns null (param-less degradation, D-C) when destination is missing', () => {
      // goal-ref-cta D-C: a goal that EXISTS but lacks its required param → null
      // (inert `#` no-op at normalizeCtas), distinct from undefined (untouched).
      expect(
        goalToDestination(goal({ intent: 'enquiry', mechanism: 'M2' }), { forms: {} }),
      ).toBeNull();
    });

    // scale-05 phase 6: enrichment — a plain wa.me destination (no inline
    // ?text=) + param.message ⇒ attach the message (covers Briefs composed by
    // other paths, e.g. classify).
    it('attaches param.message to a plain wa.me destination without inline text', () => {
      const result = goalToDestination(
        goal({
          intent: 'enquiry',
          mechanism: 'M2',
          destination: 'https://wa.me/15551234',
          param: { phone: '15551234', message: 'Hi Acme, interested in X' },
        }),
        { forms: {} },
      );
      expect(result).toEqual({
        dest: { kind: 'whatsapp', number: '15551234', msg: 'Hi Acme, interested in X' },
      });
    });

    it('does NOT override an inline ?text= msg with param.message', () => {
      const result = goalToDestination(
        goal({
          intent: 'enquiry',
          mechanism: 'M2',
          destination: 'https://wa.me/15551234?text=Inline%20wins',
          param: { phone: '15551234', message: 'param loses' },
        }),
        { forms: {} },
      );
      expect(result).toEqual({
        dest: { kind: 'whatsapp', number: '15551234', msg: 'Inline wins' },
      });
    });

    it('leaves a plain wa.me destination untouched when no param.message present', () => {
      const result = goalToDestination(
        goal({ intent: 'enquiry', mechanism: 'M2', destination: 'https://wa.me/15551234' }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'whatsapp', number: '15551234' } });
    });
  });

  describe('M3 — redirect out', () => {
    it('returns an external Destination with the url verbatim', () => {
      const result = goalToDestination(
        goal({ intent: 'buy-via-link', mechanism: 'M3', destination: 'https://amazon.com/dp/x' }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'external', url: 'https://amazon.com/dp/x' } });
    });

    it('takes the first entry of an array destination', () => {
      const result = goalToDestination(
        goal({ intent: 'download-app', mechanism: 'M3', destination: ['https://apps.apple.com/a', 'https://play.google.com/b'] }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'external', url: 'https://apps.apple.com/a' } });
    });

    it('returns null (param-less degradation, D-C) when destination is missing', () => {
      expect(
        goalToDestination(goal({ intent: 'signup-free', mechanism: 'M3' }), { forms: {} }),
      ).toBeNull();
    });
  });

  describe('M4 — subscribe / follow', () => {
    it('returns a social Destination with inferred platform', () => {
      const result = goalToDestination(
        goal({ intent: 'follow-social', mechanism: 'M4', destination: 'https://instagram.com/acme' }),
        { forms: {} },
      );
      expect(result).toEqual({
        dest: { kind: 'social', platform: 'instagram', url: 'https://instagram.com/acme' },
      });
    });

    it('falls back to external for an unrecognized host', () => {
      const result = goalToDestination(
        goal({ intent: 'subscribe-newsletter', mechanism: 'M4', destination: 'https://newsletter.example.com' }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'external', url: 'https://newsletter.example.com' } });
    });

    it('returns null (param-less degradation, D-C) when the links param is missing', () => {
      expect(
        goalToDestination(goal({ intent: 'follow-social', mechanism: 'M4' }), { forms: {} }),
      ).toBeNull();
    });
  });

  describe('M5 — scroll / anchor', () => {
    it('strips a leading # into a section anchor', () => {
      const result = goalToDestination(
        goal({ intent: 'rsvp', mechanism: 'M5', destination: '#pricing' }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'section', anchor: 'pricing' } });
    });

    it('accepts a bare anchor name', () => {
      const result = goalToDestination(
        goal({ intent: 'rsvp', mechanism: 'M5', destination: 'features' }),
        { forms: {} },
      );
      expect(result).toEqual({ dest: { kind: 'section', anchor: 'features' } });
    });

    it('returns undefined when destination is missing', () => {
      expect(
        goalToDestination(goal({ intent: 'rsvp', mechanism: 'M5' }), { forms: {} }),
      ).toBeUndefined();
    });
  });

  // ─── scale-05 phase 1: writeback-COMPOSED destinations resolve (wizard →
  // legacyGoalToBriefGoal → goalToDestination round trip) ───
  describe('composed destinations (legacyGoalToBriefGoal round trip)', () => {
    it('enquiry + phone param → wa.me destination resolves as whatsapp (phase 6: prefill msg materialized)', () => {
      // scale-05 phase 6: the writeback now always materializes a deterministic
      // prefill message. With no facts, the degradation string rides ?text=.
      const g = legacyGoalToBriefGoal('enquiry', { phone: '+91 98765 43210' });
      expect(goalToDestination(g, { forms: {} })).toEqual({
        dest: {
          kind: 'whatsapp',
          number: '919876543210',
          msg: "Hi, I found your website and I'm interested.",
        },
      });
    });

    it('enquiry + phone + facts → prefill template rides the resolved whatsapp msg', () => {
      const g = legacyGoalToBriefGoal(
        'enquiry',
        { phone: '+1 555 123 4567' },
        { businessName: 'Acme', offer: 'AI landing pages' },
      );
      expect(goalToDestination(g, { forms: {} })).toEqual({
        dest: {
          kind: 'whatsapp',
          number: '15551234567',
          msg: 'Hi Acme, I found your website — interested in AI landing pages',
        },
      });
      expect(g.param?.message).toBe(
        'Hi Acme, I found your website — interested in AI landing pages',
      );
    });

    it('enquiry + email param → mailto destination resolves as email', () => {
      const g = legacyGoalToBriefGoal('enquiry', { email: 'hi@acme.com' });
      expect(goalToDestination(g, { forms: {} })).toEqual({
        dest: { kind: 'email', addr: 'hi@acme.com' },
      });
    });

    it('demo + Calendly param → composed M3 destination resolves as external', () => {
      const g = legacyGoalToBriefGoal('demo', { url: 'https://calendly.com/acme/30min' });
      expect(goalToDestination(g, { forms: {} })).toEqual({
        dest: { kind: 'external', url: 'https://calendly.com/acme/30min' },
      });
    });

    it('download-app + both store links → resolves external to links[0]', () => {
      const play = 'https://play.google.com/store/apps/details?id=com.katha';
      const appstore = 'https://apps.apple.com/app/katha/id123';
      const g = legacyGoalToBriefGoal('download', { links: [play, appstore] });
      expect(goalToDestination(g, { forms: {} })).toEqual({
        dest: { kind: 'external', url: play },
      });
      // param.links survives untouched for the phase-6 badge injector.
      expect(g.param?.links).toEqual([play, appstore]);
    });

    it('subscribe-newsletter override → M1 #form-section anchor (NOT the M4 social path)', () => {
      const g = legacyGoalToBriefGoal('subscribe-newsletter');
      expect(goalToDestination(g, { forms: { 'form-news': {} } })).toEqual({
        dest: { kind: 'section', anchor: 'form-section' },
        formId: 'form-news',
      });
    });

    it('social destinations still resolve for M4 goals with a profile link (follow-social shape)', () => {
      // No legacy enum maps to follow-social; the M4 generic branch composes
      // destination = links for direct-intent callers (phase 8).
      const g = goal({
        intent: 'follow-social',
        mechanism: 'M4',
        destination: ['https://instagram.com/acme'],
        param: { links: ['https://instagram.com/acme'] },
      });
      expect(goalToDestination(g, { forms: {} })).toEqual({
        dest: { kind: 'social', platform: 'instagram', url: 'https://instagram.com/acme' },
      });
    });
  });
});
