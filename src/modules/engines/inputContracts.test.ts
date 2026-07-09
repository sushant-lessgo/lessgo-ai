// src/modules/engines/inputContracts.test.ts
// scale-06 phase 1 — contract shape invariants.

import { describe, it, expect } from 'vitest';
import {
  engineContracts,
  getContract,
  factGroups,
  wizardSlots,
  reservedSlotSkips,
  type AskCandidate,
} from './inputContracts';
import { engineCoreSections } from './coreSections';
import { copyEngines, type CopyEngine } from '@/types/brief';

const engines: CopyEngine[] = [...copyEngines];

describe('inputContracts — coverage', () => {
  it('has a contract for every copy engine', () => {
    for (const e of engines) {
      expect(getContract(e)).toBeDefined();
      expect(engineContracts[e].engine).toBe(e);
    }
  });
});

describe('inputContracts — 5 fact groups per engine', () => {
  it.each(engines)('%s covers exactly the 5 fact groups', (engine) => {
    const groups = new Set(engineContracts[engine].fields.map((f) => f.group));
    expect([...groups].sort()).toEqual([...factGroups].sort());
    expect(groups.size).toBe(5);
  });
});

describe('inputContracts — field hygiene', () => {
  it.each(engines)('%s field ids are unique', (engine) => {
    const ids = engineContracts[engine].fields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(engines)('%s slots + slotSkips are valid slot names', (engine) => {
    const c = engineContracts[engine];
    for (const f of c.fields) expect(wizardSlots).toContain(f.slot);
    for (const s of c.slotSkips) expect(wizardSlots).toContain(s);
  });
});

describe('inputContracts — core-section alignment', () => {
  it.each(engines)('%s field sections are ⊆ engine core sections', (engine) => {
    const core = new Set(engineCoreSections[engine]);
    for (const f of engineContracts[engine].fields) {
      if (f.section) expect(core.has(f.section)).toBe(true);
    }
  });

  it.each(engines)('%s dropTargets are ⊆ engine core sections', (engine) => {
    const core = new Set(engineCoreSections[engine]);
    for (const f of engineContracts[engine].fields) {
      if (f.dropTarget) expect(core.has(f.dropTarget)).toBe(true);
    }
  });
});

describe('inputContracts — ASK candidates converge', () => {
  const allowed: AskCandidate[] = ['differentiator', 'real-numbers', 'proof-artifacts', 'goal-param'];

  it.each(engines)('%s ask candidates ⊆ the converged four', (engine) => {
    for (const f of engineContracts[engine].fields) {
      if (f.askCandidate) expect(allowed).toContain(f.askCandidate);
    }
  });

  it.each(engines)('%s exposes differentiator, proof-artifacts, and goal-param', (engine) => {
    const cands = new Set(
      engineContracts[engine].fields.map((f) => f.askCandidate).filter(Boolean),
    );
    expect(cands.has('differentiator')).toBe(true);
    expect(cands.has('proof-artifacts')).toBe(true);
    expect(cands.has('goal-param')).toBe(true);
  });
});

describe('inputContracts — baked-in defaults', () => {
  it('differentiator is a guided-chips field with non-empty per-engine chip starters', () => {
    // phase-6b: free text froze people → guided chips seed an editable text box.
    // Semantics unchanged (still a single always-ASK differentiator); input MODE only.
    for (const e of engines) {
      const diff = engineContracts[e].fields.find((f) => f.askCandidate === 'differentiator');
      expect(diff?.input).toBe('guided-chips');
      expect(Array.isArray(diff?.chips)).toBe(true);
      expect(diff?.chips?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('real-numbers field is skippable-with-warning (thing/trust)', () => {
    for (const e of ['thing', 'trust'] as CopyEngine[]) {
      const nums = engineContracts[e].fields.find((f) => f.askCandidate === 'real-numbers');
      expect(nums?.skippableWithWarning).toBe(true);
      expect(nums?.requirement).toBe('optional');
    }
  });

  it('reserves the quick-yes-skips-offer flag as data only', () => {
    expect(reservedSlotSkips['quick-yes']).toContain('offer');
    // No shipped engine emits it.
    for (const e of engines) expect(engineContracts[e].slotSkips).not.toContain('offer');
  });
});
