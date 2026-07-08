import { describe, it, expect } from 'vitest';
import {
  resolveCtaHref,
  resolveDestination,
  externalLinkProps,
  type CtaButtonConfig,
} from '@/utils/resolveCtaHref';

// Byte-identical parity net for the scale-04 wrapper rewrite. Each row is the
// exact output the pre-scale-04 `resolveCtaHref` produced.
describe('resolveCtaHref — legacy parity', () => {
  const forms = { f1: { id: 'f1' } };

  it('undefined buttonConfig → fallback', () => {
    expect(resolveCtaHref(undefined, forms)).toBe('#cta');
    expect(resolveCtaHref(undefined, forms, '#custom')).toBe('#custom');
  });

  it('type:page → pathSlug, empty → fallback', () => {
    expect(resolveCtaHref({ type: 'page', pathSlug: '/contact' }, forms)).toBe('/contact');
    expect(resolveCtaHref({ type: 'page' }, forms)).toBe('#cta');
    expect(resolveCtaHref({ type: 'page', pathSlug: '' }, forms, '#f')).toBe('#f');
  });

  it('type:link → url, empty → fallback', () => {
    expect(resolveCtaHref({ type: 'link', url: 'https://x.com' }, forms)).toBe('https://x.com');
    expect(resolveCtaHref({ type: 'link' }, forms)).toBe('#cta');
  });

  it('type:link whatsapp url → verbatim (never re-canonicalized)', () => {
    // Legacy links stored the url verbatim; the shim must not mangle non-canonical
    // whatsapp links (domain rewrite / dropped params / scheme upgrade).
    const apiUrl = 'https://api.whatsapp.com/send?phone=1234&text=Hi';
    expect(resolveCtaHref({ type: 'link', url: apiUrl }, forms)).toBe(apiUrl);
    const waUrl = 'https://wa.me/1234?text=x&utm_source=y';
    expect(resolveCtaHref({ type: 'link', url: waUrl }, forms)).toBe(waUrl);
  });

  it('type:link-with-input → url, empty → fallback', () => {
    expect(resolveCtaHref({ type: 'link-with-input', url: 'https://x.com?r=' }, forms)).toBe(
      'https://x.com?r=',
    );
    expect(resolveCtaHref({ type: 'link-with-input' }, forms)).toBe('#cta');
  });

  it('type:form with resolvable formId → #form-section', () => {
    expect(resolveCtaHref({ type: 'form', formId: 'f1' }, forms)).toBe('#form-section');
  });

  it('type:form MISSING from forms → fallback', () => {
    expect(resolveCtaHref({ type: 'form', formId: 'nope' }, forms)).toBe('#cta');
    expect(resolveCtaHref({ type: 'form', formId: 'nope' }, forms, '#f')).toBe('#f');
  });

  it('type:form with no formId → fallback', () => {
    expect(resolveCtaHref({ type: 'form' }, forms)).toBe('#cta');
  });

  it('type:form when forms undefined → fallback', () => {
    expect(resolveCtaHref({ type: 'form', formId: 'f1' }, undefined)).toBe('#cta');
  });

  it('unknown/absent type → fallback', () => {
    expect(resolveCtaHref({} as CtaButtonConfig, forms)).toBe('#cta');
  });
});

// scale-05 phase 6: a WhatsApp Destination carrying a prefilled message resolves
// to wa.me/{digits}?text={encoded}. The message is encodeURIComponent-encoded.
describe('resolveDestination — whatsapp prefill (phase 6)', () => {
  it('encodes the prefilled message into ?text=', () => {
    expect(
      resolveDestination({
        kind: 'whatsapp',
        number: '15551234567',
        msg: 'Hi Acme, I found your website — interested in AI landing pages',
      }),
    ).toBe(
      'https://wa.me/15551234567?text=Hi%20Acme%2C%20I%20found%20your%20website%20%E2%80%94%20interested%20in%20AI%20landing%20pages',
    );
  });

  it('omits ?text= when no message present', () => {
    expect(resolveDestination({ kind: 'whatsapp', number: '15551234567' })).toBe(
      'https://wa.me/15551234567',
    );
  });
});

describe('externalLinkProps', () => {
  it('http(s) → new tab', () => {
    expect(externalLinkProps('https://x.com')).toEqual({
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });
  it('in-page/internal → same tab', () => {
    expect(externalLinkProps('#cta')).toEqual({});
    expect(externalLinkProps('/contact')).toEqual({});
    expect(externalLinkProps(undefined)).toEqual({});
  });
});
