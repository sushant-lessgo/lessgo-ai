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
import { decideServe, BRIDGEABLE_ENGINES, TEMPLATE_AUDIENCE, uncoveredCollectionTags } from './serveGate';
import { businessTypes } from '@/modules/businessTypes/config';
import { templateIds, type TemplateId } from '@/types/service';
import { templateMeta } from '@/modules/templates/templateMeta';

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
    // serve outcome as saas, zero new code. (Historical note: photographer's
    // gallery cap USED to be unbacked → manual; atelier-template phase 4 backs
    // gallery, so photographer now SERVES atelier — see the atelier flip block
    // below.) serve-gate-v2: download-app's derived `store-badges` cap is now
    // satisfied by the store-badges SHARED BLOCK, so even the download-app intent
    // serves (see the F16 serve test below) — the old "pushes to manual" note is
    // obsolete.
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
      // atelier (work engine, no required caps) now also FITS the writer brief, so
      // it joins the work shortlist — but the STYLE pick stays granth
      // (literary-quiet; atelier is editorial-craft). See the pick note below.
      expect(decision.templateId).toBe('granth');
      expect(decision.shortlist).toEqual(['granth', 'atelier']);
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
      // atelier joins the work shortlist (fits any work brief); pick stays granth.
      expect(decision.shortlist).toEqual(['granth', 'atelier']);
      // bridge:work MANUAL clause is deleted — no such tag exists on any path.
      expect(decision).not.toHaveProperty('tags');
    }
  });
});

describe('TEMPLATE_AUDIENCE — served audience derives from picked template (atelier phase 1)', () => {
  it('maps every template to its served audience (atelier = service despite work engine)', () => {
    expect(TEMPLATE_AUDIENCE).toEqual({
      hearth: 'service',
      lex: 'service',
      surge: 'service',
      lumen: 'service',
      meridian: 'product',
      techpremium: 'product',
      vestria: 'product',
      granth: 'writer',
      atelier: 'service',
    });
  });

  it('is total over templateIds so tsc forces future entries (atelier arrives phase 4)', () => {
    for (const id of templateIds) {
      expect(TEMPLATE_AUDIENCE[id]).toBeDefined();
    }
  });

  it('derivation matches the engine bridge for every NON-deviating template; lumen + atelier deviate (work→service)', () => {
    // Engine is DERIVED from templateMeta.copyEngines (not a hand-fed map that can
    // drift — the phase-1 map mislabeled lumen as 'trust' when its real engine is
    // 'work'). Retired templates (techpremium) carry no engine → skipped.
    //
    // Two templates DEVIATE from the pure engine→audience bridge: BOTH are
    // work-engine yet SERVICE-audience — lumen (bespoke, ALREADY deviating before
    // atelier) and atelier. The map exists precisely to encode these deviations,
    // so they are asserted as service directly rather than against
    // BRIDGEABLE_ENGINES['work'] (= 'writer').
    const DEVIATE = new Set<TemplateId>(['lumen', 'atelier']);
    for (const id of templateIds) {
      const meta = templateMeta[id];
      if (meta.retired) continue; // no engine to derive from
      if (DEVIATE.has(id)) {
        expect(TEMPLATE_AUDIENCE[id], `${id} deviates: work engine → service audience`).toBe('service');
        continue;
      }
      const engine = meta.copyEngines[0] as 'thing' | 'trust' | 'work';
      expect(TEMPLATE_AUDIENCE[id]).toBe(BRIDGEABLE_ENGINES[engine]);
    }
  });

  it('served work brief that picks granth still yields audienceType "writer" (unchanged)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'writer', goalIntentGuess: 'follow-social' }),
      'Hindi literary fiction author'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.templateId).toBe('granth');
      // derived via TEMPLATE_AUDIENCE['granth'], not BRIDGEABLE_ENGINES['work']
      // directly — but the value is identical.
      expect(decision.audienceType).toBe('writer');
      expect(decision.audienceType).toBe(TEMPLATE_AUDIENCE.granth);
    }
  });
});

describe('decideServe — serve paths (atelier flip)', () => {
  it('photographer (KNOWN work type, gallery cap NOW backed by atelier) ⇒ SERVE / service / atelier', () => {
    // atelier-template phase 4: atelier is the first NON-bespoke work template to
    // declare `gallery` (+ a resolving capabilitySections block), so the rungC
    // gallery probe now finds a fit → photographer FLIPS MANUAL→SERVE. atelier is
    // the only work template that fits `gallery`, so shortlist = ['atelier'], and
    // it is SERVICE-audience (TEMPLATE_AUDIENCE['atelier'], NOT the work→writer
    // engine bridge) so the served photographer reaches a service-audience site.
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer in Jaipur'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.audienceType).toBe('service');
      expect(decision.templateId).toBe('atelier');
      expect(decision.shortlist).toEqual(['atelier']);
    }
  });
});

// ---------------------------------------------------------------------------
// atelier-template phase 7 — deepened served-path + over-serve coverage.
// These ADD depth beyond the phase-4 flip assertions above: they pin the
// templateMeta backing behind the rungC gallery probe, and prove atelier does
// NOT leak into any non-work shortlist (over-serve guard).
// ---------------------------------------------------------------------------
describe('atelier phase 7 — serve backing + over-serve guards', () => {
  it('rungC gallery probe is backed by atelier templateMeta (gallery+packages capabilitySections resolve)', () => {
    // The photographer flip is only sound because atelier DECLARES gallery as a
    // work-engine capability WITH a resolving capabilitySections entry.
    const meta = templateMeta.atelier;
    expect(meta.copyEngines).toEqual(['work']);
    expect(meta.capabilities).toEqual(['gallery', 'packages', 'multipage']);
    expect(meta.capabilitySections).toEqual({ gallery: 'work', packages: 'packages' });
    expect(meta.retired).toBeFalsy();
    expect(meta.bespoke).toBeFalsy();
  });

  it('photographer ⇒ SERVE/service/atelier with atelier the SOLE shortlist entry + audience derived from the template', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', tiebreaker: 'portfolio-is-proof' }),
      'wedding photographer in Jaipur'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.templateId).toBe('atelier');
      expect(decision.shortlist).toEqual(['atelier']);
      // audience derives from the picked template (service), NOT the work engine
      // bridge (writer) — the whole point of the phase-1 map.
      expect(decision.audienceType).toBe('service');
      expect(decision.audienceType).toBe(TEMPLATE_AUDIENCE.atelier);
      expect(decision.audienceType).not.toBe(BRIDGEABLE_ENGINES.work);
    }
  });

  it('over-serve guard: a TRUST-engine serve (agency) never lists atelier (work-only)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'agency', goalIntentGuess: 'book-call' }),
      'growth agency'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.shortlist).toEqual(['hearth', 'lex', 'surge']);
      expect(decision.shortlist).not.toContain('atelier');
    }
  });

  it('over-serve guard: a PRODUCT-engine serve (saas) never lists atelier (work-only)', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'saas', goalIntentGuess: 'free-trial' }),
      'invoicing tool'
    );
    const decision = decideServe(brief);
    expect(decision.outcome).toBe('serve');
    if (decision.outcome === 'serve') {
      expect(decision.shortlist).toEqual(['meridian', 'vestria']);
      expect(decision.shortlist).not.toContain('atelier');
    }
  });

  it('over-serve guard: an OUT-OF-ICP brief (checkout) is NOT served — atelier cannot rescue it', () => {
    const brief = buildBriefDraft(
      makeSignals({ businessTypeGuess: 'photographer', platformNeeds: 'checkout' }),
      'photographer storefront with checkout'
    );
    const decision = decideServe(brief);
    // out-of-icp is EXCLUSIVE — even a work/gallery type is pushed to manual.
    expect(decision.outcome).toBe('manual');
    if (decision.outcome === 'manual') {
      expect(decision.missing).toBe('out-of-icp');
      expect(decision.outOfIcp).toBe(true);
    }
  });
});

describe('decideServe — manual paths (strict missing strings)', () => {
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
    // atelier flip: photographer now SERVES — invariance must hold across the
    // newly-serving outcome (single vs multi ⇒ same serve/service/atelier).
    { businessTypeGuess: 'photographer', goalIntentGuess: 'book-call', tiebreaker: 'portfolio-is-proof' },
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
