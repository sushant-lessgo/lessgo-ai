// Blog (Phase 1): page-def synthesis. These defs are the SINGLE source for both
// the static export and the SSR fallback — this test pins the renderer contract
// (content[id] = { layout, elements }), chrome injection, and the forms merge
// that triggers form.v1.js embedding.
import { describe, it, expect } from 'vitest';
import {
  buildBlogPostPageDef,
  buildBlogIndexPageDef,
  markdownToDescription,
  BLOG_SUBSCRIBE_FORM_ID,
} from '../buildBlogPages';

const POST = {
  slug: 'hello-world',
  title: 'Hello World',
  excerpt: 'A first post',
  heroImage: 'https://img.example/hero.webp',
  markdown: '# Hi\n\nSome body text.',
  publishedAtISO: '2026-07-03T10:00:00.000Z',
};

const PAGE_CONTENT = {
  layout: { sections: ['hero-1'], theme: { colors: { accentColor: 'blue' } } },
  forms: { 'contact-form': { name: 'Contact' } },
  legalPages: { privacy: { markdown: 'privacy text' } },
  chrome: {
    header: { id: 'header-abc', data: { layout: 'Nav', elements: {} } },
    footer: { id: 'footer-xyz', data: { layout: 'Footer', elements: {} } },
  },
};

describe('buildBlogPostPageDef', () => {
  it('emits the renderer contract: sections + content[id]={layout, elements}', () => {
    const def = buildBlogPostPageDef({ layout: { theme: {} } }, POST);
    expect(def.sections).toEqual(['blogpostbody-main']);
    const section = def.content['blogpostbody-main'];
    expect(section.layout).toBe('BlogPostBody');
    expect(section.elements.post.title).toBe('Hello World');
    expect(section.elements.post.markdown).toContain('Some body text');
    expect(section.elements.subscribeFormId).toBe(BLOG_SUBSCRIBE_FORM_ID);
  });

  it('injects chrome: header first, footer last, body between', () => {
    const def = buildBlogPostPageDef(PAGE_CONTENT, POST);
    expect(def.sections).toEqual(['header-abc', 'blogpostbody-main', 'footer-xyz']);
    expect(def.content['header-abc']).toEqual(PAGE_CONTENT.chrome.header.data);
    expect(def.content['footer-xyz']).toEqual(PAGE_CONTENT.chrome.footer.data);
  });

  it('merges root forms + synthetic subscribe form (form.v1.js trigger) and legalPages', () => {
    const def = buildBlogPostPageDef(PAGE_CONTENT, POST);
    expect(def.content.forms['contact-form']).toBeTruthy();
    expect(def.content.forms[BLOG_SUBSCRIBE_FORM_ID]).toBeTruthy();
    expect(Object.keys(def.content.forms).length).toBeGreaterThan(0); // htmlGenerator hasForms condition
    expect(def.content.legalPages).toBe(PAGE_CONTENT.legalPages);
  });

  it('carries the root theme; description falls back excerpt → markdown', () => {
    const def = buildBlogPostPageDef(PAGE_CONTENT, POST);
    expect(def.theme).toBe(PAGE_CONTENT.layout.theme);
    expect(def.description).toBe('A first post');

    const noExcerpt = buildBlogPostPageDef(PAGE_CONTENT, { ...POST, excerpt: null });
    expect(noExcerpt.description).toContain('Some body text');
  });

  it('does not mutate the page content (chrome injection works on a fresh map)', () => {
    const before = JSON.stringify(PAGE_CONTENT);
    buildBlogPostPageDef(PAGE_CONTENT, POST);
    expect(JSON.stringify(PAGE_CONTENT)).toBe(before);
  });
});

describe('buildBlogIndexPageDef', () => {
  it('lists posts as cards with slugs for RELATIVE hrefs', () => {
    const def = buildBlogIndexPageDef(PAGE_CONTENT, [POST], 'Acme');
    expect(def.sections).toEqual(['header-abc', 'blogindex-main', 'footer-xyz']);
    const cards = def.content['blogindex-main'].elements.posts;
    expect(cards).toHaveLength(1);
    expect(cards[0].slug).toBe('hello-world');
    expect(def.title).toBe('Blog — Acme');
  });
});

describe('markdownToDescription', () => {
  it('strips markdown syntax and caps length', () => {
    const out = markdownToDescription('# Title\n\nSome **bold** [link](https://x.dev) text.');
    expect(out).not.toContain('#');
    expect(out).not.toContain('**');
    expect(out).not.toContain('https://x.dev');
    expect(out).toContain('link');
    expect(markdownToDescription('a'.repeat(500)).length).toBeLessThanOrEqual(160);
  });
});
