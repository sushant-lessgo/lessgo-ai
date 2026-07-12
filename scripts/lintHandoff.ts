// scripts/lintHandoff.ts
// template-factory phase 5 — thin CLI over src/modules/templates/handoffLint.ts.
// Lints a designer's single self-contained HTML handoff against a copy engine's
// contract BEFORE it is ported into a template pair. Exit 0 = pass, 1 = findings.
//
// Usage:
//   npm run kit:lint -- <file.html> --engine=thing
//   npx tsx scripts/lintHandoff.ts <file.html> --engine=trust
//   npx tsx scripts/lintHandoff.ts <file.html>          # defaults to --engine=thing

import { readFileSync } from 'fs';
import { copyEngines, type CopyEngine } from '@/types/brief';
import { lintHandoff, formatLintResult } from '@/modules/templates/handoffLint';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

function main(): void {
  const file = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('Usage: kit:lint -- <file.html> [--engine=thing|trust|work]');
    process.exit(2);
  }

  const engineArg = arg('engine') ?? 'thing';
  if (!copyEngines.includes(engineArg as CopyEngine)) {
    console.error(`Unknown engine "${engineArg}". Valid: ${copyEngines.join(', ')}`);
    process.exit(2);
  }

  let html: string;
  try {
    html = readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`Cannot read ${file}: ${(e as Error).message}`);
    process.exit(2);
    return;
  }

  const result = lintHandoff(html, engineArg as CopyEngine);
  console.log(formatLintResult(result, file));
  process.exit(result.ok ? 0 : 1);
}

main();
