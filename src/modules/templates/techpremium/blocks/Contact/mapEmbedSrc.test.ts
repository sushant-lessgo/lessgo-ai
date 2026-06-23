// Validation tests for the Google Maps embed sanitizer.
import { describe, it, expect } from 'vitest';
import { mapEmbedSrc } from './TechPremiumContact';

const EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!2sNaayom';

describe('mapEmbedSrc', () => {
  it('accepts a bare Google Maps embed URL', () => {
    expect(mapEmbedSrc(EMBED)).toBe(EMBED);
  });

  it('extracts src from a full <iframe> paste', () => {
    const iframe = `<iframe src="${EMBED}" width="600" height="450" loading="lazy"></iframe>`;
    expect(mapEmbedSrc(iframe)).toBe(EMBED);
  });

  it('accepts maps.google.com host', () => {
    const u = 'https://maps.google.com/maps/embed?pb=xyz';
    expect(mapEmbedSrc(u)).toBe(u);
  });

  it('rejects empty / undefined', () => {
    expect(mapEmbedSrc('')).toBeNull();
    expect(mapEmbedSrc(undefined)).toBeNull();
    expect(mapEmbedSrc('   ')).toBeNull();
  });

  it('rejects http (non-https)', () => {
    expect(mapEmbedSrc('http://www.google.com/maps/embed?pb=x')).toBeNull();
  });

  it('rejects a non-Google host', () => {
    expect(mapEmbedSrc('https://evil.com/maps/embed?pb=x')).toBeNull();
    // host that merely contains "google.com" as a subdomain of attacker domain
    expect(mapEmbedSrc('https://google.com.evil.com/maps/embed?pb=x')).toBeNull();
  });

  it('rejects a Google URL that is not an embed path', () => {
    expect(mapEmbedSrc('https://www.google.com/maps/place/Naayom')).toBeNull();
  });

  it('rejects non-URL junk', () => {
    expect(mapEmbedSrc('just some text')).toBeNull();
  });
});
