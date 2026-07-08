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

    it('returns undefined when destination is missing', () => {
      expect(
        goalToDestination(goal({ intent: 'enquiry', mechanism: 'M2' }), { forms: {} }),
      ).toBeUndefined();
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

    it('returns undefined when destination is missing', () => {
      expect(
        goalToDestination(goal({ intent: 'signup-free', mechanism: 'M3' }), { forms: {} }),
      ).toBeUndefined();
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
    it('enquiry + phone param → wa.me destination resolves as whatsapp', () => {
      const g = legacyGoalToBriefGoal('enquiry', { phone: '+91 98765 43210' });
      expect(goalToDestination(g, { forms: {} })).toEqual({
        dest: { kind: 'whatsapp', number: '919876543210' },
      });
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
