// ============================================================================
// D5DemandBoard — the honest demand board (engineDecider Phase 5).
//
// Pins the load-bearing invariants:
//   • the honest headline interpolates the business/place noun;
//   • the rail shows the amber "DEMAND LOGGED" chip;
//   • submitting the email POSTs /api/demand-lead with the byte-identical
//     ManualOnboardStep body — and `briefDraft.copyEngine` is NEVER set for a
//     place lead (place stays off the schema enum);
//   • "go back" reopens D4 (the engine is a revisable belief) and is hidden once
//     the lead is logged.
//
// Harness: react-dom/client + React.act (no @testing-library/react in repo).
// ============================================================================

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import D5DemandBoard from './D5DemandBoard';
import type { Brief } from '@/types/brief';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLDivElement;
let root: Root;

/** A place lead exactly as page.tsx hands it to D5 after a D4 place pick:
 *  `applyEnginePick('place')` set `facts.entry.resolvedEngine='place'` but NEVER
 *  `copyEngine` (place is off the schema enum). */
const PLACE_BRIEF: Brief = {
  businessType: 'restaurant',
  facts: {
    entry: {
      rawInput: 'neighbourhood ramen bar',
      resolvedEngine: 'place',
      engineStatus: 'confirmed',
      classificationSource: 'user-pick',
      tiebreaker: 'none',
      summary: 'Neighbourhood ramen bar',
      businessName: 'Kanji Ramen',
      categories: ['restaurant'],
      oneLiner: 'Neighbourhood ramen bar',
    },
  },
  confidence: 0.5,
} as unknown as Brief;

const q = <T extends Element>(sel: string) => container.querySelector<T>(sel);
const testid = <T extends Element>(id: string) => q<T>(`[data-testid="${id}"]`);

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function click(el: Element | null) {
  expect(el, 'element to click').not.toBeNull();
  await act(async () => {
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();
}

async function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function mountD5(props: Partial<React.ComponentProps<typeof D5DemandBoard>> = {}) {
  const onGoBack = vi.fn();
  const onLeadCreated = vi.fn();
  act(() => {
    root.render(
      <D5DemandBoard
        rawInput="neighbourhood ramen bar"
        briefDraft={PLACE_BRIEF}
        missing="rungE:place"
        leadId={null}
        onLeadCreated={onLeadCreated}
        onGoBack={onGoBack}
        {...props}
      />
    );
  });
  return { onGoBack, onLeadCreated };
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('D5DemandBoard — the honest storefront', () => {
  it('interpolates the business noun into the headline and shows the rail demand chip', () => {
    mountD5();
    expect(testid('decider-d5')).not.toBeNull();
    expect(testid('decider-d5')?.textContent).toContain(
      'We don’t build restaurant sites yet'
    );
    const chip = testid('rail-engine-demand');
    expect(chip).not.toBeNull();
    expect(chip?.textContent).toContain('DEMAND LOGGED');
    expect(chip?.textContent).toContain('PLACE');
  });

  it('renders NO editable one-liner (the O1 kill holds on D5)', () => {
    mountD5();
    expect(container.querySelector('textarea')).toBeNull();
    expect(testid('d1-entry-input')).toBeNull();
  });
});

describe('D5DemandBoard — demand-lead capture (contract unchanged)', () => {
  it('POSTs /api/demand-lead with the rungE:place tag and NEVER sets copyEngine', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: 'lead_test' }) });
    vi.stubGlobal('fetch', fetchMock);

    const { onLeadCreated } = mountD5();
    await type(testid<HTMLInputElement>('demand-email')!, 'founder@example.com');
    await click(testid('demand-submit'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/demand-lead');
    expect((init as RequestInit).method).toBe('POST');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.input).toBe('neighbourhood ramen bar');
    expect(body.missing).toBe('rungE:place');
    expect(body.email).toBe('founder@example.com');
    // place stays OFF the schema enum — never written to copyEngine.
    expect(body.briefDraft.copyEngine).toBeUndefined();
    // No userId in the body — the route derives it server-side from Clerk.
    expect(body.userId).toBeUndefined();

    expect(onLeadCreated).toHaveBeenCalledWith('lead_test');
  });
});

describe('D5DemandBoard — go back is a revisable-belief escape', () => {
  it('"go back" reopens D4 via the callback', async () => {
    const { onGoBack } = mountD5();
    await click(testid('decider-d5-back'));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it('hides "go back" once a lead has been logged (nothing to revise)', () => {
    mountD5({ leadId: 'lead_test' });
    expect(testid('decider-d5-back')).toBeNull();
    expect(testid('demand-confirmed')).not.toBeNull();
  });
});
