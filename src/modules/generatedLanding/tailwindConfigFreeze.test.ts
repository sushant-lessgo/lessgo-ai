// src/modules/generatedLanding/tailwindConfigFreeze.test.ts
// ui-foundation PHASE 1 — root-config FREEZE guard (editor / main-app surface).
//
// The published-css sha256 guard (uiFoundationIsolation.test.tsx) is compiled
// from a STANDALONE config embedded in scripts/buildPublishedCSS.js, so it is
// invariant to root tailwind.config.js — it CANNOT catch a root-config
// existing-key mutation (e.g. someone widening borderRadius.lg while adding
// app-* keys). That mutation would silently shift template rendering on the
// main-app surface (/edit, /preview, /dev/*) and create an editor↔published
// divergence.
//
// This guard resolves the ACTUAL root tailwind.config.js through tailwindcss'
// resolveConfig and asserts the frozen values of the keys the app-foundation
// work must never touch: borderRadius (lg/md/sm), fontSize, fontFamily
// (heading/body). It is coverage-INDEPENDENT (fails on ANY mutation of those
// keys regardless of whether a sampled element consumes them), needs no
// browser/mock server, and is deterministic — complementing (not replacing) the
// e2e computed-style baseline.
//
// Baselines below are the values resolved from the config on 2026-07-16. A
// deliberate future change to any of these keys must update BOTH this baseline
// and the e2e computed-style fixture, with a documented reason.

import { describe, it, expect } from 'vitest';
const resolveConfig = require('tailwindcss/resolveConfig');
const rootConfig = require('../../../tailwind.config.js');

const resolved = resolveConfig(rootConfig);
const theme = resolved.theme as Record<string, any>;

describe('ui-foundation isolation — root tailwind.config.js FREEZE', () => {
  it('borderRadius (esp. lg/md/sm) existing keys are unchanged', () => {
    // Freeze the keys that existed BEFORE ui-foundation via toMatchObject — this
    // fails on any MUTATION or deletion of an existing radius key, while tolerating
    // the additive namespaced `app-*` radius keys that ui-foundation Phase 3 adds
    // (app-ctl/app-input/app-panel/app-card/app-modal/app-pill/app-badge). Same
    // addition-tolerant approach as the fontFamily assertion below (which is why it
    // stayed green after app-sans/mono/hand were added). Do NOT switch this to a
    // whole-object toEqual — that rejects the authorized additions.
    expect(theme.borderRadius).toMatchObject({
      none: '0px',
      sm: 'calc(var(--radius) - 4px)',
      DEFAULT: '0.25rem',
      md: 'calc(var(--radius) - 2px)',
      lg: 'var(--radius)',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    });
  });

  it('fontFamily heading/body is unchanged', () => {
    expect(theme.fontFamily.heading).toEqual(['Inter', 'sans-serif']);
    expect(theme.fontFamily.body).toEqual(['Inter', 'sans-serif']);
  });

  it('fontSize scale is unchanged', () => {
    expect(theme.fontSize).toEqual({
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
      display: 'clamp(3rem, 8vw, 5rem)',
      hero: 'clamp(2.5rem, 6vw, 4rem)',
      h1: 'clamp(2rem, 5vw, 3rem)',
      h2: 'clamp(1.5rem, 3.5vw, 2rem)',
      h3: 'clamp(1.25rem, 2.5vw, 1.5rem)',
      'body-lg': 'clamp(1.125rem, 2vw, 1.25rem)',
      body: 'clamp(1rem, 1.5vw, 1.125rem)',
      'body-sm': 'clamp(0.875rem, 1vw, 1rem)',
      caption: 'clamp(0.75rem, 0.8vw, 0.875rem)',
    });
  });
});
