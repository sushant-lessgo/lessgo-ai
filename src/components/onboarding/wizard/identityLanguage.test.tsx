// src/components/onboarding/wizard/identityLanguage.test.tsx
// language-settings phase 3 — the onboarding SITE-LANGUAGE picker + its durable
// persist, driven through the real component and the real wizard store.
//
// The load-bearing assertion is the ZERO-DIFF one: for an untouched English
// project saveDraft must NEVER BE CALLED from the picker. Call ABSENCE (not an
// empty/benign body) is the contract — `api/saveDraft/route.ts` rebuilds
// `content.onboarding` on every call, so an extra call is not a no-op.
//
// Repo convention: react-dom/client + act, no @testing-library.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWizardStore, buildThingInput, buildTrustInput } from '@/hooks/useWizardStore';
import IdentitySlot from './IdentitySlot';

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type FetchCall = { url: string; body: any };

let container: HTMLDivElement;
let root: Root;
let calls: FetchCall[];

function stubFetch(ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: any) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined });
      return { ok, status: ok ? 200 : 500, json: async () => ({}) } as any;
    })
  );
}

const saveCalls = () => calls.filter((c) => c.url.includes('/api/saveDraft'));

function select(): HTMLSelectElement {
  const el = container.querySelector('#site-language') as HTMLSelectElement | null;
  if (!el) throw new Error('site language picker not rendered');
  return el;
}

/** Pick a locale and flush the persist promise chain. */
async function pick(value: string) {
  await act(async () => {
    const el = select();
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  calls = [];
  stubFetch();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  useWizardStore.getState().reset();
  useWizardStore.setState({
    tokenId: 'tok123',
    engine: 'thing',
    slots: ['identity', 'understanding'] as any,
    currentSlot: 'identity' as any,
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  useWizardStore.getState().reset();
});

function mount() {
  act(() => root.render(<IdentitySlot />));
}

describe('IdentitySlot — site language picker', () => {
  it('renders the picker defaulted to English, offering the closed vocabulary', () => {
    mount();
    expect(select().value).toBe('en');
    const options = Array.from(select().querySelectorAll('option')).map((o) => o.value);
    expect(options).toContain('nl');
    expect(options).toContain('ja');
    // Display names, not raw codes.
    expect(select().textContent).toContain('Nederlands');
  });

  it('ZERO-DIFF: leaving English untouched fires NO saveDraft call at all', async () => {
    mount();
    // Re-selecting the same default is still a change event — and must still not
    // call, because nothing non-English was ever persisted.
    await pick('en');
    expect(useWizardStore.getState().siteLanguage).toBe('en');
    expect(saveCalls()).toHaveLength(0);
    expect(useWizardStore.getState().siteLanguagePersisted).toBe(false);
  });

  it('picking nl persists the EXACT single-locale declaration', async () => {
    mount();
    await pick('nl');

    expect(saveCalls()).toHaveLength(1);
    expect(saveCalls()[0].body).toEqual({
      tokenId: 'tok123',
      // Mirrors the store's own `save()` — the route REWRITES
      // content.onboarding.stepIndex on every call, so the current slot index is
      // sent rather than letting it default to 0.
      stepIndex: 0,
      localeConfig: { locales: ['nl'], defaultLocale: 'nl' },
    });
    expect(useWizardStore.getState().siteLanguage).toBe('nl');
    expect(useWizardStore.getState().siteLanguagePersisted).toBe(true);
  });

  it('reverting nl → en sends an EXPLICIT null clear (never omission)', async () => {
    mount();
    await pick('nl');
    expect(useWizardStore.getState().siteLanguagePersisted).toBe(true);

    await pick('en');
    expect(saveCalls()).toHaveLength(2);
    expect(saveCalls()[1].body).toHaveProperty('localeConfig', null);
    expect(useWizardStore.getState().siteLanguage).toBe('en');
    expect(useWizardStore.getState().siteLanguagePersisted).toBe(false);

    // …and a SECOND en pick after the clear is a no-op again (no third call).
    await pick('en');
    expect(saveCalls()).toHaveLength(2);
  });

  it('sends the CURRENT slot index, not a hardcoded 0', async () => {
    act(() => {
      useWizardStore.setState({ currentSlot: 'understanding' as any });
    });
    mount();
    await pick('de');
    expect(saveCalls()).toHaveLength(1);
    expect(saveCalls()[0].body.stepIndex).toBe(1);
  });

  it('no token ⇒ no call (nothing to persist against)', async () => {
    act(() => {
      useWizardStore.setState({ tokenId: null });
    });
    mount();
    await pick('nl');
    expect(saveCalls()).toHaveLength(0);
  });

  it('a failed save leaves the project UNMARKED so the next pick retries', async () => {
    stubFetch(false);
    mount();
    await pick('nl');
    expect(saveCalls()).toHaveLength(1);
    expect(useWizardStore.getState().siteLanguagePersisted).toBe(false);
  });
});

// language-settings phase 5 — the engine gate. Work-engine projects (granth /
// writer) DO render WizardShell (only isWorkCopyTemplate templates take the
// journey), but work first-gen never reads `siteLanguage` — so showing the picker
// there would be a control that looks functional and isn't.
describe('IdentitySlot — the picker is engine-gated (no fake control on work)', () => {
  it('work engine ⇒ the picker is NOT rendered', () => {
    act(() => {
      useWizardStore.setState({ engine: 'work' as any });
    });
    mount();
    expect(container.querySelector('#site-language')).toBeNull();
  });

  it('thing / trust / an unresolved engine ⇒ the picker IS rendered', () => {
    for (const engine of ['thing', 'trust', null]) {
      act(() => {
        useWizardStore.setState({ engine: engine as any });
      });
      mount();
      expect(container.querySelector('#site-language')).not.toBeNull();
    }
  });
});

describe('site language reaches the generation projections', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });
  afterEach(() => {
    useWizardStore.getState().reset();
  });

  it('buildThingInput / buildTrustInput forward the picked code', () => {
    useWizardStore.setState({ tokenId: 'tok123', siteLanguage: 'nl' });
    const s = useWizardStore.getState();
    expect(buildThingInput(s).siteLanguage).toBe('nl');
    expect(buildTrustInput(s).siteLanguage).toBe('nl');
  });

  it('default English is forwarded as "en" (never undefined)', () => {
    const s = useWizardStore.getState();
    expect(buildThingInput(s).siteLanguage).toBe('en');
    expect(buildTrustInput(s).siteLanguage).toBe('en');
  });
});
