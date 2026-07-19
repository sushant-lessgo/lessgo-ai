// B9 (qa-0719) — brand logo regression pin.
//
// The shared <Logo> used to render the OLD boxed `/logo.svg` (baked-in grey box)
// at a SQUARE size, distorting the wide wordmark everywhere it appeared (editor
// chrome, onboarding, marketing header). The qa-0718 fix only corrected the
// dashboard sidebar's inline copy. This locks the shared component to the
// transparent wordmark `/lessgo-logo.png` so it can never regress to logo.svg.
//
// Harness: react-dom/client + React.act (no @testing-library in repo).

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Logo from './Logo';

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('shared Logo (B9)', () => {
  it('renders the transparent Lessgo AI wordmark, not the boxed logo.svg', () => {
    act(() => {
      root.render(<Logo />);
    });

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('alt')).toBe('Lessgo AI');

    const src = img!.getAttribute('src') ?? '';
    expect(src).toContain('lessgo-logo');
    expect(src).not.toContain('logo.svg');
  });
});
