// utils/hoverTarget.test.ts — pure resolver + label classifier (jsdom).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveTarget, getTargetLabel } from './hoverTarget';

// Build the REAL edit-canvas nesting shape:
//   section-root wrapper (data-section-root + data-section-id, the EditablePageRenderer root)
//     > block <section data-section-id>            (duplicate id on a nested container)
//        > element wrapper (data-element-key + data-section-id)  (dup id again)
//           > leaf node (the actual hovered content)
const SECTION_ID = 'hero-abc12345';

function mountIn(sectionId: string, html: string): HTMLElement {
  document.body.innerHTML = `
    <div data-section-root="${sectionId}" data-section-id="${sectionId}" id="section-root">
      <section data-section-id="${sectionId}" id="block-section">
        ${html}
      </section>
    </div>`;
  return document.getElementById('section-root') as HTMLElement;
}

function mount(html: string): HTMLElement {
  return mountIn(SECTION_ID, html);
}

function byId(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('resolveTarget', () => {
  it('element hover wins over section (closest data-element-key)', () => {
    mount(`
      <div data-element-key="headline" data-section-id="${SECTION_ID}" id="el">
        <h1 id="leaf">Hello</h1>
      </div>`);
    const t = resolveTarget(byId('leaf'));
    expect(t.kind).toBe('element');
    expect(t.elementKey).toBe('headline');
    expect(t.sectionId).toBe(SECTION_ID);
    expect(t.node).toBe(byId('el'));
  });

  it('section background / gap (no element under pointer) resolves to section (D6)', () => {
    mount(`<div data-element-key="headline" data-section-id="${SECTION_ID}"><h1>Hi</h1></div>`);
    // hover the block <section> padding area, not any element
    const t = resolveTarget(byId('block-section'));
    expect(t.kind).toBe('section');
    expect(t.sectionId).toBe(SECTION_ID);
    expect(t.elementKey).toBeNull();
  });

  it('prefers the canonical section-root node for section targets', () => {
    mount(`<div data-element-key="headline" data-section-id="${SECTION_ID}"><h1>Hi</h1></div>`);
    const t = resolveTarget(byId('block-section'));
    // section-root wins over the nested duplicate data-section-id container
    expect(t.node).toBe(byId('section-root'));
  });

  it('duplicate data-section-id nodes never yield multiple/divergent targets', () => {
    mount(`
      <div data-element-key="cta_button" data-section-id="${SECTION_ID}" id="el1"><a id="l1">A</a></div>
      <div data-element-key="subheadline" data-section-id="${SECTION_ID}" id="el2"><p id="l2">B</p></div>`);
    // Three different nested nodes all carrying / under the same section id
    const fromEl1 = resolveTarget(byId('l1'));
    const fromEl2 = resolveTarget(byId('l2'));
    const fromSection = resolveTarget(byId('block-section'));
    expect(fromEl1.sectionId).toBe(SECTION_ID);
    expect(fromEl2.sectionId).toBe(SECTION_ID);
    expect(fromSection.sectionId).toBe(SECTION_ID);
    // Each resolves to exactly one kind, no ambiguity
    expect(fromEl1.kind).toBe('element');
    expect(fromEl2.kind).toBe('element');
    expect(fromSection.kind).toBe('section');
  });

  it('toolbar guard returns a null target', () => {
    document.body.innerHTML = `
      <div data-toolbar-type="section" id="toolbar">
        <button id="tbtn">X</button>
      </div>`;
    const t = resolveTarget(byId('tbtn'));
    expect(t.kind).toBeNull();
    expect(t.node).toBeNull();
  });

  it('no section container → null-kind background target', () => {
    document.body.innerHTML = `<div id="loose">nothing</div>`;
    const t = resolveTarget(byId('loose'));
    expect(t.kind).toBeNull();
  });

  it('detects images via data-image-id regardless of element nesting', () => {
    mount(`
      <div data-element-key="hero_image" data-section-id="${SECTION_ID}">
        <div data-image-id="${SECTION_ID}.hero_image" id="imgwrap">
          <img id="img" src="x.jpg" />
        </div>
      </div>`);
    const t = resolveTarget(byId('img'));
    expect(t.kind).toBe('element');
    expect(t.sectionId).toBe(SECTION_ID);
    expect(t.node).toBe(byId('imgwrap'));
  });

  it('detects a bare <img> as an image target', () => {
    mount(`<div data-element-key="logo" data-section-id="${SECTION_ID}"><img id="bare" src="y.jpg" /></div>`);
    const t = resolveTarget(byId('bare'));
    expect(t.kind).toBe('element');
    expect(t.node?.tagName).toBe('IMG');
  });
});

describe('getTargetLabel (wired types)', () => {
  it('section → "Section"', () => {
    mount(`<div data-element-key="headline" data-section-id="${SECTION_ID}"><h1>Hi</h1></div>`);
    expect(getTargetLabel(resolveTarget(byId('block-section')))).toBe('Section');
  });

  it('text element → "Text"', () => {
    mount(`<div data-element-key="subheadline" data-section-id="${SECTION_ID}"><p id="p">Hi</p></div>`);
    expect(getTargetLabel(resolveTarget(byId('p')))).toBe('Text');
  });

  it('cta/button key convention → "Button/CTA"', () => {
    mount(`
      <div data-element-key="cta_primary" data-section-id="${SECTION_ID}"><a id="a1">Go</a></div>
      <div data-element-key="secondary_button" data-section-id="${SECTION_ID}"><a id="a2">More</a></div>`);
    expect(getTargetLabel(resolveTarget(byId('a1')))).toBe('Button/CTA');
    expect(getTargetLabel(resolveTarget(byId('a2')))).toBe('Button/CTA');
  });

  it('image → "Image"', () => {
    mount(`
      <div data-element-key="hero_image" data-section-id="${SECTION_ID}">
        <div data-image-id="${SECTION_ID}.hero_image"><img id="img" src="x.jpg" /></div>
      </div>`);
    expect(getTargetLabel(resolveTarget(byId('img')))).toBe('Image');
  });

  it('null target → empty label', () => {
    document.body.innerHTML = `<div id="loose">x</div>`;
    expect(getTargetLabel(resolveTarget(byId('loose')))).toBe('');
  });

  it('data-element-type maps via UNIVERSAL_ELEMENTS (button → Button/CTA even without key convention)', () => {
    mount(`<div data-element-key="offer" data-element-type="button" data-section-id="${SECTION_ID}"><a id="b">X</a></div>`);
    expect(getTargetLabel(resolveTarget(byId('b')))).toBe('Button/CTA');
  });
});

describe('getTargetLabel (placeholder types, phase 4)', () => {
  const HEADER_ID = 'header-abc12345';
  const FOOTER_ID = 'footer-def67890';
  const CONTACT_ID = 'contact-11112222';

  it('header section container → "Header" (not "Section")', () => {
    mountIn(HEADER_ID, `<div data-element-key="cta_text" data-section-id="${HEADER_ID}"><a>Go</a></div>`);
    expect(getTargetLabel(resolveTarget(byId('block-section')))).toBe('Header');
  });

  it('footer section container → "Footer" (not "Section")', () => {
    mountIn(FOOTER_ID, `<div data-element-key="brand_text" data-section-id="${FOOTER_ID}"><span>Studio</span></div>`);
    expect(getTargetLabel(resolveTarget(byId('block-section')))).toBe('Footer');
  });

  it('logo element (Atelier logo_image, an <img>) → "Logo" (wins over Image)', () => {
    mountIn(HEADER_ID, `
      <div data-element-key="logo_image" data-section-id="${HEADER_ID}">
        <div data-image-id="${HEADER_ID}.logo_image"><img id="logo" src="l.png" /></div>
      </div>`);
    expect(getTargetLabel(resolveTarget(byId('logo')))).toBe('Logo');
  });

  it('logo wordmark (logo_text) → "Logo"', () => {
    mountIn(HEADER_ID, `<div data-element-key="logo_text" data-section-id="${HEADER_ID}"><span id="wm">Studio</span></div>`);
    expect(getTargetLabel(resolveTarget(byId('wm')))).toBe('Logo');
  });

  it('logo inside header labels "Logo" NOT "Menu" (precedence)', () => {
    mountIn(HEADER_ID, `<div data-element-key="logo_image" data-section-id="${HEADER_ID}"><span id="l2">L</span></div>`);
    const label = getTargetLabel(resolveTarget(byId('l2')));
    expect(label).toBe('Logo');
    expect(label).not.toBe('Menu');
  });

  it('nav item inside header (nav_items.<id>.label) → "Menu"', () => {
    mountIn(HEADER_ID, `<div data-element-key="nav_items.n1.label" data-section-id="${HEADER_ID}"><span id="nav">Work</span></div>`);
    expect(getTargetLabel(resolveTarget(byId('nav')))).toBe('Menu');
  });

  it('nav-item key convention only fires inside a header section (elsewhere → Text)', () => {
    mount(`<div data-element-key="nav_items.n1.label" data-section-id="${SECTION_ID}"><span id="notmenu">x</span></div>`);
    expect(getTargetLabel(resolveTarget(byId('notmenu')))).toBe('Text');
  });

  it('form field inside a <form> labels "Form" NOT "Text"', () => {
    mountIn(CONTACT_ID, `
      <form class="lg-atelier-form">
        <div data-element-key="submit_button" data-section-id="${CONTACT_ID}"><span id="fld">Send</span></div>
      </form>`);
    expect(getTargetLabel(resolveTarget(byId('fld')))).toBe('Form');
  });

  it('form submit button inside a <form> labels "Form" NOT "Button/CTA"', () => {
    mountIn(CONTACT_ID, `
      <form data-lessgo-form>
        <button data-element-key="cta_submit" data-section-id="${CONTACT_ID}" id="submit">Send</button>
      </form>`);
    expect(getTargetLabel(resolveTarget(byId('submit')))).toBe('Form');
  });

  it('social link (footer social_links.<id>.platform) → "Social bar"', () => {
    mountIn(FOOTER_ID, `<div data-element-key="social_links.s1.platform" data-section-id="${FOOTER_ID}"><span id="soc">Instagram</span></div>`);
    expect(getTargetLabel(resolveTarget(byId('soc')))).toBe('Social bar');
  });

  it('footer link (non-social) still labels "Text" (no Link toolbar; D7 ruling)', () => {
    mountIn(FOOTER_ID, `<div data-element-key="footer_links.f1.label" data-section-id="${FOOTER_ID}"><span id="fl">Privacy</span></div>`);
    expect(getTargetLabel(resolveTarget(byId('fl')))).toBe('Text');
  });

  it('CTA in a header (cta_text, not a form/nav/logo) still labels "Button/CTA"', () => {
    mountIn(HEADER_ID, `<div data-element-key="cta_text" data-section-id="${HEADER_ID}"><a id="hcta">Start</a></div>`);
    expect(getTargetLabel(resolveTarget(byId('hcta')))).toBe('Button/CTA');
  });

  // ── Tightened logo/social matching: substring-only keys must NOT mislabel. ──
  it('logo-wall company_logos (an <img>) → "Image" NOT "Logo"', () => {
    mount(`
      <div data-element-key="company_logos" data-section-id="${SECTION_ID}">
        <div data-image-id="${SECTION_ID}.company_logos"><img id="cl" src="c.png" /></div>
      </div>`);
    const label = getTargetLabel(resolveTarget(byId('cl')));
    expect(label).toBe('Image');
    expect(label).not.toBe('Logo');
  });

  it('logo-wall logo_urls (an <img>) → "Image" NOT "Logo"', () => {
    mount(`
      <div data-element-key="logo_urls" data-section-id="${SECTION_ID}">
        <div data-image-id="${SECTION_ID}.logo_urls"><img id="lu" src="u.png" /></div>
      </div>`);
    const label = getTargetLabel(resolveTarget(byId('lu')));
    expect(label).toBe('Image');
    expect(label).not.toBe('Logo');
  });

  it('testimonial_company_logo text → falls through, NOT "Logo"', () => {
    mount(`<div data-element-key="testimonial_company_logo" data-section-id="${SECTION_ID}"><span id="tcl">Acme</span></div>`);
    const label = getTargetLabel(resolveTarget(byId('tcl')));
    expect(label).toBe('Text');
    expect(label).not.toBe('Logo');
  });

  it('stat metric social_metric_1 → "Text" NOT "Social bar"', () => {
    mount(`<div data-element-key="social_metric_1" data-section-id="${SECTION_ID}"><span id="sm">50K+ Followers</span></div>`);
    const label = getTargetLabel(resolveTarget(byId('sm')));
    expect(label).toBe('Text');
    expect(label).not.toBe('Social bar');
  });

  it('flag show_social_proof → "Text" NOT "Social bar"', () => {
    mount(`<div data-element-key="show_social_proof" data-section-id="${SECTION_ID}"><span id="ssp">on</span></div>`);
    const label = getTargetLabel(resolveTarget(byId('ssp')));
    expect(label).toBe('Text');
    expect(label).not.toBe('Social bar');
  });
});
