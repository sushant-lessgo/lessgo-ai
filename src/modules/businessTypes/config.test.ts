// src/modules/businessTypes/config.test.ts
// Shape test for businessTypes v0 (spec 01 phase 5 step 4). v0 is shape, not
// behavior — this test freezes the contract downstream specs will read.

import { describe, it, expect } from 'vitest';
import { businessTypes, businessTypeKeys } from './config';
import { copyEngines, capabilityIds, designStyles } from '@/types/brief';
import { goalIntents } from '@/modules/goals/vocabulary';
import { isExtractionSchemaKey } from '@/lib/schemas/extraction';

describe('businessTypes v0 shape', () => {
  it('has exactly the 6 seed keys incl. manufacturer + writer', () => {
    const keys = Object.keys(businessTypes).sort();
    expect(keys).toEqual([...businessTypeKeys].sort());
    expect(keys).toHaveLength(6);
    expect(keys).toContain('manufacturer');
    expect(keys).toContain('writer');
  });

  it('every entry.key matches its record key', () => {
    for (const [key, entry] of Object.entries(businessTypes)) {
      expect(entry.key).toBe(key);
    }
  });

  it('every copyEngine is valid', () => {
    for (const entry of Object.values(businessTypes)) {
      expect(copyEngines).toContain(entry.copyEngine);
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
});
