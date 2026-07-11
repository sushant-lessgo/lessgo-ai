// src/modules/brief/serveMatrix.test.ts
// serve-gate-v2 phase 3 — the admin serveability matrix is the REAL gate.

import { describe, it, expect } from 'vitest';
import { serveabilityMatrix } from './serveMatrix';
import { businessTypes, businessTypeKeys } from '@/modules/businessTypes/config';
import { buildBriefDraft, type EntrySignals } from './classify';
import { decideServe, type ServeDecision } from './serveGate';

function isValidDecision(d: ServeDecision): boolean {
  if (d.outcome === 'serve') {
    return (
      typeof d.audienceType === 'string' &&
      typeof d.templateId === 'string' &&
      Array.isArray(d.shortlist)
    );
  }
  if (d.outcome === 'manual') {
    return (
      typeof d.missing === 'string' &&
      d.missing !== '' &&
      Array.isArray(d.tags) &&
      typeof d.outOfIcp === 'boolean'
    );
  }
  return false;
}

describe('serveabilityMatrix — real gate per businessType × intent', () => {
  const matrix = serveabilityMatrix();

  it('covers every businessType × likelyIntent pair (no more, no less)', () => {
    const expectedCount = businessTypeKeys.reduce(
      (n, key) => n + businessTypes[key].likelyIntents.length,
      0
    );
    expect(matrix).toHaveLength(expectedCount);
  });

  it('writer × lead-magnet ⇒ SERVE (writer has no lead-magnet intent; use a real writer intent)', () => {
    // writer.likelyIntents: follow-social, buy-via-link, subscribe-newsletter.
    const row = matrix.find(
      (r) => r.businessType === 'writer' && r.intent === 'follow-social'
    );
    expect(row).toBeDefined();
    expect(row!.decision.outcome).toBe('serve');
  });

  it('writer × lead-magnet (synthetic) ⇒ SERVE on granth', () => {
    // Not in writer.likelyIntents, so it is not in the matrix — probe directly.
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'writer', goalIntentGuess: 'lead-magnet' }),
      'writer'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('writer');
      expect(decision.templateId).toBe('granth');
    }
  });

  it('app × download-app ⇒ SERVE', () => {
    const row = matrix.find(
      (r) => r.businessType === 'app' && r.intent === 'download-app'
    );
    expect(row).toBeDefined();
    expect(row!.decision.outcome).toBe('serve');
    if (row!.decision.outcome === 'serve') {
      expect(row!.decision.audienceType).toBe('product');
    }
  });

  it('all app intents ⇒ SERVE (thing engine, lead-form/store-badges satisfied)', () => {
    const appRows = matrix.filter((r) => r.businessType === 'app');
    expect(appRows.length).toBeGreaterThan(0);
    for (const r of appRows) {
      expect(r.decision.outcome).toBe('serve');
    }
  });

  it('every photographer intent ⇒ MANUAL with rungC:gallery', () => {
    const photoRows = matrix.filter((r) => r.businessType === 'photographer');
    expect(photoRows.length).toBeGreaterThan(0);
    for (const r of photoRows) {
      expect(r.decision.outcome).toBe('manual');
      if (r.decision.outcome === 'manual') {
        expect(r.decision.missing).toBe('rungC:gallery');
      }
    }
  });

  it('every row decision has a valid ServeDecision shape', () => {
    for (const r of matrix) {
      expect(isValidDecision(r.decision)).toBe(true);
    }
  });
});

describe('serveabilityMatrix — invariant to structureHint (inference never changes a row)', () => {
  // The matrix uses each entry.structureDefault. Prove that per-row decisions
  // are identical whether we force 'single' or 'multi' — inference is a soft
  // signal and must never flip a serve/manual outcome or the pick.
  it('single vs multi ⇒ identical decision for every businessType × intent', () => {
    for (const key of businessTypeKeys) {
      const entry = businessTypes[key];
      for (const intent of entry.likelyIntents) {
        const single = decideServe(
          buildBriefDraft(
            makeSignals({
              businessTypeGuess: key,
              goalIntentGuess: intent,
              structureHint: 'single',
            }),
            entry.label
          )
        );
        const multi = decideServe(
          buildBriefDraft(
            makeSignals({
              businessTypeGuess: key,
              goalIntentGuess: intent,
              structureHint: 'multi',
            }),
            entry.label
          )
        );
        expect(multi).toEqual(single);
      }
    }
  });
});

// Local mirror of serveGate.test.ts's makeSignals — full neutral EntrySignals.
function makeSignals(overrides: Partial<EntrySignals> = {}): EntrySignals {
  return {
    businessTypeGuess: null,
    businessTypeConfidence: 0.9,
    category: null,
    goalIntentGuess: null,
    tiebreaker: 'none',
    structureHint: 'single',
    designStyleHint: null,
    platformNeeds: 'none',
    summary: 'A business.',
    businessName: 'Acme',
    offerings: [],
    audiences: [],
    categories: [],
    outcomes: [],
    deliveryModel: null,
    offer: '',
    oneLiner: 'We do things.',
    proofAvailable: [],
    socialProfiles: [],
    testimonials: [],
    ...overrides,
  };
}
