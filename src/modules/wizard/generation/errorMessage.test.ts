// scale 1-10 F27b — the presentation guard must never leak a raw ZodError /
// JSON blob to the customer-facing wizard, while preserving hand-written
// sibling error messages verbatim.

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  humanizeGenerationError,
  GENERIC_SCHEMA_ERROR,
  GENERIC_GENERATION_ERROR,
} from './errorMessage';

// The exact blob shape observed live (token I-fwXvbaMwzP): a ZodError whose
// .message is the stringified issue array printed verbatim in the wizard panel.
const RAW_ZOD_BLOB =
  '[\n  {\n    "code": "invalid_union",\n    "unionErrors": [\n      {\n        "issues": [\n          {\n            "code": "invalid_type",\n            "expected": "string",\n            "received": "object",\n            "path": ["footer", "elements", "link_columns"],\n            "message": "Expected string, received object"\n          }\n        ],\n        "name": "ZodError"\n      }\n    ]\n  }\n]';

describe('humanizeGenerationError', () => {
  it('maps a raw ZodError blob to one human sentence — no JSON leak', () => {
    const out = humanizeGenerationError(RAW_ZOD_BLOB);
    expect(out).toBe(GENERIC_SCHEMA_ERROR);
    // Belt-and-braces: none of the internal schema shrapnel survives.
    expect(out).not.toContain('{');
    expect(out).not.toContain('[');
    expect(out).not.toMatch(/invalid_union|invalid_type|ZodError|"path"|"code"/);
  });

  it('maps an actual thrown ZodError.message (from schema.parse) to the human sentence', () => {
    const schema = z.object({ footer: z.object({ legal_links: z.array(z.string()) }) });
    let thrown = '';
    try {
      schema.parse({ footer: { legal_links: { 0: 'x' } } });
    } catch (e: any) {
      thrown = e.message;
    }
    expect(thrown).toContain('"code"'); // sanity: the real message IS a JSON blob
    const out = humanizeGenerationError(thrown);
    expect(out).toBe(GENERIC_SCHEMA_ERROR);
    expect(out).not.toContain('"code"');
  });

  it('rewrites a prefixed blob that embeds Zod issue markers mid-string', () => {
    const wrapped = 'Response validation failed: invalid_type at footer.legal_links';
    expect(humanizeGenerationError(wrapped)).toBe(GENERIC_SCHEMA_ERROR);
  });

  it('preserves hand-written sibling error messages verbatim', () => {
    for (const msg of [
      'Too many requests. Please try again later.',
      'Could not read that website.',
      'Out of credits.',
      'Strategy generation failed.',
      'Copy generation failed (About).',
    ]) {
      expect(humanizeGenerationError(msg)).toBe(msg);
    }
  });

  it('falls back to a generic sentence for empty / missing input', () => {
    expect(humanizeGenerationError(null)).toBe(GENERIC_GENERATION_ERROR);
    expect(humanizeGenerationError(undefined)).toBe(GENERIC_GENERATION_ERROR);
    expect(humanizeGenerationError('   ')).toBe(GENERIC_GENERATION_ERROR);
  });
});
