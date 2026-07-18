import { describe, it, expect } from 'vitest';
import {
  sanitizePublishedHtml,
  isSafePublishedUrl,
  sanitizePublishedUrl,
  isUrlContentKey,
  isEmbedContentKey,
  sanitizePublishedEmbed,
  sanitizeContentHtml,
  sanitizeLocaleOverlay,
  EXTRA_URL_KEYS,
  EXEMPT_URL_KEYS,
} from './publishSanitizer';
import { injectChromeIntoPage } from './staticExport/injectChrome';

// ─────────────────────────────────────────────────────────────────────────────
// 1. HTML payload matrix — assert on OUTPUT (neutralized), not "function ran".
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizePublishedHtml — payload matrix', () => {
  it('strips <script>', () => {
    const out = sanitizePublishedHtml('<script>alert(1)</script>hi');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('hi');
  });

  it('strips <img onerror>', () => {
    const out = sanitizePublishedHtml('<img src=x onerror="alert(1)">text');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('<img');
    expect(out).toContain('text');
  });

  it('strips <svg onload>', () => {
    const out = sanitizePublishedHtml('<svg onload="alert(1)"></svg>ok');
    expect(out).not.toContain('onload');
    expect(out).not.toContain('<svg');
  });

  it('drops javascript: href (keeps element, no scheme)', () => {
    const out = sanitizePublishedHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('drops data:text/html href', () => {
    const out = sanitizePublishedHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>');
    expect(out).not.toContain('data:text/html');
    expect(out).not.toContain('<script');
  });

  it('strips <iframe>', () => {
    const out = sanitizePublishedHtml('<iframe src="https://evil.com"></iframe>keep');
    expect(out).not.toContain('<iframe');
    expect(out).toContain('keep');
  });

  it('strips <object>', () => {
    const out = sanitizePublishedHtml('<object data="x"></object>keep');
    expect(out).not.toContain('<object');
  });

  it('strips <embed>', () => {
    const out = sanitizePublishedHtml('<embed src="x">keep');
    expect(out).not.toContain('<embed');
  });

  it('strips inline <style> tag', () => {
    const out = sanitizePublishedHtml('<style>body{color:red}</style>keep');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('color:red');
  });

  it('strips style attr expression()', () => {
    const out = sanitizePublishedHtml('<span style="color:red;width:expression(alert(1))">x</span>');
    expect(out).not.toContain('expression(');
  });

  it('strips style attr url(javascript:)', () => {
    const out = sanitizePublishedHtml('<span style="background:url(javascript:alert(1))">x</span>');
    expect(out).not.toContain('javascript:');
    expect(out.toLowerCase()).not.toContain('url(javascript');
  });

  it('drops obfuscated java\\tscript: scheme (control-char strip)', () => {
    const out = sanitizePublishedHtml('<a href="java\tscript:alert(1)">x</a>');
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out).not.toContain('alert(1)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. URL-gate matrix (sanitizePublishedUrl + isSafePublishedUrl)
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizePublishedUrl — scheme gate', () => {
  const unsafe = [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.com',
    'java\nscript:alert(1)',
  ];
  for (const u of unsafe) {
    it(`gates ${JSON.stringify(u)} -> '#'`, () => {
      expect(sanitizePublishedUrl(u)).toBe('#');
      expect(isSafePublishedUrl(u)).toBe(false);
    });
  }

  const safe = [
    'https://x.com',
    'http://x.com',
    '/contact',
    '#form-section',
    'mailto:a@b.c',
    'tel:+15551234',
    '',
  ];
  for (const u of safe) {
    it(`passes ${JSON.stringify(u)} unchanged`, () => {
      expect(sanitizePublishedUrl(u)).toBe(u);
    });
  }

  it('accepts all three N4 allowances (mailto + tel + fragment)', () => {
    expect(isSafePublishedUrl('mailto:a@b.c')).toBe(true);
    expect(isSafePublishedUrl('tel:+15551234')).toBe(true);
    expect(isSafePublishedUrl('#anchor')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Key-detector matrix
// ─────────────────────────────────────────────────────────────────────────────
describe('isUrlContentKey / isEmbedContentKey', () => {
  const urlTrue = [
    'href', 'cta_href', 'secondary_cta_href', 'whatsapp_href',
    'url', 'fileUrl', 'signin_url', 'book_call_url', 'calendly_url',
    'link', 'slug', 'pathSlug',
  ];
  for (const k of urlTrue) {
    it(`isUrlContentKey('${k}') === true`, () => expect(isUrlContentKey(k)).toBe(true));
  }

  it('map_embed is an embed key', () => {
    expect(isEmbedContentKey('map_embed')).toBe(true);
  });

  const nonUrl = ['headline', 'cta_text', 'description', 'image', 'avatar'];
  for (const k of nonUrl) {
    it(`isUrlContentKey('${k}') === false (no over-gating)`, () => {
      expect(isUrlContentKey(k)).toBe(false);
      expect(isEmbedContentKey(k)).toBe(false);
    });
  }

  it('EXTRA_URL_KEYS is empty (grep reconciled, bucket-b empty)', () => {
    expect(EXTRA_URL_KEYS).toEqual([]);
  });

  it('EXEMPT_URL_KEYS = [video_url]', () => {
    expect(EXEMPT_URL_KEYS).toEqual(['video_url']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Embed-gate matrix
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizePublishedEmbed', () => {
  it('bare Google-Maps embed URL unchanged', () => {
    const u = 'https://www.google.com/maps/embed?pb=!1m18';
    expect(sanitizePublishedEmbed(u)).toBe(u);
  });

  it('full iframe paste byte-identical', () => {
    const v = '<iframe src="https://www.google.com/maps/embed?pb=!1m18" width="600"></iframe>';
    expect(sanitizePublishedEmbed(v)).toBe(v);
  });

  it('javascript: -> ""', () => {
    expect(sanitizePublishedEmbed('javascript:alert(1)')).toBe('');
  });

  it('data:text/html -> ""', () => {
    expect(sanitizePublishedEmbed('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('iframe with javascript: src -> ""', () => {
    expect(sanitizePublishedEmbed('<iframe src="javascript:alert(1)"></iframe>')).toBe('');
  });

  it('http (non-https) -> ""', () => {
    expect(sanitizePublishedEmbed('http://www.google.com/maps/embed?pb=x')).toBe('');
  });

  it('empty -> ""', () => {
    expect(sanitizePublishedEmbed('')).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Benign fixture — asserted via independent invariants + idempotency, NOT
//    equality-to-self (avoids the self-fulfilling test trap).
// ─────────────────────────────────────────────────────────────────────────────
const BENIGN = [
  '<p>Visit <a href="https://example.com">site</a>, ',
  '<a href="mailto:a@b.c">email</a>, ',
  '<a href="tel:+15551234">call</a>, ',
  '<a href="#anchor">jump</a>, ',
  '<a href="/pricing">pricing</a>.</p>',
  '<p><b>bold</b> <strong>strong</strong> <i>i</i> <em>em</em> <u>u</u></p>',
  '<p><span style="font-weight:700;color:#333;text-align:center;font-size:14px">styled</span></p>',
  '<ul><li>one</li><li>two</li></ul><ol><li>a</li></ol>',
  '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>',
  '<blockquote>quote</blockquote>',
  '<a href="https://ext.com" target="_blank">new tab</a>',
].join('');

describe('benign fixture survives semantically', () => {
  const out = sanitizePublishedHtml(BENIGN);

  it('keeps anchors + https href', () => {
    expect(out).toContain('<a');
    expect(out).toContain('href="https://example.com"');
  });
  it('keeps mailto/tel/fragment/root-relative hrefs', () => {
    expect(out).toContain('mailto:a@b.c');
    expect(out).toContain('tel:+15551234');
    expect(out).toContain('href="#anchor"');
    expect(out).toContain('href="/pricing"');
  });
  it('keeps bold/strong + list items + headings + blockquote', () => {
    expect(out).toMatch(/<(strong|b)>/);
    expect(out).toContain('<li>');
    expect(out).toContain('<h1>');
    expect(out).toContain('<h6>');
    expect(out).toContain('<blockquote>');
  });
  it('keeps whitelisted inline style props', () => {
    expect(out.toLowerCase()).toContain('font-weight');
    expect(out.toLowerCase()).toContain('color');
  });
  it('adds rel=noopener to target=_blank (the one allowed delta)', () => {
    expect(out).toContain('target="_blank"');
    expect(out).toContain('noopener');
  });
  it('is idempotent', () => {
    expect(sanitizePublishedHtml(out)).toBe(out);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Plain-text no-mangle + N5 tradeoff
// ─────────────────────────────────────────────────────────────────────────────
describe('plain-text handling', () => {
  it('"Fast & simple" byte-identical (fast-path)', () => {
    expect(sanitizePublishedHtml('Fast & simple')).toBe('Fast & simple');
  });
  it('"100% free" byte-identical (fast-path)', () => {
    expect(sanitizePublishedHtml('100% free')).toBe('100% free');
  });
  it('N5: plain prose with "<" gets entity-encoded (documented tradeoff)', () => {
    // "price < 5" contains '<' so it is NOT fast-pathed; DOMPurify entity-encodes.
    expect(sanitizePublishedHtml('price < 5')).toBe('price &lt; 5');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Idempotency across matrices
// ─────────────────────────────────────────────────────────────────────────────
describe('idempotency', () => {
  const htmlPayloads = [
    '<script>alert(1)</script>hi',
    '<img src=x onerror="alert(1)">t',
    '<a href="javascript:alert(1)">x</a>',
    '<span style="color:red;width:expression(alert(1))">x</span>',
  ];
  for (const p of htmlPayloads) {
    it(`html f(f(x))===f(x): ${JSON.stringify(p).slice(0, 30)}`, () => {
      const once = sanitizePublishedHtml(p);
      expect(sanitizePublishedHtml(once)).toBe(once);
    });
  }

  const urls = ['javascript:alert(1)', '//evil.com', 'https://x.com', '#a', '', '#'];
  for (const u of urls) {
    it(`url f(f(x))===f(x): ${JSON.stringify(u)}`, () => {
      const once = sanitizePublishedUrl(u);
      expect(sanitizePublishedUrl(once)).toBe(once);
    });
  }

  const embeds = [
    'https://www.google.com/maps/embed?pb=x',
    'javascript:alert(1)',
    '',
  ];
  for (const e of embeds) {
    it(`embed f(f(x))===f(x): ${JSON.stringify(e)}`, () => {
      const once = sanitizePublishedEmbed(e);
      expect(sanitizePublishedEmbed(once)).toBe(once);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Deep-tree — sanitizeContentHtml MUTATES IN PLACE, returns void.
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizeContentHtml — deep tree', () => {
  function buildTree() {
    return {
      layout: { sections: ['hero-root', 'cta-root'] },
      content: {
        'hero-root': {
          elements: {
            headline: 'Welcome to our site',
            body: '<b>bold</b><img src=x onerror="alert(1)">',
            cta_href: 'javascript:alert(1)',
            secondary_cta_href: 'https://safe.example.com',
            signin_url: 'data:text/html,x',
            book_call_url: 'javascript:alert(2)',
            map_embed: 'data:text/html,<script>alert(1)</script>',
            maps_ok_embed: '<iframe src="https://www.google.com/maps/embed?pb=abc"></iframe>',
            video_url: 'dQw4w9WgXcQ',
            features: [
              { quote: '<script>alert(1)</script>keep', href: 'javascript:alert(1)' },
              { quote: 'clean', href: 'https://good.example.com' },
              { cta_href: 'javascript:alert(1)' },
            ],
          },
          elementMetadata: {
            cta_text: {
              buttonConfig: {
                url: 'javascript:alert(1)',
                pathSlug: 'javascript:alert(1)',
                dest: { kind: 'download', fileUrl: 'javascript:alert(1)' },
              },
            },
            safe_btn: {
              buttonConfig: { url: 'https://ok.example.com', dest: { kind: 'call' } },
            },
          },
          layout: 'centered',
          aiMetadata: { aiGenerated: true, note: 'javascript:not-a-url-here' },
        },
        'cta-root': {
          elements: { cta_text: 'Get started' },
        },
      },
      subpages: {
        about: {
          layout: { sections: ['hero-sub'] },
          content: {
            'hero-sub': {
              elements: {
                body: '<iframe src="https://evil.com"></iframe>keepsub',
                quotes: [{ quote: '<img onerror="alert(1)">q' }],
              },
              elementMetadata: {
                btn: { buttonConfig: { url: 'javascript:alert(1)' } },
              },
            },
          },
        },
      },
    };
  }

  it('sanitizes HTML payloads at root + subpage, element + collection item', () => {
    const t = buildTree();
    sanitizeContentHtml(t);
    const hero = t.content['hero-root'].elements;
    expect(hero.body).not.toContain('onerror');
    expect(hero.body).toContain('bold');
    expect((hero.features[0] as any).quote).not.toContain('<script');
    expect((hero.features[0] as any).quote).toContain('keep');
    const sub = t.subpages.about.content['hero-sub'].elements;
    expect(sub.body).not.toContain('<iframe');
    expect(sub.body).toContain('keepsub');
    expect((sub.quotes[0] as any).quote).not.toContain('onerror');
  });

  it('gates flat URL keys; passes safe ones unchanged', () => {
    const t = buildTree();
    sanitizeContentHtml(t);
    const hero = t.content['hero-root'].elements;
    expect(hero.cta_href).toBe('#');
    expect(hero.signin_url).toBe('#');
    expect(hero.book_call_url).toBe('#');
    expect(hero.secondary_cta_href).toBe('https://safe.example.com');
  });

  it('gates embed keys, keeps legit maps paste, exempts video_url', () => {
    const t = buildTree();
    sanitizeContentHtml(t);
    const hero = t.content['hero-root'].elements;
    expect(hero.map_embed).toBe('');
    expect(hero.maps_ok_embed).toBe('<iframe src="https://www.google.com/maps/embed?pb=abc"></iframe>');
    expect(hero.video_url).toBe('dQw4w9WgXcQ');
  });

  it('does not over-gate prose (headline)', () => {
    const t = buildTree();
    sanitizeContentHtml(t);
    expect(t.content['hero-root'].elements.headline).toBe('Welcome to our site');
  });

  it('gates buttonConfig url/pathSlug/dest.fileUrl (legacy + new shape), root + subpage', () => {
    const t = buildTree();
    sanitizeContentHtml(t);
    const bc = (t.content['hero-root'].elementMetadata.cta_text as any).buttonConfig;
    expect(bc.url).toBe('#');
    expect(bc.pathSlug).toBe('#');
    expect(bc.dest.fileUrl).toBe('#');
    const safe = (t.content['hero-root'].elementMetadata.safe_btn as any).buttonConfig;
    expect(safe.url).toBe('https://ok.example.com');
    expect(safe.dest.kind).toBe('call');
    const subBc = (t.subpages.about.content['hero-sub'].elementMetadata.btn as any).buttonConfig;
    expect(subBc.url).toBe('#');
  });

  it('gates href/cta_href inside collection items; keeps safe href', () => {
    const t = buildTree();
    sanitizeContentHtml(t);
    const f = t.content['hero-root'].elements.features as any[];
    expect(f[0].href).toBe('#');
    expect(f[1].href).toBe('https://good.example.com');
    expect(f[2].cta_href).toBe('#');
  });

  it('leaves layout / aiMetadata / structure untouched', () => {
    const t = buildTree();
    sanitizeContentHtml(t);
    expect(t.content['hero-root'].layout).toBe('centered');
    expect(t.content['hero-root'].aiMetadata.note).toBe('javascript:not-a-url-here');
    expect(t.layout.sections).toEqual(['hero-root', 'cta-root']);
  });

  it('chrome: injected sections AND content.chrome.*.data cleaned in place (aliasing)', () => {
    const chrome = {
      header: {
        id: 'header-abc',
        data: {
          elements: {
            logo_text: '<img onerror="alert(1)">Brand',
            nav_links: [{ label: '<script>x</script>Home', href: 'javascript:alert(1)' }],
          },
        },
      },
      footer: {
        id: 'footer-abc',
        data: { elements: { copyright: '<b>ok</b>', book_call_url: 'javascript:alert(1)' } },
      },
    };
    const content: any = {
      layout: { sections: ['hero-root'] },
      content: {
        'hero-root': { elements: { headline: 'hi' } },
      },
      chrome,
    };
    injectChromeIntoPage(content.layout, content.content, chrome);
    sanitizeContentHtml(content);

    // via the aliased chrome ref (proves in-place / not-a-copy)
    expect(chrome.header.data.elements.logo_text).not.toContain('onerror');
    expect((chrome.header.data.elements.nav_links[0] as any).label).not.toContain('<script');
    expect((chrome.header.data.elements.nav_links[0] as any).href).toBe('#');
    expect(chrome.footer.data.elements.book_call_url).toBe('#');
    // via the injected section entry
    expect(content.content['header-abc'].elements.logo_text).not.toContain('onerror');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Locale overlay
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizeLocaleOverlay', () => {
  it('HTML pass on prose, URL pass on url-named keys, arrays per item', () => {
    const overlay = {
      nl: {
        'hero-abc': {
          headline: '<img onerror="alert(1)">Hallo',
          ctaHref: 'javascript:alert(1)',
          safeHref: 'https://ok.example.com',
          bullets: ['<script>alert(1)</script>een', 'ok'],
        },
      },
    };
    const out = sanitizeLocaleOverlay(overlay);
    expect(out).toBe(overlay); // returns the same (mutated) object
    const s = overlay.nl['hero-abc'];
    expect(s.headline).not.toContain('onerror');
    expect(s.ctaHref).toBe('#');
    expect(s.safeHref).toBe('https://ok.example.com');
    expect(s.bullets[0]).not.toContain('<script');
    expect(s.bullets[1]).toBe('ok');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Mixed-case exempt key (proves the EXEMPT_URL_KEYS lowercase hardening)
// ─────────────────────────────────────────────────────────────────────────────
describe('EXEMPT_URL_KEYS lowercase consistency', () => {
  it('mixed-case Video_url is exempted (bare ID not gated to #)', () => {
    const content: any = {
      layout: { sections: ['hero-x'] },
      content: { 'hero-x': { elements: { Video_url: 'dQw4w9WgXcQ' } } },
    };
    sanitizeContentHtml(content);
    expect(content.content['hero-x'].elements.Video_url).toBe('dQw4w9WgXcQ');
  });
});
