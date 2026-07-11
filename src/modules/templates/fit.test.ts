// src/modules/templates/fit.test.ts
// Acceptance fixtures + edge cases for the hard-fit helpers (spec 01 D-G) +
// scale-07 phase 6: structure-derived requirements (7b deletion relaxes
// hard-fit) and the BriefSchema.structure persistence contract.

import { describe, it, expect } from 'vitest';
import {
  fit,
  requiredCapabilitiesFromBrief,
  requiredCapabilitiesFromStructure,
  shortlist,
  fitsBrief,
  type ConfirmedStructure,
} from './fit';
import type { Brief } from '@/types/brief';
import type { TemplateId } from '@/types/service';
import { BriefSchema } from '@/lib/schemas/brief.schema';

const ALL_TEMPLATES = [
  'meridian', 'vestria', 'hearth', 'lex', 'surge', 'granth', 'lumen', 'techpremium',
] as const satisfies readonly TemplateId[];

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

  it('M1 derives lead-form (requirement stays modeled)', () => {
    const brief: Brief = { copyEngine: 'trust', goal: { intent: 'enquiry', mechanism: 'M1' } };
    expect(requiredCapabilitiesFromBrief(brief)).toContain('lead-form');
  });

  it("serve-gate-v2: inferred structure.mode='multi' NO LONGER derives multipage (soft signal)", () => {
    // AI-inferred multi must never reject: it is dropped from the brief-level
    // requirement set entirely, so the shortlist is NOT narrowed to
    // multipage-capable templates pre-7b. thing + inferred multi ⇒ full thing
    // shortlist (both meridian and vestria), not vestria-only.
    const brief: Brief = {
      copyEngine: 'thing',
      structure: { mode: 'multi', pages: ['home', 'products'] },
    };
    expect(requiredCapabilitiesFromBrief(brief)).not.toContain('multipage');
    expect(shortlist(brief)).toEqual(['meridian', 'vestria']);
    // The 7b law is intact: USER-CONFIRMED multi still hardens multipage.
    expect(
      requiredCapabilitiesFromStructure({ mode: 'multi', pages: ['home', 'products'] }, 'thing')
    ).toContain('multipage');
  });

  it('serve-gate-v2: download-app STILL derives store-badges, but a SHARED BLOCK satisfies it ⇒ shortlist NON-empty', () => {
    // The requirement stays modeled (a future mechanism may lack a shared
    // block); only SATISFACTION changed — the store-badges shared block renders
    // on every template, so both thing templates now fit.
    const brief: Brief = {
      copyEngine: 'thing',
      goal: { intent: 'download-app', mechanism: 'M3' },
    };
    expect(requiredCapabilitiesFromBrief(brief)).toContain('store-badges');
    expect(shortlist(brief)).toEqual(['meridian', 'vestria']);
  });

  it('serve-gate-v2: lead-form (no native template declaration) is satisfied by the shared block on the work engine', () => {
    // granth declares NO capabilities, yet a work brief requiring lead-form
    // fits granth — the lead-form shared block backs it. This is the F15 win.
    const brief: Brief = { copyEngine: 'work', goal: { intent: 'lead-magnet', mechanism: 'M1' } };
    expect(requiredCapabilitiesFromBrief(brief)).toContain('lead-form');
    expect(fit('granth', 'work', ['lead-form'])).toBe(true);
    expect(shortlist(brief)).toEqual(['granth']);
  });

  it('serve-gate-v2: gallery is NOT satisfied by any shared block ⇒ still unsatisfiable everywhere', () => {
    for (const t of ALL_TEMPLATES) {
      expect(fit(t, 'work', ['gallery'])).toBe(false);
      expect(fit(t, 'trust', ['gallery'])).toBe(false);
    }
  });

  it('serve-gate-v2: retired/bespoke STILL never fit, even with a shared-block-satisfiable requirement', () => {
    // techpremium (retired) + lumen (bespoke) are excluded FIRST, before the
    // capability check — widening satisfaction cannot resurrect them.
    expect(fit('techpremium', 'thing', ['lead-form'])).toBe(false);
    expect(fit('lumen', 'work', ['lead-form'])).toBe(false);
    expect(fit('lumen', 'work', ['store-badges'])).toBe(false);
  });

  it('unknown businessType contributes no requirements (gate rejects later, spec 02+)', () => {
    // 'florist' is a deliberately UNKNOWN businessType (not a businessTypeKey) —
    // was 'photographer' until scale-08 phase 3 promoted photographer to a known
    // gallery-requiring key; repointed to keep testing the unknown-type path.
    const brief: Brief = { businessType: 'florist', copyEngine: 'trust' };
    expect(requiredCapabilitiesFromBrief(brief)).toEqual([]);
    expect(shortlist(brief)).toEqual(['hearth', 'lex', 'surge']);
  });

  it('missing engine → nothing fits', () => {
    expect(fit('meridian', undefined, [])).toBe(false);
    expect(shortlist({})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// scale-07 phase 6 — requiredCapabilitiesFromStructure
// ---------------------------------------------------------------------------

describe('requiredCapabilitiesFromStructure — 7b deletion relaxes hard-fit', () => {
  const eligible = (engine: string, required: Parameters<typeof fit>[2]) =>
    ALL_TEMPLATES.filter((t) => fit(t, engine, required));

  it('drop gallery ⇒ gallery leaves required ⇒ shortlist GROWS (0 → 3 on trust)', () => {
    // `portfolio` is the gallery-evidencing section (lumen's declaration); no
    // engine given ⇒ global inversion, union-of-cores exclusion.
    const withGallery = requiredCapabilitiesFromStructure({
      mode: 'single',
      sections: ['hero', 'services', 'portfolio'],
    });
    expect(withGallery).toContain('gallery');
    expect(eligible('trust', withGallery)).toEqual([]); // nobody serves gallery

    const dropped = requiredCapabilitiesFromStructure({
      mode: 'single',
      sections: ['hero', 'services'],
    });
    expect(dropped).not.toContain('gallery');
    const after = eligible('trust', dropped);
    expect(after).toEqual(['hearth', 'lex', 'surge']);
    expect(after.length).toBeGreaterThan(eligible('trust', withGallery).length);
  });

  it('thing single-page: dropping catalog widens the shortlist (vestria-only → meridian+vestria)', () => {
    const withCatalog = requiredCapabilitiesFromStructure(
      { mode: 'single', sections: ['hero', 'features', 'cta', 'catalog'] },
      'thing'
    );
    // cta → lead-form (meridian's evidence, NOT thing-core); catalog → catalog.
    expect(withCatalog).toEqual(['catalog', 'lead-form']);
    expect(eligible('thing', withCatalog)).toEqual(['vestria']);

    const dropped = requiredCapabilitiesFromStructure(
      { mode: 'single', sections: ['hero', 'features', 'cta'] },
      'thing'
    );
    expect(dropped).toEqual(['lead-form']);
    expect(eligible('thing', dropped)).toEqual(['meridian', 'vestria']);
  });

  it('core sections map to NO capability (trust core cta/packages derive nothing)', () => {
    // cta + packages ARE capability evidence for meridian/surge, but they are
    // trust-CORE — the shared skeleton never derives a requirement.
    const required = requiredCapabilitiesFromStructure(
      { mode: 'single', sections: ['hero', 'services', 'packages', 'cta'] },
      'trust'
    );
    expect(required).toEqual([]);
  });

  it('engine-scoped inversion: trust `about` middle section never derives vestria\'s about capability', () => {
    const required = requiredCapabilitiesFromStructure(
      { mode: 'single', sections: ['hero', 'about', 'stats', 'logos'] },
      'trust'
    );
    expect(required).toEqual([]);
    // Same sections under thing DO derive `about` (vestria declares it).
    const thingRequired = requiredCapabilitiesFromStructure(
      { mode: 'single', sections: ['hero', 'about'] },
      'thing'
    );
    expect(thingRequired).toEqual(['about']);
  });

  it('multi mode: multipage stays trust-on-declaration + page sections derive; dropping the contact page drops lead-form', () => {
    const full: ConfirmedStructure = {
      mode: 'multi',
      pages: ['home', 'contact'],
      pageDetails: [
        { archetypeKey: 'home', slug: '/', sections: ['hero', 'features', 'trust'] },
        { archetypeKey: 'contact', slug: '/contact', sections: ['contact'] },
      ],
    };
    expect(requiredCapabilitiesFromStructure(full, 'thing')).toEqual([
      'multipage',
      'lead-form',
      'trust',
    ]);

    const withoutContact: ConfirmedStructure = {
      mode: 'multi',
      pages: ['home'],
      pageDetails: [
        { archetypeKey: 'home', slug: '/', sections: ['hero', 'features', 'trust'] },
      ],
    };
    expect(requiredCapabilitiesFromStructure(withoutContact, 'thing')).toEqual([
      'multipage',
      'trust',
    ]);
  });

  it('empty/legacy structure ({mode, pages} only) derives only the structural mode', () => {
    expect(
      requiredCapabilitiesFromStructure({ mode: 'multi', pages: ['home', 'about'] }, 'thing')
    ).toEqual(['multipage']);
    expect(requiredCapabilitiesFromStructure({ mode: 'single', pages: [] })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// scale-07 phase 6 — BriefSchema.structure persistence contract
// ---------------------------------------------------------------------------

describe('BriefSchema.structure — persistence contract (shallow-partial trap)', () => {
  it('CRITICAL: partial().safeParse of a single-page confirm WITHOUT pages succeeds', () => {
    // saveDraft validates brief patches with BriefSchema.partial(), which is
    // SHALLOW — structure's inner keys are NOT relaxed. If `pages` were
    // required this exact payload would fail and the brief write would be
    // silently skipped (structure would never persist for single-page).
    const result = BriefSchema.partial().safeParse({
      structure: { mode: 'single', sections: ['hero', 'features'] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.structure).toEqual({
        mode: 'single',
        sections: ['hero', 'features'],
      });
    }
  });

  it('back-compat: OLD rows {mode, pages} (classify writeback) still parse', () => {
    expect(
      BriefSchema.safeParse({ structure: { mode: 'multi', pages: ['home', 'about'] } }).success
    ).toBe(true);
    // classify.ts:171 writes pages: [] on every confirmed brief.
    expect(
      BriefSchema.safeParse({ structure: { mode: 'single', pages: [] } }).success
    ).toBe(true);
  });

  it('round-trip: multi confirm with pageDetails parses unchanged and feeds derivation', () => {
    const structure: ConfirmedStructure = {
      mode: 'multi',
      pages: ['home', 'contact'],
      pageDetails: [
        { archetypeKey: 'home', slug: '/', sections: ['hero', 'features'] },
        { archetypeKey: 'contact', slug: '/contact', sections: ['contact'] },
      ],
    };
    const result = BriefSchema.partial().safeParse({ structure });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.structure).toEqual(structure);
      expect(
        requiredCapabilitiesFromStructure(result.data.structure!, 'thing')
      ).toEqual(['multipage', 'lead-form']);
    }
  });

  it('malformed pageDetails rejected (never a lax passthrough)', () => {
    expect(
      BriefSchema.partial().safeParse({
        structure: { mode: 'multi', pageDetails: [{ archetypeKey: 'home' }] },
      }).success
    ).toBe(false);
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
