// EditablePageRenderer — per-section background override (section-background phase 1).
//
// WHY THIS FILE EXISTS: `renderParity.work.test.tsx` mounts work blocks via
// `resolveWorkBlock` and never runs a WRAPPER-emitting renderer, so it structurally
// cannot prove that the EDIT route paints the override. This is the dual-renderer
// tripwire for the edit side (the published side is proven string-level in
// `src/lib/staticExport/htmlGenerator.test.ts`).
//
// Store is REAL (`createEditStore`); only the template MODULE + component registry
// are stubbed — mounting the real atelier module drags an async dynamic import and
// the whole block tree into jsdom for an assertion that is entirely about the
// wrapper attribute. The stub's `getSurfaceForSection` returns the skeleton
// defaults, so a regression in the resolver (or a dropped selector) fails here.

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useStore } from 'zustand';
import { createEditStore, type EditStoreInstance } from '@/stores/editStore';
import type { EditStore } from '@/types/store';

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let store: EditStoreInstance;

vi.mock('@/hooks/useEditStore', () => ({
  useEditStore: <T,>(selector: (s: EditStore) => T) => useStore(store, selector),
  useEditStoreApi: () => store,
}));

// Stub template module: `getSurfaceForSection` stands in for the skin's type-keyed
// default (the exact VALUES don't matter — what matters is which channel wins).
// Nothing else of the template module is exercised here.
vi.mock('@/modules/templates/useTemplateReady', () => ({
  useTemplateModule: () => ({
    ready: true,
    tmpl: {
      getSurfaceForSection: (type: string) => (type === 'about' ? 'paper-2' : 'paper'),
    },
  }),
}));

vi.mock('@/modules/generatedLanding/componentRegistry', () => ({
  getComponent: () => function StubBlock() { return <div data-testid="stub-block" />; },
  extractSectionType: (id: string) => String(id).split('-')[0],
}));

import { EditablePageRenderer } from './EditablePageRenderer';

const HERO_A = 'hero-aaa11111';
const HERO_B = 'hero-bbb22222';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  store = createEditStore(`surface-${Math.random()}`);
  act(() => {
    store.setState((s: any) => {
      s.audienceType = 'service';
      s.templateId = 'atelier';
    });
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = '';
});

function mountSections(ids: string[]) {
  act(() => {
    root.render(
      <>
        {ids.map((id) => (
          <EditablePageRenderer
            key={id}
            sectionId={id}
            sectionData={{ elements: {} }}
            layout="workheroslider"
            mode="edit"
            isSelected={false}
            colorTokens={{}}
            globalSettings={{}}
          />
        ))}
      </>,
    );
  });
}

function surfaceOf(sectionId: string): string | null {
  const el = container.querySelector(`[data-section-root="${sectionId}"]`);
  if (!el) throw new Error(`no wrapper rendered for ${sectionId}`);
  return el.getAttribute('data-surface');
}

describe('EditablePageRenderer — data-surface override', () => {
  it('uses the skin default when no override is stored', () => {
    mountSections([HERO_A, HERO_B]);
    expect(surfaceOf(HERO_A)).toBe('paper');
    expect(surfaceOf(HERO_B)).toBe('paper');
  });

  it('paints the id-keyed override on that ONE section, with no bleed', () => {
    act(() => {
      store.setState((s: any) => {
        s.themeValues = { ...(s.themeValues ?? {}), styleTokens: { [HERO_A]: { background: 'dark' } } };
      });
    });
    mountSections([HERO_A, HERO_B]);
    expect(surfaceOf(HERO_A)).toBe('dark');
    expect(surfaceOf(HERO_B)).toBe('paper');
  });

  it('reacts to the store writer (setSectionStyleTokens) without a remount', () => {
    // Fake timers: the action flushes through triggerAutoSave, which schedules a
    // 2s debounced save() — we don't want that stray timer/fetch after teardown.
    vi.useFakeTimers();
    try {
      mountSections([HERO_A, HERO_B]);
      expect(surfaceOf(HERO_A)).toBe('paper');
      act(() => {
        store.getState().setSectionStyleTokens(HERO_A, { background: 'paper-2' });
      });
      expect(surfaceOf(HERO_A)).toBe('paper-2');
      expect(surfaceOf(HERO_B)).toBe('paper');
      // The write MERGES: sibling themeValues keys and other sections survive.
      const tv = (store.getState() as any).themeValues;
      expect(tv.styleTokens[HERO_A]).toEqual({ background: 'paper-2' });
      expect(tv.styleTokens[HERO_B]).toBeUndefined();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('setSectionStyleTokens preserves other themeValues keys and other sections', () => {
    vi.useFakeTimers();
    try {
      act(() => {
        store.setState((s: any) => {
          s.themeValues = { mood: 'bone', styleTokens: { [HERO_B]: { background: 'dark' } } };
        });
      });
      act(() => {
        store.getState().setSectionStyleTokens(HERO_A, { background: 'paper-2' });
      });
      act(() => {
        store.getState().setSectionStyleTokens(HERO_A, { corners: 'soft' });
      });
      const tv = (store.getState() as any).themeValues;
      expect(tv.mood).toBe('bone');
      expect(tv.styleTokens[HERO_B]).toEqual({ background: 'dark' });
      // patch DEEP-merges into the existing section entry
      expect(tv.styleTokens[HERO_A]).toEqual({ background: 'paper-2', corners: 'soft' });
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('ignores the override for a non-skeleton template (template-switch leak)', () => {
    act(() => {
      store.setState((s: any) => {
        s.templateId = 'hearth';
        s.themeValues = { styleTokens: { [HERO_A]: { background: 'dark' } } };
      });
    });
    mountSections([HERO_A]);
    expect(surfaceOf(HERO_A)).toBe('paper');
  });
});
