import { describe, it, expect } from 'vitest';
import { ytEmbed } from './ytEmbed';

// Load-bearing proof behind EXEMPT_URL_KEYS = ['video_url'] in
// src/lib/publishSanitizer.ts: video_url is exempt from the URL scheme-gate ONLY
// because every reader routes through ytEmbed, which is safe by construction —
// it regex-extracts an 11-char id and interpolates it into a FIXED
// youtube-nocookie embed URL, or returns ''. No input scheme can survive.

const EMBED = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;

describe('ytEmbed — safe-by-construction normalizer (video_url exemption boundary)', () => {
  it('drops unsafe schemes to ""', () => {
    expect(ytEmbed('javascript:alert(1)')).toBe('');
    expect(ytEmbed('data:text/html,x')).toBe('');
    expect(ytEmbed('vbscript:msgbox(1)')).toBe('');
    expect(ytEmbed('//evil.com/dQw4w9WgXcQ')).toBe('');
  });

  it('normalizes a real youtu.be link to the fixed nocookie embed', () => {
    expect(ytEmbed('https://youtu.be/dQw4w9WgXcQ')).toBe(EMBED('dQw4w9WgXcQ'));
  });

  it('normalizes a bare 11-char id to the fixed nocookie embed', () => {
    expect(ytEmbed('dQw4w9WgXcQ')).toBe(EMBED('dQw4w9WgXcQ'));
  });

  it('normalizes a full watch URL to the fixed nocookie embed', () => {
    expect(ytEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(EMBED('dQw4w9WgXcQ'));
  });

  it('returns "" for empty', () => {
    expect(ytEmbed('')).toBe('');
  });
});
