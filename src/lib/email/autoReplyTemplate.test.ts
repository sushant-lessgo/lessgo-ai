// Tests for the pure auto-reply template module (lead-emails, review round).
//
// Two jobs:
//  1. renderAutoReply must not honour `$`-replacement patterns coming from the
//     SUBSTITUTED value (`$&`, "$`", `$'`, `$$`) — review fix 4.
//  2. autoReplyTemplate.ts must stay IMPORT-FREE — review fix 5. It is imported by
//     FormBuilder.tsx ('use client'); an import of Sentry/logger/fetch/prisma here
//     would drag server code into the client bundle. Until now that invariant was
//     guarded only by a comment.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_AUTO_REPLY_BODY,
  renderAutoReply,
  sanitizeNameToken,
} from './autoReplyTemplate';

describe('renderAutoReply — replacement-pattern safety (review fix 4)', () => {
  it('treats "$&" in a name as literal text, not as the matched token', () => {
    // `$&` means "the matched substring" to String.replace with a STRING
    // replacement — i.e. the literal text "{name}" would be re-emitted into the
    // visitor's email. A replacer function must make it inert.
    const name = sanitizeNameToken('$&');
    expect(name).toBe('$&'); // the sanitizer does not (and need not) strip `$`

    const out = renderAutoReply(DEFAULT_AUTO_REPLY_BODY, { name, business: 'Acme' });

    expect(out).toContain('Thanks $&');
    expect(out).not.toContain('{name}');
  });

  it.each([
    ['$&', 'Thanks $& — Acme received your message and will reply soon.'],
    ['$$', 'Thanks $$ — Acme received your message and will reply soon.'],
    ["$'", "Thanks $' — Acme received your message and will reply soon."],
    ['$`', 'Thanks $` — Acme received your message and will reply soon.'],
    ['$1', 'Thanks $1 — Acme received your message and will reply soon.'],
  ])('emits %s verbatim', (raw, expected) => {
    // Bypass the sanitizer on purpose: renderAutoReply must be safe on its own,
    // not only because sanitizeNameToken happens to delete backticks/quotes today.
    const out = renderAutoReply(DEFAULT_AUTO_REPLY_BODY, { name: raw, business: 'Acme' });
    expect(out).toBe(expected);
  });

  it('is also safe for the {business} token', () => {
    const out = renderAutoReply('Hi from {business}.', { name: '', business: '$&' });
    expect(out).toBe('Hi from $&.');
    expect(out).not.toContain('{business}');
  });
});

describe('autoReplyTemplate module — zero-import invariant (review fix 5)', () => {
  // vitest's root is the repo root (import.meta.url is not a file: URL here).
  const source = readFileSync(
    resolve(process.cwd(), 'src/lib/email/autoReplyTemplate.ts'),
    'utf8'
  );

  it('read the right file (guards against a silently empty source)', () => {
    expect(source).toContain('export const DEFAULT_AUTO_REPLY_SUBJECT');
    expect(source).toContain('export function renderAutoReply');
  });

  /** Strip comments so the prose ("Adding an import of Sentry…") can't trip us. */
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('contains no import statement', () => {
    expect(code).not.toMatch(/^\s*import\b/m);
  });

  it('contains no dynamic import() or require()', () => {
    expect(code).not.toMatch(/\bimport\s*\(/);
    expect(code).not.toMatch(/\brequire\s*\(/);
  });

  it('contains no re-export from another module', () => {
    expect(code).not.toMatch(/^\s*export\b[^\n]*\bfrom\s*['"]/m);
  });

  it('the guard itself is live (a planted import would be caught)', () => {
    const planted = `${code}\nimport * as Sentry from '@sentry/nextjs';\n`;
    expect(planted).toMatch(/^\s*import\b/m);
  });
});
