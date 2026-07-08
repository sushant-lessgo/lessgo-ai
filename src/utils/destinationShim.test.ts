import { describe, it, expect } from 'vitest';
import { toDestination, type LegacyButtonConfig } from '@/utils/destinationShim';
import { resolveDestination } from '@/utils/resolveCtaHref';
import type { CTAButton, Destination, Link } from '@/types/destination';

describe('toDestination — raw strings', () => {
  it('#anchor → section (round-trips to #anchor)', () => {
    const d = toDestination('#cta') as Destination;
    expect(d).toEqual({ kind: 'section', anchor: 'cta' });
    expect(resolveDestination(d)).toBe('#cta');
  });

  it('/path → page (round-trips verbatim)', () => {
    const d = toDestination('/contact') as Destination;
    expect(d).toEqual({ kind: 'page', pathSlug: '/contact' });
    expect(resolveDestination(d)).toBe('/contact');
  });

  it('tel: → call', () => {
    const d = toDestination('tel:+15551234') as Destination;
    expect(d).toEqual({ kind: 'call', number: '+15551234' });
    expect(resolveDestination(d)).toBe('tel:+15551234');
  });

  it('mailto: → email', () => {
    const d = toDestination('mailto:hi@x.com') as Destination;
    expect(d).toEqual({ kind: 'email', addr: 'hi@x.com' });
    expect(resolveDestination(d)).toBe('mailto:hi@x.com');
  });

  it('wa.me → whatsapp (canonical round-trip)', () => {
    const d = toDestination('https://wa.me/1234567890') as Destination;
    expect(d).toEqual({ kind: 'whatsapp', number: '1234567890' });
    expect(resolveDestination(d)).toBe('https://wa.me/1234567890');
  });

  it('wa.me with ?text → whatsapp msg (canonical round-trip)', () => {
    const d = toDestination('https://wa.me/1234?text=hi%20there') as Destination;
    expect(d).toEqual({ kind: 'whatsapp', number: '1234', msg: 'hi there' });
    expect(resolveDestination(d)).toBe('https://wa.me/1234?text=hi%20there');
  });

  it('api.whatsapp.com/send → whatsapp', () => {
    const d = toDestination(
      'https://api.whatsapp.com/send?phone=1234&text=hey',
    ) as Destination;
    expect(d).toEqual({ kind: 'whatsapp', number: '1234', msg: 'hey' });
    expect(resolveDestination(d)).toBe('https://wa.me/1234?text=hey');
  });

  it('https url → external (verbatim round-trip)', () => {
    const d = toDestination('https://calendly.com/x') as Destination;
    expect(d).toEqual({ kind: 'external', url: 'https://calendly.com/x' });
    expect(resolveDestination(d)).toBe('https://calendly.com/x');
  });

  it('unrecognized string → external verbatim', () => {
    const d = toDestination('some-weird-thing') as Destination;
    expect(d).toEqual({ kind: 'external', url: 'some-weird-thing' });
    expect(resolveDestination(d)).toBe('some-weird-thing');
  });
});

describe('toDestination — legacy buttonConfig', () => {
  it('type:page → page{pathSlug}', () => {
    const cfg: LegacyButtonConfig = { type: 'page', pathSlug: '/about', pageId: 'p1' };
    expect(toDestination(cfg)).toEqual({ kind: 'page', pathSlug: '/about' });
  });

  it('type:link parses its url like a raw string', () => {
    expect(toDestination({ type: 'link', url: 'https://x.com' })).toEqual({
      kind: 'external',
      url: 'https://x.com',
    });
    expect(toDestination({ type: 'link', url: '#pricing' })).toEqual({
      kind: 'section',
      anchor: 'pricing',
    });
  });

  it('type:link-with-input folds into url Destination (external{url})', () => {
    const cfg: LegacyButtonConfig = {
      type: 'link-with-input',
      url: 'https://x.com?ref=',
      formId: 'f1',
      inputConfig: { queryParamName: 'ref' },
    };
    // formId rides on the CTAButton separately; toDestination emits only the url.
    expect(toDestination(cfg)).toEqual({ kind: 'external', url: 'https://x.com?ref=' });
  });

  it('type:form → undefined (wrapper owns the form case)', () => {
    expect(toDestination({ type: 'form', formId: 'f1' })).toBeUndefined();
  });

  it('unknown/absent type → undefined', () => {
    expect(toDestination({} as LegacyButtonConfig)).toBeUndefined();
    expect(toDestination({ text: 'x' } as LegacyButtonConfig)).toBeUndefined();
  });

  it('undefined → undefined', () => {
    expect(toDestination(undefined)).toBeUndefined();
  });
});

describe('toDestination — new shapes', () => {
  it('CTAButton → its dest', () => {
    const cta: CTAButton = { role: 'secondary', dest: { kind: 'section', anchor: 'faq' } };
    expect(toDestination(cta)).toEqual({ kind: 'section', anchor: 'faq' });
  });

  it('CTAButton GOAL_REF → GOAL_REF', () => {
    const cta: CTAButton = { role: 'primary', dest: 'GOAL_REF' };
    expect(toDestination(cta)).toBe('GOAL_REF');
  });

  it('Link → its dest', () => {
    const link: Link = { dest: { kind: 'page', pathSlug: '/blog' }, source: 'manual' };
    expect(toDestination(link)).toEqual({ kind: 'page', pathSlug: '/blog' });
  });
});

// scale-04 phase 4 — the modal writes these CTAButton shapes; the shim reads
// them back so re-opening an old button prefills, and edit-side clicks resolve.
describe('toDestination — phase-4 CTAButton write shapes', () => {
  it('form CTAButton (form-section + formId) reads back the section dest', () => {
    // The write path ALWAYS carries formId for a form button; the pre-pass keys
    // the form case off formId. toDestination emits only the dest (formId rides
    // on the CTAButton and is read separately by the click handler).
    const cta: CTAButton = {
      role: 'primary',
      dest: { kind: 'section', anchor: 'form-section' },
      formId: 'f1',
    };
    expect(toDestination(cta)).toEqual({ kind: 'section', anchor: 'form-section' });
    expect(cta.formId).toBe('f1');
  });

  it('detached primary external CTAButton round-trips via resolveDestination', () => {
    const cta: CTAButton = {
      role: 'primary',
      dest: { kind: 'external', url: 'https://calendly.com/x' },
    };
    const d = toDestination(cta) as Destination;
    expect(resolveDestination(d)).toBe('https://calendly.com/x');
  });

  it('secondary page CTAButton reads back page dest', () => {
    const cta: CTAButton = {
      role: 'secondary',
      dest: { kind: 'page', pathSlug: '/pricing' },
    };
    expect(toDestination(cta)).toEqual({ kind: 'page', pathSlug: '/pricing' });
  });
});

describe('resolveDestination — per kind', () => {
  const cases: Array<[Destination, string]> = [
    [{ kind: 'section', anchor: 'cta' }, '#cta'],
    [{ kind: 'page', pathSlug: '/contact' }, '/contact'],
    [{ kind: 'external', url: 'https://x.com' }, 'https://x.com'],
    [{ kind: 'whatsapp', number: '123' }, 'https://wa.me/123'],
    [{ kind: 'whatsapp', number: '123', msg: 'a b' }, 'https://wa.me/123?text=a%20b'],
    [{ kind: 'call', number: '+1' }, 'tel:+1'],
    [{ kind: 'email', addr: 'a@b.com' }, 'mailto:a@b.com'],
    [{ kind: 'download', fileUrl: '/files/x.pdf' }, '/files/x.pdf'],
    [{ kind: 'social', platform: 'x', url: 'https://x.com/u' }, 'https://x.com/u'],
  ];
  it.each(cases)('%o → %s', (dest, expected) => {
    expect(resolveDestination(dest)).toBe(expected);
  });
});
