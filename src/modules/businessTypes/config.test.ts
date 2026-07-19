// src/modules/businessTypes/config.test.ts
// Shape test for businessTypes v0 (spec 01 phase 5 step 4). v0 is shape, not
// behavior — this test freezes the contract downstream specs will read.

import { describe, it, expect } from 'vitest';
import { businessTypes, businessTypeKeys, workCandidateBusinessKeys } from './config';
import { copyEngines, resolvedEngines, capabilityIds, designStyles } from '@/types/brief';
import { goalIntents } from '@/modules/goals/vocabulary';
import { isExtractionSchemaKey } from '@/lib/schemas/extraction';

describe('businessTypes v0 shape', () => {
  it('has exactly the 9 seed keys incl. manufacturer + writer + phase-3 photographer/app + designer', () => {
    const keys = Object.keys(businessTypes).sort();
    expect(keys).toEqual([...businessTypeKeys].sort());
    expect(keys).toHaveLength(9);
    expect(keys).toContain('manufacturer');
    expect(keys).toContain('writer');
    expect(keys).toContain('photographer');
    expect(keys).toContain('app');
    expect(keys).toContain('designer');
  });

  it('every entry.key matches its record key', () => {
    for (const [key, entry] of Object.entries(businessTypes)) {
      expect(entry.key).toBe(key);
    }
  });

  it('every engine binding is well-formed (committed copyEngine ∈ copyEngines; ambiguous prior ∈ candidates ⊆ resolvedEngines, length ≥ 2)', () => {
    for (const entry of Object.values(businessTypes)) {
      if (entry.engineState === 'committed') {
        expect(copyEngines).toContain(entry.copyEngine);
      } else {
        expect(entry.candidateEngines.length).toBeGreaterThanOrEqual(2);
        expect(entry.candidateEngines).toContain(entry.priorEngine);
        for (const c of entry.candidateEngines) {
          expect(resolvedEngines).toContain(c);
        }
      }
    }
  });

  it('every requiredCapabilities ⊆ capabilityIds', () => {
    for (const entry of Object.values(businessTypes)) {
      for (const cap of entry.requiredCapabilities) {
        expect(capabilityIds).toContain(cap);
      }
    }
  });

  it('manufacturer requires lead-form only (catalog preferred, not required)', () => {
    expect(businessTypes.manufacturer.requiredCapabilities).toEqual(['lead-form']);
  });

  it('every likelyIntents ⊆ goalIntents, length 3–4 (manufacturer: 2–4)', () => {
    for (const [key, entry] of Object.entries(businessTypes)) {
      for (const intent of entry.likelyIntents) {
        expect(goalIntents).toContain(intent);
      }
      const min = key === 'manufacturer' ? 2 : 3;
      expect(entry.likelyIntents.length).toBeGreaterThanOrEqual(min);
      expect(entry.likelyIntents.length).toBeLessThanOrEqual(4);
    }
  });

  it('every defaultStyle ∈ designStyles', () => {
    for (const entry of Object.values(businessTypes)) {
      expect(designStyles).toContain(entry.defaultStyle);
    }
  });

  it('every wizardFields entry has non-empty label + example', () => {
    for (const entry of Object.values(businessTypes)) {
      const fields = Object.values(entry.wizardFields);
      expect(fields.length).toBeGreaterThanOrEqual(2);
      for (const field of fields) {
        expect(field.label.trim().length).toBeGreaterThan(0);
        expect(field.example.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('extractionSchemaKey is a real extraction-registry key (scale-06 phase 7)', () => {
    for (const entry of Object.values(businessTypes)) {
      expect(isExtractionSchemaKey(entry.extractionSchemaKey)).toBe(true);
    }
  });

  it('every thing-engine voiceHint is a valid ProductVoiceId; manufacturer=tailored-trade (scale-08 phase 1)', () => {
    const PRODUCT_VOICE_IDS = ['modern-tech', 'tailored-trade'];
    for (const entry of Object.values(businessTypes)) {
      if (
        entry.engineState === 'committed' &&
        entry.copyEngine === 'thing' &&
        entry.voiceHint !== undefined
      ) {
        expect(PRODUCT_VOICE_IDS).toContain(entry.voiceHint);
      }
    }
    expect(businessTypes.manufacturer.voiceHint).toBe('tailored-trade');
    expect(businessTypes.saas.voiceHint).toBe('modern-tech');
  });
});

// scale-08 phase 3 — the two config-only proof entries. Shape asserts live here;
// serveability asserts (photographer NOT serveable — gallery unbacked; app IS
// serveable) live in serveGate.test.ts where the gate + signal helpers already
// exist. Together they prove: a new business type is a list entry, nothing more.
describe('businessTypes phase-3 entries (photographer + app)', () => {
  it('photographer: committed work engine, requires gallery cap (backed by atelier), editorial-craft, no voiceHint', () => {
    const p = businessTypes.photographer;
    expect(p.key).toBe('photographer');
    expect(p.engineState).toBe('committed');
    if (p.engineState === 'committed') expect(p.copyEngine).toBe('work');
    expect(p.requiredCapabilities).toEqual(['gallery']);
    expect(p.defaultStyle).toBe('editorial-craft');
    expect(p.extractionSchemaKey).toBe('work');
    // atelier phase 5 — photographers default to MULTI (work+multipage atelier).
    expect(p.structureDefault).toBe('multi');
    expect(p.voiceHint).toBeUndefined(); // work engine keeps voice archetype-keyed
    expect(p.likelyIntents).toEqual(['enquiry', 'book-call', 'follow-social']);
  });

  it('app: committed thing engine, lead-form, tech-minimal, modern-tech voiceHint', () => {
    const a = businessTypes.app;
    expect(a.key).toBe('app');
    expect(a.engineState).toBe('committed');
    if (a.engineState === 'committed') expect(a.copyEngine).toBe('thing');
    expect(a.requiredCapabilities).toEqual(['lead-form']);
    expect(a.defaultStyle).toBe('tech-minimal');
    expect(a.extractionSchemaKey).toBe('thing');
    expect(a.structureDefault).toBe('single');
    expect(a.voiceHint).toBe('modern-tech');
    expect(a.likelyIntents).toEqual(['download-app', 'signup-free', 'waitlist']);
  });
});

// engineDecider phase 1 — the EngineBinding discriminated union.
describe('EngineBinding union (engineDecider phase 1)', () => {
  it('exactly designer + agency + manufacturer are ambiguous; the other 6 keys are committed', () => {
    const ambiguous = businessTypeKeys.filter(
      (k) => businessTypes[k].engineState === 'ambiguous'
    );
    expect([...ambiguous].sort()).toEqual(['agency', 'designer', 'manufacturer']);
  });

  it('manufacturer → ambiguous {thing,trust}, prior thing (founder call at the Phase-1 gate)', () => {
    const mfr = businessTypes.manufacturer;
    expect(mfr.engineState).toBe('ambiguous');
    if (mfr.engineState === 'ambiguous') {
      expect(mfr.candidateEngines).toEqual(['thing', 'trust']);
      expect(mfr.priorEngine).toBe('thing');
    }
    // voiceHint (shared union field) is preserved — the thing engine still reads
    // it via productVoiceForBusinessType regardless of engineState.
    expect(mfr.voiceHint).toBe('tailored-trade');
  });

  it('designer → ambiguous {work,trust}, prior work (the cirkles case)', () => {
    const d = businessTypes.designer;
    expect(d.engineState).toBe('ambiguous');
    if (d.engineState === 'ambiguous') {
      expect(d.candidateEngines).toEqual(['work', 'trust']);
      expect(d.priorEngine).toBe('work');
    }
  });

  it('agency → ambiguous {trust,work}, prior trust', () => {
    const a = businessTypes.agency;
    expect(a.engineState).toBe('ambiguous');
    if (a.engineState === 'ambiguous') {
      expect(a.candidateEngines).toEqual(['trust', 'work']);
      expect(a.priorEngine).toBe('trust');
    }
  });

  it('workCandidateBusinessKeys = committed-work ∪ ambiguous-with-work-candidate', () => {
    // writer/photographer (committed work) ∪ designer/agency (ambiguous, work ∈
    // candidateEngines). Every member is a possible D4 work-pick.
    expect(workCandidateBusinessKeys().sort()).toEqual([
      'agency',
      'designer',
      'photographer',
      'writer',
    ]);
  });
});
