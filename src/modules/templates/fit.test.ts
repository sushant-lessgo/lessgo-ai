// src/modules/templates/fit.test.ts
// Acceptance fixtures + edge cases for the hard-fit helpers (spec 01 D-G).

import { describe, it, expect } from 'vitest';
import { fit, requiredCapabilitiesFromBrief, shortlist, fitsBrief } from './fit';
import type { Brief } from '@/types/brief';

describe('shortlist — acceptance fixtures', () => {
  it('saas brief (thing, M1) → [meridian, vestria] (techpremium excluded via retired)', () => {
    const brief: Brief = {
      businessType: 'saas',
      copyEngine: 'thing',
      goal: { intent: 'request-demo', mechanism: 'M1' },
    };
    expect(shortlist(brief)).toEqual(['meridian', 'vestria']);
  });

  it('agency brief (trust, M1) → [hearth, lex, surge]', () => {
    const brief: Brief = {
      businessType: 'agency',
      copyEngine: 'trust',
      goal: { intent: 'book-call', mechanism: 'M1' },
    };
    expect(shortlist(brief)).toEqual(['hearth', 'lex', 'surge']);
  });

  it('photographer needing gallery → 0 matches on work AND trust engines', () => {
    // Photographer has no businessType entry yet — exercise the pure fit()
    // with explicit required: ['gallery'], documenting exactly what an entry
    // would need. granth lacks gallery; lumen is bespoke-excluded.
    const workMatches = (['hearth', 'lex', 'surge', 'meridian', 'techpremium', 'lumen', 'granth', 'vestria'] as const)
      .filter((t) => fit(t, 'work', ['gallery']));
    const trustMatches = (['hearth', 'lex', 'surge', 'meridian', 'techpremium', 'lumen', 'granth', 'vestria'] as const)
      .filter((t) => fit(t, 'trust', ['gallery']));
    expect(workMatches).toEqual([]);
    expect(trustMatches).toEqual([]);
  });
});

describe('fit — edge cases', () => {
  it('retired excluded: thing + no requirements still omits techpremium', () => {
    expect(fit('techpremium', 'thing', [])).toBe(false);
    const briefThing: Brief = { copyEngine: 'thing' };
    expect(shortlist(briefThing)).toEqual(['meridian', 'vestria']);
  });

  it('bespoke excluded: work + [] → granth only (lumen out)', () => {
    expect(fit('lumen', 'work', [])).toBe(false);
    const briefWork: Brief = { copyEngine: 'work' };
    expect(shortlist(briefWork)).toEqual(['granth']);
  });

  it('M1 derives lead-form', () => {
    const brief: Brief = { copyEngine: 'trust', goal: { intent: 'enquiry', mechanism: 'M1' } };
    expect(requiredCapabilitiesFromBrief(brief)).toContain('lead-form');
  });

  it("structure.mode='multi' derives multipage: thing + multi → [vestria]", () => {
    const brief: Brief = {
      copyEngine: 'thing',
      structure: { mode: 'multi', pages: ['home', 'products'] },
    };
    expect(requiredCapabilitiesFromBrief(brief)).toContain('multipage');
    expect(shortlist(brief)).toEqual(['vestria']);
  });

  it('download-app derives store-badges → 0 matches (nobody declares it)', () => {
    const brief: Brief = {
      copyEngine: 'thing',
      goal: { intent: 'download-app', mechanism: 'M3' },
    };
    expect(requiredCapabilitiesFromBrief(brief)).toContain('store-badges');
    expect(shortlist(brief)).toEqual([]);
  });

  it('unknown businessType contributes no requirements (gate rejects later, spec 02+)', () => {
    const brief: Brief = { businessType: 'photographer', copyEngine: 'trust' };
    expect(requiredCapabilitiesFromBrief(brief)).toEqual([]);
    expect(shortlist(brief)).toEqual(['hearth', 'lex', 'surge']);
  });

  it('missing engine → nothing fits', () => {
    expect(fit('meridian', undefined, [])).toBe(false);
    expect(shortlist({})).toEqual([]);
  });
});

describe('fitsBrief — brief-level convenience', () => {
  const saasBrief: Brief = {
    businessType: 'saas',
    copyEngine: 'thing',
    goal: { intent: 'free-trial', mechanism: 'M3' },
  };

  it('true for a shortlisted template', () => {
    expect(fitsBrief('meridian', saasBrief)).toBe(true);
    expect(fitsBrief('vestria', saasBrief)).toBe(true);
  });

  it('false for wrong engine / retired', () => {
    expect(fitsBrief('hearth', saasBrief)).toBe(false);
    expect(fitsBrief('techpremium', saasBrief)).toBe(false);
  });

  it('agrees with shortlist membership', () => {
    const brief: Brief = { copyEngine: 'trust', goal: { intent: 'enquiry', mechanism: 'M1' } };
    const list = shortlist(brief);
    for (const t of ['hearth', 'lex', 'surge', 'meridian', 'granth', 'lumen', 'techpremium', 'vestria'] as const) {
      expect(fitsBrief(t, brief)).toBe(list.includes(t));
    }
  });
});
