// src/modules/templates/skinPurity.test.ts
// NET-NEW conformance (work-skeleton phase 7, AC L121/L122): a SKIN dir is DATA
// ONLY. The skeleton owns ALL markup; a skin (compile-time id barrel) supplies
// tokens/palettes/selections and NOTHING that renders. This test enforces that for
// EVERY id in `skeletonBackedTemplateIds`:
//   1. the skin dir contains ONLY the whitelist {index.ts, skin.ts},
//   2. it has ZERO `.tsx` files,
//   3. neither file carries markup/component code ('use client', a React import, or
//      React.createElement) — it is pure data,
//   4. the registered skin passes `assertSkinTokens` (in-range), AND
//   5. an OUT-OF-BOUNDS fixture skin FAILS LOUD (AC L122).
//
// The purity predicate is a PURE function tested BOTH ways (a synthetic dir with a
// `.tsx`/markup file MUST fail it) so the check provably BITES rather than passing
// vacuously.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { skeletonBackedTemplateIds } from '@/modules/skeletons/ids';
import { assertSkinTokens, type WorkSkinTokens } from '@/modules/skeletons/work/tokenContract';
import { atelierSkin } from './atelier/skin';

const TEMPLATES_DIR = __dirname;

// atelier-skeleton-cutover: the old hand-written `templates/atelier/` skin was
// deleted and the data-only skeleton barrel folded into `templates/atelier/` — so
// the skeleton-backed id `atelier` now maps directly to its own dir name.

// id → registered skin data (assertSkinTokens gate). Grows as work skins are added.
const REGISTERED_SKINS: Record<string, { id?: string; tokens: WorkSkinTokens }> = {
  atelier: atelierSkin,
};

const FILE_WHITELIST = new Set(['index.ts', 'skin.ts']);

/** Files in a skin dir that violate the whitelist / no-.tsx rule. */
function fileViolations(files: string[]): string[] {
  const v: string[] = [];
  for (const f of files) {
    if (f.endsWith('.tsx')) v.push(`markup file not allowed in a skin dir: "${f}" (.tsx)`);
    else if (!FILE_WHITELIST.has(f)) v.push(`file outside the {index.ts, skin.ts} whitelist: "${f}"`);
  }
  return v;
}

/** Markup/component tokens forbidden in a data-only skin file. */
function markupViolations(fileName: string, src: string): string[] {
  const v: string[] = [];
  // strip line comments so a comment mentioning "React.createElement" can't trip it.
  const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  if (/^\s*['"]use client['"]/m.test(src)) v.push(`${fileName}: carries a 'use client' directive`);
  if (/\bReact\.createElement\s*\(/.test(code)) v.push(`${fileName}: calls React.createElement (markup)`);
  if (/from\s+['"]react['"]/.test(code)) v.push(`${fileName}: imports from 'react' (a data skin must not)`);
  if (/import\s+React\b/.test(code)) v.push(`${fileName}: imports the React default (a data skin must not)`);
  return v;
}

/** Full purity violation list for a skin dir path (empty === pure). */
function purityViolations(dir: string): string[] {
  if (!fs.existsSync(dir)) return [`skin dir does not exist: ${dir}`];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const v: string[] = [];
  const names = files.filter((f) => f.isFile()).map((f) => f.name);
  for (const sub of files.filter((f) => f.isDirectory())) {
    v.push(`skin dir must be flat data — unexpected subdirectory "${sub.name}"`);
  }
  v.push(...fileViolations(names));
  for (const name of names) {
    if (name.endsWith('.ts')) {
      v.push(...markupViolations(name, fs.readFileSync(path.join(dir, name), 'utf8')));
    }
  }
  return v;
}

describe('skin file-purity conformance (work-skeleton, AC L121)', () => {
  it('there is at least one skeleton-backed skin to check (not vacuous)', () => {
    expect(skeletonBackedTemplateIds.length).toBeGreaterThan(0);
  });

  for (const id of skeletonBackedTemplateIds) {
    const skinDirName = id;
    describe(`skin "${id}" (src/modules/templates/${skinDirName}/)`, () => {
      const dir = path.join(TEMPLATES_DIR, skinDirName);

      it('is a data-only dir: ONLY {index.ts, skin.ts}, zero .tsx, zero markup exports', () => {
        expect(purityViolations(dir), purityViolations(dir).join('\n')).toEqual([]);
      });

      it('contains exactly the whitelisted files', () => {
        const names = fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((f) => f.isFile())
          .map((f) => f.name)
          .sort();
        expect(names).toEqual(['index.ts', 'skin.ts']);
      });

      it('has a registered skin whose tokens pass assertSkinTokens (in-range)', () => {
        const skin = REGISTERED_SKINS[id];
        expect(skin, `no registered skin data for "${id}"`).toBeTruthy();
        expect(() => assertSkinTokens(skin)).not.toThrow();
      });
    });
  }

  // ── The scan must BITE (pure-predicate red-team, no repo writes) ────────────
  describe('purity predicate provably bites (negative fixtures)', () => {
    it('flags a .tsx file added to a skin dir', () => {
      expect(fileViolations(['index.ts', 'skin.ts', 'ThemeInjector.tsx'])).not.toEqual([]);
      expect(fileViolations(['index.ts', 'skin.ts', 'ThemeInjector.tsx'])[0]).toMatch(/\.tsx/);
    });

    it('flags a file outside the {index.ts, skin.ts} whitelist', () => {
      expect(fileViolations(['index.ts', 'skin.ts', 'palettes.ts'])).toEqual([
        'file outside the {index.ts, skin.ts} whitelist: "palettes.ts"',
      ]);
    });

    it('flags a data file that smuggles in markup/component code', () => {
      expect(markupViolations('skin.ts', `'use client';\nexport const x = 1;`)).not.toEqual([]);
      expect(markupViolations('index.ts', `import React from 'react';\nexport const C = () => null;`)).not.toEqual([]);
      expect(
        markupViolations('index.ts', `export const C = () => React.createElement('div');`),
      ).not.toEqual([]);
    });

    it('passes a genuinely pure data file', () => {
      expect(
        markupViolations('skin.ts', `import type { WorkSkinDef } from '@/x';\nexport const s: WorkSkinDef = { id: 'x' } as any;`),
      ).toEqual([]);
    });
  });

  // ── BOUNDS red-team (AC L122: out-of-range fails loud) — mirrors conformance ─
  describe('assertSkinTokens fails loud on an out-of-bounds skin (AC L122)', () => {
    it('an out-of-range token throws with the token + "out of range" listed', () => {
      const bad: WorkSkinTokens = { ...atelierSkin.tokens, secPadYPx: 5000 };
      expect(() => assertSkinTokens({ id: 'oob', tokens: bad })).toThrow(/secPadYPx/);
      expect(() => assertSkinTokens({ id: 'oob', tokens: bad })).toThrow(/out of range/);
    });
  });
});
