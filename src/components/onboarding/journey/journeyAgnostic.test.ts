// ============================================================================
// AGNOSTIC-PURITY + FIREWALL GUARD (work-onboarding-shell P2b).
//
// Two halves, HONESTLY WEIGHTED — do not confuse them:
//
//  (a) IMPORT-GRAPH ASSERTIONS — load-bearing and reliable. The shell must not
//      import an engine's modules, and neither the seams nor the work resume
//      rules may STATICALLY import the generation/template graph (landmine 14:
//      seams load PRE-CONFIRM on the entry page, so one static edge there puts
//      the whole generation bundle on the STEP-01 path). The seam scan is a
//      1-HOP CLOSURE (`SEAM_CLOSURE`): a seam's own `@/`-local static imports
//      are on the same entry path and are banned from the same graph.
//
//  (b) LITERAL TRIPWIRE — NOT a proof. Trivially bypassed and scoped narrowly;
//      it only catches the obvious "hardcode a templateId in the shell" slip.
//      The ruling itself is enforced by (a) + review.
//
// ── WHY THIS PARSES IMPORTS INSTEAD OF GREPPING SOURCE ──────────────────────
// A naive raw-text scan for '@/modules/wizard/generation' FALSE-POSITIVES
// immediately: `engines/work.ts`'s own firewall header names that path in PROSE
// (as the thing it must never import). A guard that fires on its own
// documentation gets deleted, not obeyed. So we extract STATIC import
// specifiers and assert over those.
//
// This also encodes the real rule precisely: a DYNAMIC `await import('…')` of
// the generation driver is not merely tolerated, it is MANDATORY (that is how
// `runGeneration`/`resolveResumeStep` reach their drivers). Only static edges
// are the bug — and only static edges are matched below.
//
// The `'work'` string is deliberately NOT scanned: it false-positives on
// `data-testid="step-show-work"`, on `showWork`, and on comments, and any real
// check is trivially evaded. Scanning it would only add noise.
// ============================================================================

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { templateIds } from '@/types/service';

const JOURNEY_DIR = path.resolve(__dirname);
const REPO_SRC = path.resolve(__dirname, '../../..');

/**
 * Extract the module specifiers of STATIC `import`/`export … from` statements.
 *
 * Deliberately does NOT match:
 *   • dynamic `await import('x')` — the sanctioned lazy escape hatch;
 *   • strings in comments or prose (the header-comment false positive above);
 *   • `export const X = 'y'` (no `from`, and the quote never directly follows
 *     the keyword).
 * Handles multi-line import clauses: the middle is bounded to characters that
 * cannot appear before `from` in one (no quotes, no `;`).
 */
function staticImports(source: string): { spec: string; typeOnly: boolean }[] {
  const re =
    /(?:^|\n)[ \t]*(?:import|export)\b([ \t]+type\b)?(?:[^'";]*?\bfrom[ \t]*)?['"]([^'"]+)['"]/g;
  const found: { spec: string; typeOnly: boolean }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) found.push({ spec: m[2], typeOnly: Boolean(m[1]) });
  return found;
}

function staticImportSpecifiers(source: string): string[] {
  return staticImports(source).map((i) => i.spec);
}

/**
 * The specifiers that survive compilation — i.e. the REAL bundle edges.
 *
 * `import type { X } from 'y'` is fully ERASED by TypeScript: it is not an edge
 * and cannot put anything on the entry bundle. This distinction is load-bearing
 * for the 1-hop closure, not pedantry: `engines/types.ts` legitimately does
 * `import type { WizardStore } from '@/hooks/useWizardStore'`, and that module
 * type-imports `@/modules/wizard/generation/{thing,trust,work}` for its input
 * contracts. Banning erased imports would fail the guard on code that adds ZERO
 * bytes to the entry path — and a guard that cries wolf gets deleted.
 * (`import { type A, B } from 'y'` is NOT type-only: `B` is a real edge.)
 */
function valueImportSpecifiers(source: string): string[] {
  return staticImports(source)
    .filter((i) => !i.typeOnly)
    .map((i) => i.spec);
}

function listFiles(dir: string, predicate: (f: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isFile())
    .filter(predicate)
    .map((f) => path.join(dir, f));
}

const isTestFile = (f: string) => /\.test\.tsx?$/.test(f);

/**
 * Resolve a `@/…` specifier to a file under `src/`. `null` for anything that
 * does not resolve to a real file (non-`@/` specifiers, packages, directories
 * without an index). Non-resolution is silently skipped: the closure is a
 * best-effort WIDENING of the scan, never its only assertion — `SEAM_CLOSURE`'s
 * non-vacuity is pinned by an explicit `rail.ts` membership test below.
 */
function resolveAlias(spec: string): string | null {
  if (!spec.startsWith('@/')) return null;
  const base = path.resolve(REPO_SRC, spec.slice(2));
  for (const cand of [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
  }
  return null;
}

/** The AGNOSTIC shell: journey/*.tsx + journey/steps/* (never engines/). */
const SHELL_FILES = [
  ...listFiles(JOURNEY_DIR, (f) => f.endsWith('.tsx') && !isTestFile(f)),
  ...listFiles(path.join(JOURNEY_DIR, 'steps'), (f) => !isTestFile(f)),
];

/** The SEAMS + the pure module a seam statically imports (rev-5 NB1). */
const SEAM_FILES = [
  ...listFiles(path.join(JOURNEY_DIR, 'engines'), (f) => f.endsWith('.ts') && !isTestFile(f)),
  path.resolve(REPO_SRC, 'modules/wizard/work/resumeStep.ts'),
];

const rel = (f: string) => path.relative(REPO_SRC, f).replace(/\\/g, '/');
const read = (f: string) => fs.readFileSync(f, 'utf8');

/**
 * SEAM_FILES **plus one hop** of their own `@/`-local static imports.
 *
 * WHY (P2b follow-up): a direct-imports-only scan is NOT TRANSITIVE, and the
 * bypass was live. `engines/work.ts` statically imports
 * `@/modules/wizard/work/rail.ts`, which SEAM_FILES never scanned — so a
 * generation/template import added to `rail.ts` poisons the STEP-01 entry bundle
 * exactly as one in `resumeStep.ts` would, with the guard silent. P3 edits the
 * rail adapter, so that edge goes live next phase.
 *
 * ONE hop, not a full closure: it covers every module a seam actually pulls onto
 * the pre-confirm path directly (the real risk surface), stays fast, and stays
 * readable. Deeper edges are review's job — and any deeper module reached from a
 * seam-adjacent file is itself a hop-1 of that file the day it is added to a seam.
 *
 * Only VALUE imports are followed: a type-only edge puts nothing on the bundle,
 * so the module behind it is not on the entry path (see `valueImportSpecifiers`).
 */
const SEAM_CLOSURE: string[] = (() => {
  const set = new Map<string, string>(SEAM_FILES.map((f) => [f, f]));
  for (const file of SEAM_FILES) {
    for (const spec of valueImportSpecifiers(read(file))) {
      const resolved = resolveAlias(spec);
      if (resolved && !set.has(resolved)) set.set(resolved, resolved);
    }
  }
  return [...set.keys()];
})();

const GENERATION_GRAPH = [/^@\/modules\/wizard\/generation\//, /^@\/modules\/generation\//];
const WORK_ENGINE_MODULES = [/^@\/modules\/wizard\/work\//];

describe('journey shell — agnostic-purity guard (a: import graph)', () => {
  it('finds the shell files it claims to guard (a passing empty scan is not a pass)', () => {
    expect(SHELL_FILES.length).toBeGreaterThanOrEqual(6); // shell + top bar + entry + 5 steps
    expect(SEAM_FILES.length).toBeGreaterThanOrEqual(3); // types + registry + work + resumeStep
    for (const f of SEAM_FILES) expect(fs.existsSync(f), `missing: ${rel(f)}`).toBe(true);
  });

  it('the shell never imports an ENGINE module (engine identity lives only in the seam)', () => {
    for (const file of SHELL_FILES) {
      for (const spec of staticImportSpecifiers(read(file))) {
        for (const banned of WORK_ENGINE_MODULES) {
          expect(
            banned.test(spec),
            `${rel(file)} statically imports "${spec}" — engine-specific code must be reached through the seam (loadJourneySeam), not imported.`
          ).toBe(false);
        }
      }
    }
  });

  it('the shell never imports the GENERATION graph', () => {
    for (const file of SHELL_FILES) {
      for (const spec of staticImportSpecifiers(read(file))) {
        for (const banned of GENERATION_GRAPH) {
          expect(
            banned.test(spec),
            `${rel(file)} statically imports "${spec}" — the shell owns UI + state routing only; the seam owns the drive.`
          ).toBe(false);
        }
      }
    }
  });
});

describe('journey seams — entry-bundle firewall (landmine 14, rev-5 NB1)', () => {
  // The one live edge this closes: `isResumableGeneration` lives in
  // `@/modules/generation/multiPageAssembly`, whose module top pulls
  // selectProductBlocks + collections/registry + editStore archetypes. The plan
  // mandates a LAZY import for it — this is what makes the mandate mechanical.
  // `engines/work.ts` statically imports `resumeStep.ts`, and the seam loads
  // pre-confirm, so a careless static import THERE silently re-drags the whole
  // template+generation graph onto the STEP-01 entry bundle.
  it('the scan reaches ONE HOP past the seams (the rail edge P3 opens)', () => {
    // Non-vacuity pin for SEAM_CLOSURE. `engines/work.ts` imports `rail.ts`, so
    // `rail.ts` MUST be scanned — if this fails, the closure silently degraded
    // back to direct-imports-only and the rail bypass is open again.
    const railFile = path.resolve(REPO_SRC, 'modules/wizard/work/rail.ts');
    expect(
      SEAM_CLOSURE.includes(railFile),
      `rail.ts is not in the scanned set (${SEAM_CLOSURE.map(rel).join(', ')}) — the 1-hop closure is not resolving seam imports.`
    ).toBe(true);
    expect(SEAM_CLOSURE.length).toBeGreaterThan(SEAM_FILES.length);
  });

  it('no seam — nor anything ONE HOP inside it — statically imports the generation graph', () => {
    for (const file of SEAM_CLOSURE) {
      for (const spec of valueImportSpecifiers(read(file))) {
        for (const banned of GENERATION_GRAPH) {
          expect(
            banned.test(spec),
            `${rel(file)} statically imports "${spec}". Seams load PRE-CONFIRM on the entry page — reach generation with a LAZY \`await import(…)\` inside the function instead.`
          ).toBe(false);
        }
      }
    }
  });

  it('recognises a lazy `await import()` of the driver as legal (the mandated pattern)', () => {
    // Pins the guard's own semantics: if this ever fails, the matcher has
    // started flagging dynamic imports and P5 cannot wire generation at all.
    const lazy = `
      export async function run() {
        const { runWorkLLMGeneration } = await import('@/modules/wizard/generation/work.llm');
        return runWorkLLMGeneration();
      }
    `;
    expect(staticImportSpecifiers(lazy)).toEqual([]);
  });

  it('does not fire on a path merely NAMED in a comment (the header false-positive)', () => {
    // engines/work.ts documents the banned path in prose. A raw-text scan would
    // fail on its own documentation.
    const prose = `
      // NEVER import '@/modules/wizard/generation/work.llm' here — see landmine 14.
      /* also not @/modules/generation/multiPageAssembly */
      import type { Brief } from '@/types/brief';
    `;
    expect(staticImportSpecifiers(prose)).toEqual(['@/types/brief']);
  });

  it('DOES fire on a real static import (the guard is not vacuous)', () => {
    const bad = `import { isResumableGeneration } from '@/modules/generation/multiPageAssembly';`;
    const specs = staticImportSpecifiers(bad);
    expect(specs).toEqual(['@/modules/generation/multiPageAssembly']);
    expect(GENERATION_GRAPH.some((r) => r.test(specs[0]))).toBe(true);
  });

  it('treats `import type` as erased, but `import { type A, B }` as a real edge', () => {
    // Pins the closure's own semantics. If type-only imports ever start counting
    // as edges, the guard fails on `engines/types.ts` → `useWizardStore` →
    // `@/modules/wizard/generation/*` type-contracts, which cost zero bytes.
    const src = `
      import type { WizardStore } from '@/hooks/useWizardStore';
      export type { A } from '@/modules/generation/multiPageAssembly';
      import { type Opts, run } from '@/modules/wizard/generation/work';
    `;
    expect(valueImportSpecifiers(src)).toEqual(['@/modules/wizard/generation/work']);
    expect(staticImportSpecifiers(src)).toHaveLength(3);
  });

  it('parses multi-line import clauses and `export … from`', () => {
    const src = `
      import {
        a,
        b,
      } from '@/modules/generation/multiPageAssembly';
      export { c } from './types';
      export const FIELD = 'not-an-import';
    `;
    expect(staticImportSpecifiers(src)).toEqual([
      '@/modules/generation/multiPageAssembly',
      './types',
    ]);
  });
});

describe('journey shell — templateId literal TRIPWIRE (b: NOT a proof)', () => {
  it('no templateId literal appears in the agnostic shell', () => {
    for (const file of SHELL_FILES) {
      const source = read(file);
      for (const tid of templateIds) {
        // Quoted forms only — a bare substring match false-positives (e.g. `lex`
        // inside `flex`). This is a tripwire for the obvious slip, nothing more.
        expect(
          new RegExp(`['"\`]${tid}['"\`]`).test(source),
          `${rel(file)} contains the templateId literal "${tid}" — template gating belongs in the eligibility leaf (src/lib/journeyEngines.ts) or the seam.`
        ).toBe(false);
      }
    }
  });
});
