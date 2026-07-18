// ============================================================================
// ShowWorkStep — regression tests (qa-0718).
//
// B1 (O9): the correction board + primary advance CTA must render off the
// PERSISTED `committedGroups` (derived from `briefFacts`), NOT the ephemeral
// component-local `proposal` state. A round-trip away and back to the step
// remounts the component → `proposal` resets to null; before the fix that hid
// the board and the "Looks right" button even though every photo was still
// persisted (a data-loss illusion). These tests hydrate the store WITHOUT
// triggering any upload (so `proposal` stays null) and assert both surfaces
// still render.
//
// B16 (O8): when there ARE committed groups the primary "Looks right" is the
// ONLY action button — the redundant "Skip for now" escape is the empty-state
// only.
//
// B14 (O5): the greyed "Tidy up your groups" header + "Merge selected" control
// are beta-hidden.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo),
// mirroring WorkLibraryClient.test.tsx.
// ============================================================================

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import ShowWorkStep from './ShowWorkStep';
import { useWizardStore } from '@/hooks/useWizardStore';
import type { JourneyStepProps } from '../../JourneyShell';

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

const stubSeam = {
  steps: {
    showWork: {
      title: 'Show your work',
      body: 'Upload a folder or choose photos.',
    },
  },
} as unknown as JourneyStepProps['seam'];

const testid = <T extends Element>(id: string) =>
  container.querySelector<T>(`[data-testid="${id}"]`);

async function mount() {
  await act(async () => {
    root.render(<ShowWorkStep seam={stubSeam} />);
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  // Clean slate each test — no upload is triggered, so `proposal` stays null.
  useWizardStore.setState({ briefFacts: null, tokenId: null });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('ShowWorkStep — committed groups survive a remount (B1)', () => {
  it('renders the board + "Looks right" from persisted committedGroups even when proposal is null', async () => {
    // Hydrate persisted facts directly (simulating a round-trip back to the
    // step). No upload → the ephemeral `proposal` state remains null.
    useWizardStore.setState({
      tokenId: 'tok_test',
      briefFacts: {
        work: {
          groups: [
            { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [{ id: 'p1', url: 'https://x/1.webp' }] },
          ],
        },
      },
    });

    await mount();

    // The primary advance CTA is present (pre-fix: absent, gated on proposal).
    expect(testid('show-work-continue')).not.toBeNull();
    expect(testid('show-work-continue')?.textContent).toContain('Looks right');

    // The correction board is present (pre-fix: absent, nested under proposal).
    expect(testid('correction-board')).not.toBeNull();

    // The just-uploaded summary (proposal-only) is NOT shown — no upload ran.
    expect(testid('show-work-proposal')).toBeNull();
  });

  it('shows ONLY the empty-state "Skip for now" escape when there are zero committed groups (B16)', async () => {
    useWizardStore.setState({ tokenId: 'tok_test', briefFacts: { work: { groups: [] } } });

    await mount();

    expect(testid('show-work-continue')).toBeNull();
    expect(testid('show-work-skip')).not.toBeNull();
    expect(testid('correction-board')).toBeNull();
  });

  it('does not render the redundant Skip button once groups are committed (B16)', async () => {
    useWizardStore.setState({
      tokenId: 'tok_test',
      briefFacts: {
        work: { groups: [{ name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [{ id: 'p1', url: 'https://x/1.webp' }] }] },
      },
    });

    await mount();

    // Exactly one advance action — the primary — no duplicate "Skip".
    expect(testid('show-work-continue')).not.toBeNull();
    expect(testid('show-work-skip')).toBeNull();
  });
});

describe('CorrectionBoard beta-hidden controls (B14)', () => {
  it('does not render the "Tidy up your groups" header or the "Merge selected" control', async () => {
    useWizardStore.setState({
      tokenId: 'tok_test',
      briefFacts: {
        work: {
          groups: [
            { name: 'Weddings', kind: 'category', price: { mode: 'on-request' }, photos: [{ id: 'p1', url: 'https://x/1.webp' }] },
            { name: 'Portraits', kind: 'category', price: { mode: 'on-request' }, photos: [{ id: 'p2', url: 'https://x/2.webp' }] },
          ],
        },
      },
    });

    await mount();

    expect(testid('correction-board')).not.toBeNull();
    expect(testid('correction-merge')).toBeNull();
    expect(container.textContent).not.toContain('Tidy up your groups');
  });
});
