// utils/hoverTarget.test.ts — pure resolver + label classifier (jsdom).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveTarget, getTargetLabel } from './hoverTarget';

// Build the REAL edit-canvas nesting shape:
//   section-root wrapper (data-section-root + data-section-id, the EditablePageRenderer root)
//     > block <section data-section-id>            (duplicate id on a nested container)
//        > element wrapper (data-element-key + data-section-id)  (dup id again)
//           > leaf node (the actual hovered content)
const SECTION_ID = 'hero-abc12345';

function mount(html: string): HTMLElement {
  document.body.innerHTML = `
    <div data-section-root="${SECTION_ID}" data-section-id="${SECTION_ID}" id="section-root">
      <section data-section-id="${SECTION_ID}" id="block-section">
        ${html}
      </section>
    </div>`;
  return document.getElementById('section-root') as HTMLElement;
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
