// src/modules/audience/work/slimStrategy.test.ts
import { describe, it, expect } from 'vitest';
import type { WorkFacts, WorkGroup } from '@/lib/schemas/workFacts.schema';
import { assembleWorkStructure, deriveStructureSignals } from './slimStrategy';
import { workElementContract } from '@/modules/engines/workSections';
import { professionWording } from '@/modules/engines/workVocabulary';

function group(name: string, extra: Partial<WorkGroup> = {}): WorkGroup {
  return { name, kind: 'category', price: { mode: 'on-request' }, ...extra };
}

const photographerRow = { key: 'photographer' as const };

describe('assembleWorkStructure — determinism', () => {
  it('produces identical structure for the same facts twice', () => {
    const facts: WorkFacts = {
      identity: { name: 'Studio' },
      establishment: 'established',
      languages: ['en'],
      praise: ['Great', 'Wonderful'],
      groups: [group('A'), group('B'), group('C')],
    };
    const a = assembleWorkStructure(facts, photographerRow);
    const b = assembleWorkStructure(facts, photographerRow);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('assembleWorkStructure — archetype selection', () => {
  it('one-pager for a tiny new seller (<=1 group, no items, no prices, not established)', () => {
    const facts: WorkFacts = {
      establishment: 'new',
      groups: [group('Only')],
    };
    const s = assembleWorkStructure(facts, photographerRow);
    expect(s.archetype).toBe('one-pager');
    expect(s.pages.map((p) => p.page)).toEqual(['home']);
  });

  it('standard when there are >=3 groups', () => {
    const facts: WorkFacts = { groups: [group('A'), group('B'), group('C')] };
    const s = assembleWorkStructure(facts, photographerRow);
    expect(s.archetype).toBe('standard');
    expect(s.pages[0].page).toBe('home');
  });

  it('standard when the seller is established (even with few groups)', () => {
    const facts: WorkFacts = { establishment: 'established', groups: [group('A')] };
    expect(assembleWorkStructure(facts, photographerRow).archetype).toBe('standard');
  });

  it('compact for the middle ground (2 groups, no prices, not established)', () => {
    const facts: WorkFacts = { groups: [group('A'), group('B')] };
    const s = assembleWorkStructure(facts, photographerRow);
    expect(s.archetype).toBe('compact');
  });
});

describe('assembleWorkStructure — card counts track group/praise sizes and respect contract min/max', () => {
  it('work.groups + packages.packages counts equal the group count when under max', () => {
    const facts: WorkFacts = { groups: [group('A'), group('B'), group('C')] };
    const s = assembleWorkStructure(facts, photographerRow);

    const homeWork = s.pages.find((p) => p.page === 'home')?.collections['work'];
    const groupsPlan = homeWork?.find((c) => c.key === 'groups');
    expect(groupsPlan?.count).toBe(3);
    expect(groupsPlan?.max).toBe(workElementContract.work.collections!.groups.constraints.max);

    // prices page carries packages
    const pricesPkgs = s.pages.find((p) => p.page === 'prices')?.collections['packages'];
    const pkgPlan = pricesPkgs?.find((c) => c.key === 'packages');
    expect(pkgPlan?.count).toBe(3);
  });

  it('never exceeds the contract max (many groups clamp down)', () => {
    const many = Array.from({ length: 20 }, (_, i) => group(`G${i}`));
    const facts: WorkFacts = { establishment: 'established', groups: many };
    const s = assembleWorkStructure(facts, photographerRow);
    const groupsPlan = s.pages
      .find((p) => p.page === 'home')
      ?.collections['work']?.find((c) => c.key === 'groups');
    const max = workElementContract.work.collections!.groups.constraints.max;
    expect(groupsPlan?.count).toBe(max); // 12, not 20
    expect(groupsPlan!.count!).toBeLessThanOrEqual(max);
  });

  it('proof.quotes count equals praise length, clamped to max 3 (no padding below actual)', () => {
    const facts: WorkFacts = {
      establishment: 'established',
      praise: ['one', 'two', 'three', 'four', 'five'],
      groups: [group('A'), group('B'), group('C')],
    };
    const s = assembleWorkStructure(facts, photographerRow);
    // proof appears on home (defaultSections) — find any proof.quotes plan.
    const proofPlan = s.pages
      .flatMap((p) => p.collections['proof'] ?? [])
      .find((c) => c.key === 'quotes');
    expect(proofPlan?.count).toBe(3); // clamped from 5

    const few: WorkFacts = {
      establishment: 'established',
      praise: ['only one'],
      groups: [group('A'), group('B'), group('C')],
    };
    const s2 = assembleWorkStructure(few, photographerRow);
    const proofPlan2 = s2.pages
      .flatMap((p) => p.collections['proof'] ?? [])
      .find((c) => c.key === 'quotes');
    expect(proofPlan2?.count).toBe(1); // not padded up to the contract min
  });
});

describe('assembleWorkStructure — story branch fork', () => {
  it('uses the established branch', () => {
    const facts: WorkFacts = { establishment: 'established', groups: [group('A')] };
    expect(assembleWorkStructure(facts, photographerRow).storyBranch).toBe('established');
  });
  it('uses the new branch', () => {
    const facts: WorkFacts = { establishment: 'new', groups: [group('A')] };
    expect(assembleWorkStructure(facts, photographerRow).storyBranch).toBe('new');
  });
  it('defaults to established when the slot is absent', () => {
    const facts: WorkFacts = { groups: [group('A')] };
    expect(assembleWorkStructure(facts, photographerRow).storyBranch).toBe('established');
  });
});

describe('assembleWorkStructure — lead groups, language, wording', () => {
  it('orders lead groups by curation signal (cover photo dominates)', () => {
    const facts: WorkFacts = {
      groups: [
        group('Plain'),
        group('Covered', { photos: [{ id: 'p1', cover: true }] }),
        group('Sized', { items: [{ name: 'i1', photos: [] }, { name: 'i2', photos: [] }] }),
      ],
    };
    const s = assembleWorkStructure(facts, photographerRow);
    expect(s.leadGroups[0]).toBe('Covered'); // cover photo wins
  });

  it('primary language = languages[0], default en', () => {
    expect(
      assembleWorkStructure({ languages: ['nl', 'en'], groups: [group('A')] }, photographerRow)
        .primaryLanguage
    ).toBe('nl');
    expect(
      assembleWorkStructure({ groups: [group('A')] }, photographerRow).primaryLanguage
    ).toBe('en');
  });

  it('profession wording comes from professionWording', () => {
    const s = assembleWorkStructure({ groups: [group('A')] }, { key: 'writer' });
    expect(s.wording).toEqual(professionWording.writer);
  });
});

describe('deriveStructureSignals', () => {
  it('counts groups, items, prices, establishment', () => {
    const facts: WorkFacts = {
      establishment: 'established',
      groups: [
        group('A', { price: { mode: 'exact', amount: 500 }, items: [{ name: 'x', photos: [] }] }),
        group('B'),
      ],
    };
    const sig = deriveStructureSignals(facts);
    expect(sig.groupCount).toBe(2);
    expect(sig.workItemCount).toBe(1); // one sub-item present
    expect(sig.pricesPresent).toBe(true);
    expect(sig.established).toBe(true);
  });

  it('falls back to group count for workItemCount when no sub-items', () => {
    const sig = deriveStructureSignals({ groups: [group('A'), group('B')] });
    expect(sig.workItemCount).toBe(2);
    expect(sig.pricesPresent).toBe(false); // on-request only
  });
});
