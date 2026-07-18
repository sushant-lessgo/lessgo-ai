// src/components/onboarding/journey/engines/registry.test.ts
// DRIFT GUARD: the eligibility LEAF (`src/lib/journeyEngines.ts` — the only
// thing the entry page imports) and the seam REGISTRY (the only way to a seam)
// must never disagree. A leaf-listed engine with no registered seam dispatches
// into a crash; a registered seam missing from the leaf is unreachable.

import { describe, it, expect } from 'vitest';
import { journeySeamRegistry, loadJourneySeam } from './registry';
import {
  JOURNEY_SEAM_ENGINES,
  hasJourneySeam,
  isJourneyEligible,
} from '@/lib/journeyEngines';
import { copyEngines } from '@/types/brief';
import type { WorkGroup } from '@/lib/schemas/workFacts.schema';
import type { JourneyWizardState } from './types';

describe('journey seam registry ⟷ leaf drift guard', () => {
  it('registry keys are exactly JOURNEY_SEAM_ENGINES', () => {
    expect(Object.keys(journeySeamRegistry).sort()).toEqual([...JOURNEY_SEAM_ENGINES].sort());
  });

  it('every leaf-listed engine has a loader', () => {
    for (const engine of JOURNEY_SEAM_ENGINES) {
      expect(typeof journeySeamRegistry[engine]).toBe('function');
    }
  });

  it('every registered engine is a real CopyEngine', () => {
    for (const key of Object.keys(journeySeamRegistry)) {
      expect(copyEngines as readonly string[]).toContain(key);
    }
  });

  it('E1 registers work only — thing/trust are declared, not filled', () => {
    expect(Object.keys(journeySeamRegistry)).toEqual(['work']);
    expect(journeySeamRegistry.thing).toBeUndefined();
    expect(journeySeamRegistry.trust).toBeUndefined();
  });
});

describe('loadJourneySeam', () => {
  it('loads the work seam and it satisfies the contract surface', async () => {
    const seam = await loadJourneySeam('work');
    expect(seam).not.toBeNull();
    expect(seam!.engine).toBe('work');
    expect(typeof seam!.rail.toVM).toBe('function');
    expect(typeof seam!.rail.applyEdit).toBe('function');
    expect(typeof seam!.rail.appendNote).toBe('function');
    expect(typeof seam!.enrichDraftForConfirm).toBe('function');
    expect(typeof seam!.steps.questions).toBe('function');
    expect(typeof seam!.steps.plan.prepare).toBe('function');
    expect(typeof seam!.steps.plan.items).toBe('function');
    expect(typeof seam!.preflight).toBe('function');
    expect(typeof seam!.runGeneration).toBe('function');
    expect(typeof seam!.resolveResumeStep).toBe('function');
  });

  it('returns null for engines without a seam', async () => {
    expect(await loadJourneySeam('thing')).toBeNull();
    expect(await loadJourneySeam('trust')).toBeNull();
    expect(await loadJourneySeam(null)).toBeNull();
    expect(await loadJourneySeam(undefined)).toBeNull();
  });
});

// The chip-id JOIN guard (impl-review finding on P2a). `chipIndex` is private,
// so it is exercised through the only public door: `rail.applyEdit('groups')`.
// The contract's documented semantics: "an id this bag never issued ⇒ a NEW
// entry". `Number('') === 0` made `'g'` (and whitespace variants) join to
// `groups[0]` and inherit its ENTIRE payload — this pins the strict `g\d+` shape.
describe('work rail — chip-id join guard', () => {
  const liveFacts = () => ({
    entry: { businessName: 'Studio' },
    work: {
      identity: { name: 'Studio' },
      groups: [
        {
          name: 'Weddings',
          kind: 'category',
          price: { mode: 'exact', amount: 1200, currency: 'EUR' },
          photos: [{ id: 'p1' }],
        },
        {
          name: 'Portraits',
          kind: 'category',
          price: { mode: 'from', amount: 500 },
          items: [{ name: 'Shoot A', photos: [{ id: 'p2' }] }],
        },
      ],
    },
  });

  async function editGroups(chips: { id?: string; label: string }[]): Promise<WorkGroup[]> {
    const seam = await loadJourneySeam('work');
    const result = seam!.rail.applyEdit('groups', { kind: 'chips', value: chips }, liveFacts());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    return (result.facts['work'] as { groups: WorkGroup[] }).groups;
  }

  it.each(['g', 'g 1', ' g1', 'gx', '', 'g99', 'g-1', 'g1.0'])(
    'id %o was never issued by this bag ⇒ a NEW group (no payload inherited)',
    async (id) => {
      const groups = await editGroups([{ id, label: 'Brand New' }]);
      expect(groups).toEqual([
        { name: 'Brand New', kind: 'category', price: { mode: 'on-request' } },
      ]);
    }
  );

  it('an id-less chip ⇒ a NEW group', async () => {
    const groups = await editGroups([{ label: 'Brand New' }]);
    expect(groups).toEqual([
      { name: 'Brand New', kind: 'category', price: { mode: 'on-request' } },
    ]);
  });

  it('g0 / g1 still join, carrying price + photos + items through a rename', async () => {
    const groups = await editGroups([
      { id: 'g1', label: 'Portrait sessions' },
      { id: 'g0', label: 'Weddings' },
    ]);
    // Edited ORDER wins; each group keeps its own payload.
    expect(groups).toEqual([
      {
        name: 'Portrait sessions',
        kind: 'category',
        price: { mode: 'from', amount: 500 },
        items: [{ name: 'Shoot A', photos: [{ id: 'p2' }] }],
      },
      {
        name: 'Weddings',
        kind: 'category',
        price: { mode: 'exact', amount: 1200, currency: 'EUR' },
        photos: [{ id: 'p1' }],
      },
    ]);
  });
});

// Landmine 2 ("flag off ⇒ silent skeleton ⇒ empty reveal"): the P5 placeholder
// must fail CLOSED, so a forgotten wiring fails loudly instead of shipping.
describe('work preflight — fail-closed placeholder (P5 fills it)', () => {
  it('returns {ok:false, reason:"engine-disabled"} until wired', async () => {
    const seam = await loadJourneySeam('work');
    const result = seam!.preflight({} as JourneyWizardState);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('preflight must not fail open');
    expect(result.reason).toBe('engine-disabled');
    expect(typeof result.message).toBe('string');
  });
});

describe('hasJourneySeam', () => {
  it('true only for work', () => {
    expect(hasJourneySeam('work')).toBe(true);
    expect(hasJourneySeam('thing')).toBe(false);
    expect(hasJourneySeam('trust')).toBe(false);
    expect(hasJourneySeam(null)).toBe(false);
    expect(hasJourneySeam(undefined)).toBe(false);
  });
});

describe('isJourneyEligible — truth table', () => {
  it('work + atelier ⇒ true', () => {
    expect(isJourneyEligible('work', 'atelier')).toBe(true);
  });

  it('work + granth ⇒ false (work engine, NOT on the copy-engine allow-list)', () => {
    // Structural, not a work hardcode: writers must keep the legacy WizardShell
    // post-confirm — an engine-only dispatch would strand them.
    expect(isJourneyEligible('work', 'granth')).toBe(false);
  });

  it('work + lumen / unknown / null template ⇒ false', () => {
    expect(isJourneyEligible('work', 'lumen')).toBe(false);
    expect(isJourneyEligible('work', 'nope')).toBe(false);
    expect(isJourneyEligible('work', null)).toBe(false);
    expect(isJourneyEligible('work', undefined)).toBe(false);
  });

  it('thing / trust ⇒ false for every template', () => {
    for (const templateId of ['atelier', 'granth', 'meridian', 'hearth', null]) {
      expect(isJourneyEligible('thing', templateId)).toBe(false);
      expect(isJourneyEligible('trust', templateId)).toBe(false);
    }
  });

  it('a null engine is never eligible', () => {
    expect(isJourneyEligible(null, 'atelier')).toBe(false);
    expect(isJourneyEligible(undefined, 'atelier')).toBe(false);
  });
});
