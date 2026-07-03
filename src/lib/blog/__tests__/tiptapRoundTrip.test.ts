// Blog (Tiptap phase) — SPIKE GATE, kept as the permanent round-trip contract.
// Markdown is canonical: the dashboard's Tiptap editor parses the stored
// markdown and serializes back via tiptap-markdown on every change. This suite
// proves the v3 + tiptap-markdown combo round-trips the whole feature set the
// published renderer supports (CommonMark via react-markdown) — if it breaks on
// an upgrade, the editor is silently eating content. Headless Editor (jsdom).
import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';

// Same extension set as BlogRichTextEditor (v3 StarterKit bundles Link but NOT
// Image — spike finding; images silently drop without the extension).
function roundTrip(markdown: string): string {
  const editor = new Editor({
    extensions: [StarterKit, Image, Markdown],
    content: markdown,
  });
  const out = (editor.storage as any).markdown.getMarkdown();
  editor.destroy();
  return out;
}

describe('tiptap-markdown round-trip (v3 spike gate)', () => {
  it('headings + paragraphs', () => {
    const out = roundTrip('# Title\n\n## Section\n\nSome body text.');
    expect(out).toContain('# Title');
    expect(out).toContain('## Section');
    expect(out).toContain('Some body text.');
  });

  it('bold + italic + inline code', () => {
    const out = roundTrip('Some **bold** and *italic* and `code`.');
    expect(out).toContain('**bold**');
    expect(out).toMatch(/[*_]italic[*_]/);
    expect(out).toContain('`code`');
  });

  it('bullet + ordered lists', () => {
    const out = roundTrip('- one\n- two\n\n1. first\n2. second');
    expect(out).toMatch(/[-*] one/);
    expect(out).toMatch(/[-*] two/);
    expect(out).toContain('1. first');
    expect(out).toContain('2. second');
  });

  it('blockquote + code block + hr', () => {
    const out = roundTrip('> quoted wisdom\n\n```\nconst x = 1;\n```\n\n---');
    expect(out).toContain('> quoted wisdom');
    expect(out).toContain('```');
    expect(out).toContain('const x = 1;');
    expect(out).toMatch(/---|\*\*\*/);
  });

  it('links + images', () => {
    const out = roundTrip('[a link](https://example.com) and ![alt text](https://img.example/x.webp)');
    expect(out).toContain('[a link](https://example.com)');
    expect(out).toContain('![alt text](https://img.example/x.webp)');
  });

  it('raw HTML stays inert (never becomes live markup on the render side)', () => {
    // tiptap-markdown may keep or escape raw HTML; the contract is only that
    // what we STORE still renders inert through react-markdown (which escapes
    // raw HTML — pinned in markdown.test.tsx). So: the round-tripped markdown
    // must not silently DROP the visible text around it.
    const out = roundTrip('before\n\n<script>alert(1)</script>\n\nafter');
    expect(out).toContain('before');
    expect(out).toContain('after');
  });

  it('multi-block document survives intact', () => {
    const doc = '# Post\n\nIntro para.\n\n## Points\n\n- alpha\n- beta\n\n> note\n\nFinal para with [link](https://x.dev).';
    const out = roundTrip(doc);
    expect(out).toContain('# Post');
    expect(out).toContain('- alpha');
    expect(out).toContain('> note');
    expect(out).toContain('[link](https://x.dev)');
  });
});
