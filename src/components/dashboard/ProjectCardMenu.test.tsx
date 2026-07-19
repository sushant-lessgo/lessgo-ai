// B10 (qa-0719) regression — the Unpublish row rendered the literal text `cloud_off`
// (not an icon) and its "Unpublish" label overflowed the fixed-width menu, because
// the `cloud_off` ligature is absent from the shipped Material Symbols subset font, so
// the browser painted the raw ligature name as text.
//
// This pins the whole subset-drop CLASS: every <AppIcon> glyph rendered in the menu
// must be a name that is present in the shipped subset. If a future edit reaches for a
// glyph that was never subsetted, the browser silently renders its literal name and
// this test goes red.
//
// icons.txt is a LOWER-BOUND proxy, not the authority — the woff2 GSUB table is what
// actually decides which ligatures resolve (see the documented precedent at
// GlobalAppHeader.tsx:230-241). It is still the best static signal we have here, and it
// reliably catches this specific class of miss. NOTE: a line carrying an inline `#`
// comment is a DOCUMENTED-PENDING entry (a want, not yet in the shipped woff2), so it is
// deliberately excluded from the "shipped" set — that is why `cloud_off`, annotated as
// pending, does NOT satisfy this test.
//
// No @testing-library/react in the repo — react-dom/client + React.act, per
// src/app/edit/[token]/components/layout/GlobalAppHeader.menus.test.tsx.

import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/components/ui/ConfirmDialog', () => ({
  confirmDialog: vi.fn(async () => false),
  promptDialog: vi.fn(async () => null),
}));

// Imported after the mocks are registered.
import ProjectCardMenu from './ProjectCardMenu';
import type { ProjectGridItem } from './ProjectGridCard';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

/** Shipped Material Symbols subset — lower-bound proxy (see file header). */
function loadShippedSubset(): Set<string> {
  const txt = readFileSync(
    join(process.cwd(), 'public/fonts/material-symbols-rounded/icons.txt'),
    'utf8'
  );
  const set = new Set<string>();
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    // A `#` anywhere marks the line as a comment / documented-pending entry (not shipped).
    if (line.includes('#')) continue;
    set.add(line);
  }
  return set;
}

/** A PUBLISHED project so the isPublished-gated Unpublish row mounts. */
const PUBLISHED_PROJECT: ProjectGridItem = {
  id: 'proj-1',
  name: 'Acme Site',
  status: 'Published',
  updatedAt: '2026-07-19T00:00:00.000Z',
  tokenId: 'tok-1',
  slug: 'acme',
  type: 'unified',
  publishState: 'published',
  hasCustomDomain: false,
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(<ProjectCardMenu project={PUBLISHED_PROJECT} onOpenEditor={vi.fn()} />)
  );
  // Open the Radix dropdown so its (portalled) content — including the Unpublish row — mounts.
  // Radix's trigger opens on pointerdown (jsdom has no PointerEvent) or the keyboard path;
  // Enter reliably opens it here.
  const trigger = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Project actions"]'
  );
  if (!trigger) throw new Error('no menu trigger');
  act(() => {
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('ProjectCardMenu — B10 glyph subset guard', () => {
  it('every rendered menu glyph is present in the shipped icon subset', () => {
    const subset = loadShippedSubset();
    const glyphs = Array.from(
      document.querySelectorAll<HTMLElement>('.app-icon')
    ).map((n) => n.textContent?.trim() ?? '');

    expect(glyphs.length).toBeGreaterThan(0);
    for (const glyph of glyphs) {
      expect(subset, `glyph "${glyph}" is not in the shipped subset`).toContain(glyph);
    }
  });

  it('renders a full "Unpublish" menu item for a published project', () => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>('[role="menuitem"]')
    );
    const unpublish = items.find((n) => n.textContent?.includes('Unpublish'));
    expect(unpublish, 'Unpublish row should be present').toBeTruthy();
    expect(unpublish?.textContent).toContain('Unpublish');
  });
});
