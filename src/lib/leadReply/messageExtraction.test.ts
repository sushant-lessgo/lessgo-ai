import { describe, it, expect } from 'vitest';
import { extractLeadMessage, hasReplyableMessage } from './messageExtraction';

describe('extractLeadMessage', () => {
  it('picks an explicit message-named key', () => {
    const r = extractLeadMessage({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hi, do you ship to Canada? I need 200 units by August.',
    });
    expect(r).toEqual({
      key: 'message',
      value: 'Hi, do you ship to Canada? I need 200 units by August.',
    });
  });

  it('matches comment/note/enquiry/inquiry variants', () => {
    expect(extractLeadMessage({ comment: 'Please call me back soon' })?.key).toBe(
      'comment'
    );
    expect(extractLeadMessage({ enquiry: 'What are your rates?' })?.key).toBe(
      'enquiry'
    );
  });

  it('falls back to the longest non-contact free-text value', () => {
    const r = extractLeadMessage({
      name: 'Bob',
      email: 'bob@example.com',
      details: 'I would love a quote for a kitchen renovation next month.',
    });
    expect(r?.key).toBe('details');
  });

  it('returns null for contact-only data', () => {
    expect(
      extractLeadMessage({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1 555 123 4567',
      })
    ).toBeNull();
  });

  it('returns null for subscribe-only (email only) data', () => {
    expect(extractLeadMessage({ email: 'subscriber@example.com' })).toBeNull();
  });

  it('denylist: company value does not count as a message (N2)', () => {
    expect(
      extractLeadMessage({
        name: 'Jane Doe',
        email: 'jane@example.com',
        company: 'Acme Corporation Ltd',
      })
    ).toBeNull();
  });

  it('ignores other denylisted free-text keys (subject/budget/website/city/role)', () => {
    expect(
      extractLeadMessage({
        name: 'Jane',
        email: 'jane@example.com',
        subject: 'Partnership opportunity',
        budget: '5000 to 10000 dollars',
        website: 'https://acme.example.com',
        city: 'San Francisco',
        role: 'Head of Marketing',
      })
    ).toBeNull();
  });

  it('returns null for empty / whitespace values', () => {
    expect(extractLeadMessage({ message: '   ' })).toBeNull();
    expect(extractLeadMessage({})).toBeNull();
  });

  it('enforces the substance floor (short one-word values do not count)', () => {
    expect(extractLeadMessage({ message: 'yes' })).toBeNull();
    // two words clears the floor
    expect(extractLeadMessage({ message: 'yes please' })?.value).toBe('yes please');
    // >= 8 chars clears the floor
    expect(extractLeadMessage({ message: 'interested' })?.value).toBe('interested');
  });

  it('skips free-text values that look like email/phone/url', () => {
    expect(
      extractLeadMessage({ ref: 'https://example.com/some/long/path' })
    ).toBeNull();
    expect(extractLeadMessage({ contactAt: 'someone@example.com' })).toBeNull();
  });

  it('handles null / undefined data', () => {
    expect(extractLeadMessage(null)).toBeNull();
    expect(extractLeadMessage(undefined)).toBeNull();
  });
});

describe('hasReplyableMessage', () => {
  it('is true when a message is present, false otherwise', () => {
    expect(hasReplyableMessage({ message: 'Can you help with X and Y?' })).toBe(true);
    expect(
      hasReplyableMessage({ name: 'Jane', email: 'jane@example.com' })
    ).toBe(false);
  });
});
