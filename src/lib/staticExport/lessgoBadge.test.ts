// Tests for the published-page "Proudly built by Lessgo.ai" attribution strip.
import { describe, it, expect } from 'vitest';
import { renderLessgoBadge } from './lessgoBadge';

describe('renderLessgoBadge', () => {
  const html = renderLessgoBadge();

  it('shows the locked wording', () => {
    expect(html).toContain('Proudly built by');
    expect(html).toContain('Lessgo.ai');
  });

  it('links to lessgo.ai with ref/UTM attribution', () => {
    expect(html).toMatch(/href="https:\/\/lessgo\.ai\/\?ref=badge[^"]*"/);
    expect(html).toContain('utm_source=published');
  });

  it('is a single anchor opening in a new tab safely', () => {
    expect((html.match(/<a /g) || []).length).toBe(1);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
  });

  it('does not declare a contentinfo landmark (footer already owns it)', () => {
    expect(html).not.toContain('contentinfo');
  });
});
