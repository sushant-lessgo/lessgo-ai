// src/modules/brief/serveGate.test.ts
// Acceptance fixtures end-to-end through buildBriefDraft + decideServe
// (plan phase 1 step 5). `missing` strings are asserted with STRICT equality
// — tag emission order is part of the contract (rungC → rungE → bridge →
// rungA; out-of-icp exclusive).

import { describe, it, expect } from 'vitest';
import {
  buildBriefDraft,
  applyBusinessTypeCorrection,
  type EntrySignals,
} from './classify';
import { decideServe, BRIDGEABLE_ENGINES, uncoveredCollectionTags } from './serveGate';
import { businessTypes } from '@/modules/businessTypes/config';

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

describe('BRIDGEABLE_ENGINES', () => {
  it('launch bridges: thing→product, trust→service, work→writer (scale-06 phase 9)', () => {
    expect(BRIDGEABLE_ENGINES).toEqual({
      thing: 'product',
      trust: 'service',
      work: 'writer',
    });
  });
});

describe('decideServe — serve paths', () => {
  it('agency-shaped signals ⇒ serve / service / surge, shortlist [hearth,lex,surge]', () => {
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'agency',
        category: 'growth marketing agency',
        goalIntentGuess: 'book-call',
        designStyleHint: 'bold-performance',
      }),
      'growth agency for SaaS'
    );
    const decision = decideServe(brief);
    expect(decision).toEqual({
      outcome: 'serve',
      audienceType: 'service',
      templateId: 'surge',
      shortlist: ['hearth', 'lex', 'surge'],
    });
  });

  it('D3 hardening: agency with OFF-LIST designStyleHint still picks surge via defaultStyle retry', () => {
    // 'literary-quiet' matches no trust-shortlisted template → hint misses →
    // businessTypes.agency.defaultStyle ('bold-performance') retry → surge.
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'agency',
        goalIntentGuess: 'book-call',
        designStyleHint: 'literary-quiet',
      }),
      'growth agency for SaaS'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.templateId).toBe('surge');
    }
  });

  it('null designStyleHint: coach ⇒ hearth via defaultStyle (warm-human)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'coach', goalIntentGuess: 'book-call' }),
      'leadership coach'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('service');
      expect(decision.templateId).toBe('hearth');
    }
  });

  it('saas ⇒ serve / product / meridian', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'free-trial' }),
      'invoicing tool for freelancers'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('product');
      expect(decision.templateId).toBe('meridian');
    }
  });

  it('app (KNOWN thing type, scale-08 phase 3) IS serveable ⇒ serve / product', () => {
    // Proves the config-only `app` entry rides the existing thing pipeline: same
    // serve outcome as saas, zero new code. Contrast with photographer, whose
    // unbacked gallery cap sends it to the manual/demand lane below. serve-gate-v2:
    // download-app's derived `store-badges` cap is now satisfied by the
    // store-badges SHARED BLOCK, so even the download-app intent serves (see the
    // F16 serve test below) — the old "pushes to manual" note is obsolete.
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'app', goalIntentGuess: 'signup-free' }),
      'habit-tracking mobile app'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('product');
    }
  });

  // ── serve-gate-v2 repro fixtures: F13 / F15 / F16 — all now SERVE ──
  //
  // Before serve-gate-v2 each of these landed on MANUAL:
  //   F13 consultant + inferred multi → rungC:multipage (inferred multi forced
  //       an unsatisfiable multipage on the trust engine)
  //   F15 writer + lead-magnet(M1)   → rungC:lead-form  (granth declares no cap)
  //   F16 app + download-app(M3)     → rungC:store-badges (no template declares it)
  // The law change (shared-block satisfaction + soft inferred-multi) flips all
  // three to SERVE with no config/template additions.

  it('F13: consultant / trust / request-quote(M1) / inferred multi ⇒ SERVE (inferred multi never rejects)', () => {
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'consultant',
        goalIntentGuess: 'request-quote',
        structureHint: 'multi',
      }),
      'B2B SaaS pricing consultant'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('service');
      // consultant.defaultStyle 'authority-professional' → lex; the inferred
      // multi does NOT hijack the pick (style wins; tiebreak dormant — the
      // style match is a singleton).
      expect(decision.templateId).toBe('lex');
      expect(decision.shortlist).toEqual(['hearth', 'lex', 'surge']);
    }
  });

  it('F15: writer / work / lead-magnet(M1) ⇒ SERVE on granth (lead-form via shared block, granth declares no cap)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'writer', goalIntentGuess: 'lead-magnet' }),
      'Hindi literary fiction author'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('writer');
      expect(decision.templateId).toBe('granth');
      expect(decision.shortlist).toEqual(['granth']);
    }
  });

  it('F16: app / thing / download-app(M3) ⇒ SERVE (store-badges via shared block)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'app', goalIntentGuess: 'download-app' }),
      'habit-tracking mobile app'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('product');
      // app.defaultStyle 'tech-minimal' → meridian; both thing templates fit.
      expect(decision.templateId).toBe('meridian');
      expect(decision.shortlist).toEqual(['meridian', 'vestria']);
    }
  });

  it('writer (KNOWN, work engine) ⇒ serve / writer / granth — NO bridge:work tag (phase 9)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'writer', goalIntentGuess: 'follow-social' }),
      'Hindi literary fiction author'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('writer');
      expect(decision.templateId).toBe('granth');
      expect(decision.shortlist).toEqual(['granth']);
      // bridge:work MANUAL clause is deleted — no such tag exists on any path.
      expect(decision).not.toHaveProperty('tags');
    }
  });
});

describe('decideServe — manual paths (strict missing strings)', () => {
  it('photographer (KNOWN work type, gallery cap unbacked) ⇒ rungC:gallery — no rungA (type is known)', () => {
    // scale-08 phase 3: photographer is now a KNOWN businessType with a required
    // `gallery` cap that no shipped template declares. resolveEngine → work via
    // lookup (source 'lookup', NOT tiebreaker), so no rungA tag and the gallery
    // gap surfaces via the latent-cap fallback ⇒ single `rungC:gallery`.
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer in Jaipur'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('rungC:gallery');
      // serve-gate-v2: photographer is now the live path through the latent-cap
      // FALLBACK guard (F16's saas+download-app test used to hold the
      // never-empty invariant, but that fixture serves now). Keep the invariant
      // asserted here so `missing` can never silently become ''.
      expect(decision.missing).not.toBe('');
      expect(decision.tags).toHaveLength(1);
      expect(decision.tags).not.toContain('bridge:work');
      expect(decision.outOfIcp).toBe(false);
    }
  });

  it('restaurant (unknown, browsing-place) ⇒ rungE:place,rungA:restaurant', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'restaurant', tiebreaker: 'browsing-place' }),
      'family restaurant, browse our menu'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('rungE:place,rungA:restaurant');
      expect(decision.outOfIcp).toBe(false);
    }
  });

  it('checkout ⇒ out-of-icp EXCLUSIVE (no rungA piggyback, even for unknown type)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'boutique', platformNeeds: 'checkout' }),
      'online store with checkout'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('out-of-icp');
      expect(decision.tags).toEqual(['out-of-icp']);
      expect(decision.outOfIcp).toBe(true);
    }
  });

  it('ordering platform ⇒ out-of-icp too', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'restaurant', platformNeeds: 'ordering' }),
      'restaurant with online ordering'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('out-of-icp');
    }
  });

  it('serve-gate-v2: saas + download-app now SERVES (store-badges via shared block) — was the fallback-guard fixture', () => {
    // Pre-serve-gate-v2 this was the never-empty fallback fixture (rungC:store-
    // badges). The store-badges shared block now satisfies the cap, so saas
    // serves. The never-empty invariant moved to the photographer test above.
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'download-app' }),
      'mobile app'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('product');
      expect(decision.templateId).toBe('meridian');
    }
  });
});

// ---------------------------------------------------------------------------
// serve-gate-v2 — inferred structure signal never rejects; style-first pick
// ---------------------------------------------------------------------------

describe('decideServe — inferred structureHint never changes serve/manual outcome', () => {
  // Property: for every serveable fixture, flipping the AI-inferred structureHint
  // between 'single' and 'multi' yields the SAME serve/manual outcome (and, for
  // serve, the same audienceType). Inference is a soft signal — it must never
  // reject and never re-route.
  const serveableFixtures: Array<Partial<EntrySignals>> = [
    { businessTypeGuess: 'agency', goalIntentGuess: 'book-call' },
    { businessTypeGuess: 'coach', goalIntentGuess: 'book-call' },
    { businessTypeGuess: 'consultant', goalIntentGuess: 'request-quote' },
    { businessTypeGuess: 'saas', goalIntentGuess: 'free-trial' },
    { businessTypeGuess: 'app', goalIntentGuess: 'download-app' },
    { businessTypeGuess: 'writer', goalIntentGuess: 'lead-magnet' },
  ];

  for (const overrides of serveableFixtures) {
    it(`${overrides.businessTypeGuess}: single vs multi ⇒ identical outcome`, () => {
      const single = decideServe(
        buildBriefDraft(makeSignals({ ...overrides, structureHint: 'single' }), 'x')
      );
      const multi = decideServe(
        buildBriefDraft(makeSignals({ ...overrides, structureHint: 'multi' }), 'x')
      );
      expect(single.outcome).toBe('serve');
      expect(multi.outcome).toBe(single.outcome);
      if (single.outcome === 'serve' && multi.outcome === 'serve') {
        expect(multi.audienceType).toBe(single.audienceType);
        expect(multi.templateId).toBe(single.templateId);
        expect(multi.shortlist).toEqual(single.shortlist);
      }
    });
  }
});

describe('decideServe — style-first pick, multipage is a dormant same-style tiebreak', () => {
  // NOTE: under today's config no two same-engine templates share a design
  // style, so a style match is always a singleton and the multipage tiebreak
  // branch never fires. These tests assert the FALL-THROUGH behavior (style
  // wins; multipage never hijacks the pick); they do NOT force an artificial
  // multi-template-per-style config to exercise the dormant branch.

  it('(a) saas (thing) + inferred multi + NO style hint ⇒ pick falls through to shortlist[0] = meridian (multipage does NOT hijack)', () => {
    // saas.defaultStyle is 'tech-minimal' → meridian, which happens to be
    // shortlist[0] anyway; the point is multipage-capable vestria is NOT
    // preferred despite the inferred multi. (A literally bare brief with no
    // businessType returns rungA MANUAL with no pickable templateId — a KNOWN
    // type is required to have a pick.)
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'free-trial', structureHint: 'multi' }),
      'invoicing tool'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.templateId).toBe('meridian');
      expect(decision.templateId).not.toBe('vestria');
    }
  });

  it('(b) a design-style match is never overridden by the multipage preference', () => {
    // vestria's style 'editorial-craft' as an explicit hint + inferred multi:
    // the hint match (vestria, singleton) wins outright — no tiebreak needed,
    // and even if it did fire it could not override the style match.
    const brief = buildBriefDraft(
      makeSignals({
        businessTypeGuess: 'saas',
        goalIntentGuess: 'free-trial',
        designStyleHint: 'editorial-craft',
        structureHint: 'multi',
      }),
      'invoicing tool'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.templateId).toBe('vestria');
    }
  });

  it('(c) trust-engine inferred multi ⇒ pick identical to single (consultant → lex either way)', () => {
    const single = decideServe(
      buildBriefDraft(
        makeSignals({ businessTypeGuess: 'consultant', goalIntentGuess: 'request-quote', structureHint: 'single' }),
        'x'
      )
    );
    const multi = decideServe(
      buildBriefDraft(
        makeSignals({ businessTypeGuess: 'consultant', goalIntentGuess: 'request-quote', structureHint: 'multi' }),
        'x'
      )
    );
    expect(single.outcome).toBe('serve');
    if (single.outcome === 'serve' && multi.outcome === 'serve') {
      expect(multi.templateId).toBe(single.templateId);
      expect(single.templateId).toBe('lex');
    }
  });

  it('(d) returned shortlist keeps templateIds order (only the pick gains the tiebreak)', () => {
    const decision = decideServe(
      buildBriefDraft(
        makeSignals({ businessTypeGuess: 'agency', goalIntentGuess: 'book-call', structureHint: 'multi' }),
        'x'
      )
    );
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      // templateIds order for trust = hearth, lex, surge (never re-sorted).
      expect(decision.shortlist).toEqual(['hearth', 'lex', 'surge']);
    }
  });
});

describe('uncoveredCollectionTags — pure supply check (scale-10 phase 3)', () => {
  it('required collection COVERED by a shortlisted template (declares the capability) ⇒ no tag', () => {
    // Fixture template declares `products` as a collection-family capability.
    const tags = uncoveredCollectionTags(['products'], [['lead-form', 'products']]);
    expect(tags).toEqual([]);
  });

  it('required collection UNCOVERED (no shortlisted template declares it) ⇒ precise collection:<key> tag', () => {
    const tags = uncoveredCollectionTags(['services'], [['lead-form']]);
    expect(tags).toEqual(['collection:services']);
  });

  it('vestria flat-grid `catalog` capability does NOT cover the `products` collection key', () => {
    // catalog is not a CollectionKey — a template declaring only catalog covers
    // no requiredCollections key.
    const tags = uncoveredCollectionTags(['products'], [['lead-form', 'catalog']]);
    expect(tags).toEqual(['collection:products']);
  });

  it('multiple required keys ⇒ one tag per uncovered key, covered keys omitted', () => {
    const tags = uncoveredCollectionTags(
      ['products', 'services'],
      [['lead-form', 'products']]
    );
    expect(tags).toEqual(['collection:services']);
  });

  it('empty requiredCollections ⇒ no tags', () => {
    expect(uncoveredCollectionTags([], [['lead-form']])).toEqual([]);
  });
});

describe('decideServe — requiredCollections wiring (fixture-mutated, dormant in real config)', () => {
  // Real config sets requiredCollections for NO businessType (dormant). To
  // exercise the wiring we temporarily populate one entry and restore it.
  it('KNOWN serveable type + UNCOVERED requiredCollections ⇒ manual + collection:<key> tag', () => {
    const orig = businessTypes.saas.requiredCollections;
    // saas shortlists to meridian (caps lead-form+packages) — declares no
    // `products` collection capability ⇒ uncovered.
    (businessTypes.saas as { requiredCollections?: readonly string[] }).requiredCollections = [
      'products',
    ];
    try {
      const brief = buildBriefDraft(
        makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'free-trial' }),
        'invoicing tool for freelancers'
      );
      const decision = decideServe(brief);
      expect(decision.outcome).toBe('manual');
      if (decision.outcome === 'manual') {
        expect(decision.missing).toBe('collection:products');
        expect(decision.tags).toEqual(['collection:products']);
        expect(decision.outOfIcp).toBe(false);
      }
    } finally {
      (businessTypes.saas as { requiredCollections?: readonly string[] }).requiredCollections =
        orig;
    }
  });

  it('real config leaves saas.requiredCollections unset (dormant) ⇒ still serves', () => {
    expect(businessTypes.saas.requiredCollections).toBeUndefined();
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'free-trial' }),
      'invoicing tool for freelancers'
    );
    expect(decideServe(brief).outcome).toBe('serve');
  });
});

describe('decideServe — chooser correction (stale-tiebreaker regression)', () => {
  it('photographer draft corrected to coach ⇒ serve/service, NO rungC:gallery', () => {
    const draft = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer'
    );
    const corrected = applyBusinessTypeCorrection(draft, 'coach');
    const decision = decideServe(corrected);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('service');
    }
  });
});
