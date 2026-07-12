// scripts/generateDesignKit.ts
// template-factory phase 4 — thin CLI over src/modules/engines/designKit.ts.
// Emits the derived design-kit markdown for a copy engine to stdout, or to a
// file with --out. Outputs are DERIVED and NOT committed — regenerate on demand.
//
// Usage:
//   npm run kit:generate -- --engine=thing
//   npx tsx scripts/generateDesignKit.ts --engine=trust
//   npx tsx scripts/generateDesignKit.ts --engine=work --out=kit-work.md
//   npx tsx scripts/generateDesignKit.ts --all --out=./kits   # one file per engine into a dir
//   npx tsx scripts/generateDesignKit.ts                      # all engines → stdout

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { copyEngines, type CopyEngine } from '@/types/brief';
import { buildDesignKit, renderDesignKitMarkdown } from '@/modules/engines/designKit';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

function main(): void {
  const engineArg = arg('engine');
  const out = arg('out');
  const all = process.argv.includes('--all') || (!engineArg && !out);

  const engines: CopyEngine[] = engineArg
    ? (() => {
        if (!copyEngines.includes(engineArg as CopyEngine)) {
          console.error(`Unknown engine "${engineArg}". Valid: ${copyEngines.join(', ')}`);
          process.exit(1);
        }
        return [engineArg as CopyEngine];
      })()
    : all
    ? [...copyEngines]
    : [...copyEngines];

  if (out && engines.length > 1) {
    // --out with multiple engines → treat out as a directory, one file each.
    mkdirSync(out, { recursive: true });
    for (const engine of engines) {
      const md = renderDesignKitMarkdown(buildDesignKit(engine));
      const path = join(out, `designKit.${engine}.md`);
      writeFileSync(path, md, 'utf8');
      console.error(`wrote ${path}`);
    }
    return;
  }

  const md = engines.map((e) => renderDesignKitMarkdown(buildDesignKit(e))).join('\n\n---\n\n');

  if (out) {
    writeFileSync(out, md, 'utf8');
    console.error(`wrote ${out}`);
  } else {
    process.stdout.write(md + '\n');
  }
}

main();
