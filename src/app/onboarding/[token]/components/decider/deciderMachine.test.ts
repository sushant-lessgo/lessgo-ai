// deciderMachine — the R1 table, exhaustively (engineDecider Phase 2).
//
// R1 is DETERMINISTIC: which screen fires is decided by the resolution (registry
// state); confidence only splits a committed lookup into known (D2) vs
// almost-sure (D3). A bogus/out-of-range/non-finite confidence must never throw
// or change WHICH engine resolves — at most one extra tap.

import { describe, it, expect } from 'vitest';
import {
  statusFromResolution,
  screenForStatus,
  statusAfterPick,
} from './deciderMachine';
import {
  LOW_CONFIDENCE_THRESHOLD,
  type EngineResolution,
} from '@/modules/brief/classify';

const committedLookup = (engine: 'thing' | 'trust' | 'work'): EngineResolution => ({
  state: 'resolved',
  engine,
  source: 'lookup',
});
const tiebreaker = (
  engine: 'thing' | 'trust' | 'work' | 'place' | 'quick-yes'
): EngineResolution => ({ state: 'resolved', engine, source: 'tiebreaker' });
const ambiguousType = (): EngineResolution => ({
  state: 'ask',
  candidates: ['work', 'trust'],
  prior: 'work',
  reason: 'ambiguous-type',
});
const unknownType = (): EngineResolution => ({
  state: 'ask',
  candidates: [],
  prior: 'thing',
  reason: 'unknown-type',
});

describe('statusFromResolution — R1 table', () => {
  it('committed lookup + confidence ≥ 0.6 ⇒ known (D2, zero questions)', () => {
    expect(statusFromResolution(committedLookup('work'), 0.6)).toBe('known');
    expect(statusFromResolution(committedLookup('thing'), 0.9)).toBe('known');
    expect(statusFromResolution(committedLookup('trust'), 1)).toBe('known');
    // Exactly at the threshold is `known` (>= LOW_CONFIDENCE_THRESHOLD).
    expect(statusFromResolution(committedLookup('work'), LOW_CONFIDENCE_THRESHOLD)).toBe(
      'known'
    );
  });

  it('committed lookup + confidence < 0.6 ⇒ almost-sure (D3, one tap)', () => {
    expect(statusFromResolution(committedLookup('trust'), 0.59)).toBe('almost-sure');
    expect(statusFromResolution(committedLookup('thing'), 0.2)).toBe('almost-sure');
    expect(statusFromResolution(committedLookup('work'), 0)).toBe('almost-sure');
  });

  it('unknown type resolved via the tiebreaker ladder ⇒ known (a definite signal)', () => {
    // Confidence is irrelevant on the tiebreaker branch.
    expect(statusFromResolution(tiebreaker('place'), 0.1)).toBe('known');
    expect(statusFromResolution(tiebreaker('trust'), 0.9)).toBe('known');
    expect(statusFromResolution(tiebreaker('quick-yes'), 0)).toBe('known');
  });

  it('ambiguous registry type ⇒ ambiguous (D4), regardless of confidence', () => {
    expect(statusFromResolution(ambiguousType(), 0.99)).toBe('ambiguous');
    expect(statusFromResolution(ambiguousType(), 0)).toBe('ambiguous');
  });

  it('unknown type with no signal ⇒ ambiguous (D4), regardless of confidence', () => {
    expect(statusFromResolution(unknownType(), 0.99)).toBe('ambiguous');
    expect(statusFromResolution(unknownType(), 0)).toBe('ambiguous');
  });

  it('a garbage/out-of-range/non-finite confidence never throws and never flips the engine', () => {
    // NaN ⇒ clamped to 0 ⇒ almost-sure (the safe extra-tap branch), never a throw.
    expect(statusFromResolution(committedLookup('work'), Number.NaN)).toBe('almost-sure');
    // Above 1 clamps to 1 ⇒ known.
    expect(statusFromResolution(committedLookup('work'), 5)).toBe('known');
    // Below 0 clamps to 0 ⇒ almost-sure.
    expect(statusFromResolution(committedLookup('work'), -3)).toBe('almost-sure');
    expect(statusFromResolution(committedLookup('work'), Number.POSITIVE_INFINITY)).toBe(
      'almost-sure'
    );
    // A bogus confidence can NEVER turn an `ask` into a resolved screen.
    expect(statusFromResolution(ambiguousType(), Number.NaN)).toBe('ambiguous');
  });
});

describe('screenForStatus — status → decider screen', () => {
  it('maps each status to its screen', () => {
    expect(screenForStatus('resolving')).toBe('resolving');
    expect(screenForStatus('known')).toBe('D2');
    expect(screenForStatus('almost-sure')).toBe('D3');
    expect(screenForStatus('ambiguous')).toBe('D4');
    expect(screenForStatus('confirmed')).toBe('settled');
  });

  it('defends against a missing/undefined status (EntryFacts.engineStatus is optional)', () => {
    expect(screenForStatus(undefined)).toBe('resolving');
  });
});

describe('statusAfterPick — the pick transition', () => {
  it('any pre-commit status becomes confirmed on a pick', () => {
    expect(statusAfterPick()).toBe('confirmed');
  });
});
