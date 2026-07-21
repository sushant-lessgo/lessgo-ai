import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
describe('B4: preview must not leak edit affordances', () => {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
  it('pointer-cursor on [data-element-key] is edit-mode-scoped', () => {
    const blocks = [...css.matchAll(/([^{}]*\[data-element-key\][^{]*)\{[^}]*cursor:\s*pointer/g)];
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) expect(b[1]).toMatch(/\.edit-mode\b/);
  });
});
