// Save-payload validation. The paletteId/templateId rules are the ones that
// blocked the Lex save round-trip before gap #9 was fixed — guard them so a new
// template's palette can't get rejected at saveDraft again.

import { DraftSaveSchema, PublishSchema } from '@/lib/validation';

const okToken = { tokenId: 'abc-123_XYZ' };

describe('DraftSaveSchema', () => {
  it('accepts a minimal valid payload', () => {
    expect(DraftSaveSchema.safeParse(okToken).success).toBe(true);
  });

  it('accepts palette ids from every template family (bounded slug, not enum)', () => {
    for (const paletteId of ['terracotta', 'counsel', 'mint', 'heritage', 'charcoal']) {
      expect(DraftSaveSchema.safeParse({ ...okToken, paletteId }).success).toBe(true);
    }
  });

  it('accepts all known templateIds and rejects unknown ones', () => {
    for (const templateId of ['hearth', 'lex', 'meridian']) {
      expect(DraftSaveSchema.safeParse({ ...okToken, templateId }).success).toBe(true);
    }
    expect(DraftSaveSchema.safeParse({ ...okToken, templateId: 'folio' }).success).toBe(false);
  });

  it('rejects malformed token ids', () => {
    expect(DraftSaveSchema.safeParse({ tokenId: 'has spaces' }).success).toBe(false);
    expect(DraftSaveSchema.safeParse({ tokenId: '' }).success).toBe(false);
  });

  it('bounds paletteId length (50)', () => {
    expect(DraftSaveSchema.safeParse({ ...okToken, paletteId: 'x'.repeat(51) }).success).toBe(false);
  });
});

describe('PublishSchema', () => {
  it('accepts a valid slug', () => {
    expect(PublishSchema.safeParse({ tokenId: 'abc', slug: 'my-page-1' }).success).toBe(true);
  });

  it('rejects slugs with uppercase, spaces, or leading/trailing hyphens', () => {
    for (const slug of ['My-Page', 'my page', '-lead', 'trail-']) {
      expect(PublishSchema.safeParse({ tokenId: 'abc', slug }).success).toBe(false);
    }
  });
});
