// data-capture Phase 3 — regression guard for the race-critical re-freeze
// accumulator (queueAiBaselinePatch + clearShippedAiBaselinePatch).
//
// The clear is PINNED to a SELECTIVE, deep-equal semantic: on a save SUCCESS we
// remove ONLY the accumulator sections whose CURRENT value still deep-equals the
// snapshot that was shipped. Sections queued/overwritten AFTER the snapshot (e.g.
// regen-B lands while save-A is in flight) must SURVIVE to ship on the next save.
// A blanket clear would drop regen-B's re-freeze → its section forever diffs
// against the stale original-AI baseline → the whole regen masquerades as a giant
// user edit. These tests drive the REAL token-scoped store implementations.

import { describe, it, expect, beforeEach } from 'vitest';
import { createEditStore } from '@/stores/editStore';

type Store = ReturnType<typeof createEditStore>;

const SEC_A = 'hero-aaaa1111';
const SEC_B = 'features-bbbb2222';

describe('aiBaselinePatch — queue + selective (deep-equal) clear', () => {
  let store: Store;

  beforeEach(() => {
    store = createEditStore('tok-aibp');
  });

  it('starts null and queue creates the accumulator', () => {
    expect(store.getState().aiBaselinePatch).toBeNull();
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'A' });
    expect(store.getState().aiBaselinePatch).toEqual({ [SEC_A]: { headline: 'A' } });
  });

  it('(a) queue A → ship(A) → queue B (other section) → clearShipped(A) ⇒ B survives, A gone', () => {
    // regen A
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'A' }, 'replace');
    // save-A ships a deep snapshot of what's queued right now
    const shipped = JSON.parse(JSON.stringify(store.getState().aiBaselinePatch));
    // regen B lands on a different section while save-A is in flight
    store.getState().queueAiBaselinePatch(SEC_B, { headline: 'B' }, 'replace');
    // save-A succeeds → selective clear
    store.getState().clearShippedAiBaselinePatch(shipped);

    expect(store.getState().aiBaselinePatch).toEqual({ [SEC_B]: { headline: 'B' } });
  });

  it('(b) ship(A {k:v}) → re-queue same section {k:v\'} (replace) → clearShipped(A) ⇒ A\' survives (deep-equal fails)', () => {
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'v' }, 'replace');
    const shipped = JSON.parse(JSON.stringify(store.getState().aiBaselinePatch));
    // section A regenerated again before save-A settles → different value
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'v2' }, 'replace');
    store.getState().clearShippedAiBaselinePatch(shipped);

    // A' must survive — its current value no longer deep-equals the shipped snapshot
    expect(store.getState().aiBaselinePatch).toEqual({ [SEC_A]: { headline: 'v2' } });
  });

  it('(b2) element-level merge into a shipped section also defeats deep-equal ⇒ section survives whole', () => {
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'v' }, 'replace');
    const shipped = JSON.parse(JSON.stringify(store.getState().aiBaselinePatch));
    // element-variation accept on the same section adds a key (merge)
    store.getState().queueAiBaselinePatch(SEC_A, { subheadline: 'sub' });
    store.getState().clearShippedAiBaselinePatch(shipped);

    expect(store.getState().aiBaselinePatch).toEqual({
      [SEC_A]: { headline: 'v', subheadline: 'sub' },
    });
  });

  it('(c) save FAILURE (clear never called) ⇒ A retained for re-ship', () => {
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'A' }, 'replace');
    // simulate ship snapshot but NO clear (failure path returns before clearing)
    JSON.parse(JSON.stringify(store.getState().aiBaselinePatch));
    expect(store.getState().aiBaselinePatch).toEqual({ [SEC_A]: { headline: 'A' } });
  });

  it('clearing the last matching section empties the accumulator back to null', () => {
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'A' }, 'replace');
    const shipped = JSON.parse(JSON.stringify(store.getState().aiBaselinePatch));
    store.getState().clearShippedAiBaselinePatch(shipped);
    expect(store.getState().aiBaselinePatch).toBeNull();
  });

  it('a matching section is dropped while a non-shipped section is kept', () => {
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'A' }, 'replace');
    const shipped = JSON.parse(JSON.stringify(store.getState().aiBaselinePatch));
    store.getState().queueAiBaselinePatch(SEC_B, { headline: 'B' }, 'replace');
    store.getState().clearShippedAiBaselinePatch(shipped);
    // A (deep-equal to shipped) dropped; B (not shipped) kept
    expect(store.getState().aiBaselinePatch).toEqual({ [SEC_B]: { headline: 'B' } });
  });

  it('clearShipped is a no-op on null/empty snapshots', () => {
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'A' });
    store.getState().clearShippedAiBaselinePatch(null);
    store.getState().clearShippedAiBaselinePatch(undefined);
    store.getState().clearShippedAiBaselinePatch({});
    expect(store.getState().aiBaselinePatch).toEqual({ [SEC_A]: { headline: 'A' } });
  });

  it('replace overwrites a section map; merge layers into it', () => {
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'A', subheadline: 'S' }, 'replace');
    // merge (default) adds without dropping
    store.getState().queueAiBaselinePatch(SEC_A, { cta: 'Go' });
    expect(store.getState().aiBaselinePatch![SEC_A]).toEqual({
      headline: 'A',
      subheadline: 'S',
      cta: 'Go',
    });
    // replace drops prior keys
    store.getState().queueAiBaselinePatch(SEC_A, { headline: 'A2' }, 'replace');
    expect(store.getState().aiBaselinePatch![SEC_A]).toEqual({ headline: 'A2' });
  });
});
