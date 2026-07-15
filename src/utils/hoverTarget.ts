// utils/hoverTarget.ts — shared, pure target resolution + label vocabulary.
//
// This is the ONE DOM-resolution core used by BOTH the click path
// (`useEditor.determineClickTarget`) and the hover affordance
// (`HoverOverlay`). Deriving the hover label from the SAME resolution the
// click uses makes the hover-label ↔ resulting-toolbar mapping 1:1 by
// construction (plan D4), not by parallel reimplementation.
//
// PURE MODULE — no store imports, no React. jsdom-testable. Store-state guards
// (isTextEditing / toolbar.type) stay in `useEditor`; this module only reads DOM.
//
// Label vocabulary is the toolbarPlan action-list verbatim (plan D7). Labels are
// FORWARD vocabulary: a target may be labelled with a toolbar name whose toolbar
// isn't wired yet (placeholder types, phase 4) — clicking keeps today's behavior.
//
// WIRED types (their own toolbar exists today): Section, Text, Button/CTA, Image.
// PLACEHOLDER types (phase 4 — LABEL ONLY, no toolbar wired): Header, Footer, Logo,
// Menu, Form, Social bar. Clicking a placeholder-labelled target keeps TODAY's
// behavior — whatever toolbar currently fires for that node (e.g. a header nav item
// still opens today's element/text toolbar; the section background still opens the
// SectionToolbar). The placeholder labels are forward vocabulary ONLY so that when
// the toolbarPlan track lands the real Header/Footer/Logo/Menu/Form/Social toolbars,
// it relabels nothing here — the vocabulary already matches. No dispatch changes.
//
// Placeholder classification is TEMPLATE-AGNOSTIC — driven by attribute/key/section
// conventions shared across templates (verified against Atelier), never per-template
// hardcoding. Precedence (plan D7): specific placeholder rules > Image / Button/CTA
// conventions > Text; and section placeholders (Header/Footer) > generic Section.

import { UNIVERSAL_ELEMENTS, type UniversalElementType } from '@/types/universalElements';

export interface HoverTarget {
  kind: 'element' | 'section' | null;
  sectionId: string | null;
  elementKey: string | null;
  node: HTMLElement | null;
}

/**
 * Resolve a hovered/clicked DOM node to its editable target.
 *
 * Mirrors the DOM core of `determineClickTarget`:
 *  - toolbar guard (`[data-toolbar-type]`) → null target (never selectable)
 *  - image detection (`[data-image-id]` / `<img>`) → element target on the image
 *  - closest `[data-element-key]` wins, else the closest section container
 *
 * Section resolution PREFERS the canonical `[data-section-root]` marker
 * (phase-1, exactly one per section) with a fallback to legacy `[data-section-id]`
 * (duplicated across nested wrappers). Because every node in a section shares the
 * SAME section id value, duplicate `data-section-id` stamping can never yield more
 * than one distinct section target.
 */
export function resolveTarget(node: HTMLElement): HoverTarget {
  const nil: HoverTarget = { kind: null, sectionId: null, elementKey: null, node: null };
  if (!node || typeof node.closest !== 'function') return nil;

  // Toolbar chrome is never an editable target.
  if (node.closest('[data-toolbar-type]')) return nil;

  const resolveSectionId = (from: HTMLElement | null): { el: HTMLElement | null; id: string | null } => {
    const el =
      (from?.closest('[data-section-root]') as HTMLElement | null) ??
      (from?.closest('[data-section-id]') as HTMLElement | null) ??
      null;
    const id = el
      ? el.getAttribute('data-section-root') ?? el.getAttribute('data-section-id')
      : null;
    return { el, id };
  };

  // Image detection first (mirrors the click-path `[data-image-id]` contract) so a
  // hovered image labels as `Image` regardless of element-key nesting.
  const imageEl =
    (node.closest('[data-image-id]') as HTMLElement | null) ??
    (node.closest('img') as HTMLElement | null);
  if (imageEl) {
    const { id } = resolveSectionId(imageEl);
    const elKeyNode = node.closest('[data-element-key]') as HTMLElement | null;
    return {
      kind: 'element',
      sectionId: id,
      elementKey: elKeyNode?.getAttribute('data-element-key') ?? null,
      node: imageEl,
    };
  }

  const elementWithKey = node.closest('[data-element-key]') as HTMLElement | null;
  const { el: sectionEl, id: sectionId } = resolveSectionId(node);

  if (!sectionEl) return { kind: null, sectionId: null, elementKey: null, node };

  if (elementWithKey && sectionEl.contains(elementWithKey)) {
    return {
      kind: 'element',
      sectionId,
      elementKey: elementWithKey.getAttribute('data-element-key'),
      node: elementWithKey,
    };
  }

  return { kind: 'section', sectionId, elementKey: null, node: sectionEl };
}

function isImageNode(node: HTMLElement | null): boolean {
  if (!node) return false;
  if (node.tagName === 'IMG') return true;
  if (typeof node.hasAttribute === 'function' && node.hasAttribute('data-image-id')) return true;
  return false;
}

/**
 * The section TYPE segment of a `${type}-${uuid}` section id (e.g. `header-abc123`
 * → `header`). Empty for a null/malformed id. Template-agnostic — every audience/
 * template stamps section ids in this convention.
 */
function sectionTypeOf(sectionId: string | null): string {
  if (!sectionId) return '';
  const dash = sectionId.indexOf('-');
  return (dash === -1 ? sectionId : sectionId.slice(0, dash)).toLowerCase();
}

/**
 * Site-scoped BRAND-logo primitive key convention. Verified: Atelier header/footer
 * render the logo via `E.Img elementKey="logo_image"` / `E.Txt elementKey="logo_text"`
 * (`AtelierNavHeader.core.tsx`, `resolveLogo.ts`); other templates use `logo` /
 * `nav_logo`.
 *
 * Anchored to the brand-logo primitive shape — the whole key (or, for dotted paths,
 * its last segment) is `logo`/`nav_logo` optionally suffixed by a single primitive
 * word (`_image`/`_text`/…). This must NOT fire for logo-WALL / company-logos
 * collections that merely CONTAIN the substring `logo`, which are ordinary
 * Image/Text targets: `company_logos`, `logo_urls`, `testimonial_company_logo`
 * (`defaultPlaceholders.ts`). Template-agnostic — a convention set, not per-template.
 */
function isLogoKey(key: string): boolean {
  const seg = key.split('.').pop() ?? key;
  return /^(nav_)?logo(_(image|text|icon|svg|src|mark|wordmark))?$/.test(seg);
}

/**
 * Social-BAR key convention: the `social_links.<id>.*` collection (Atelier footer).
 * Anchored to that collection path so it does NOT fire for stat/metric keys that
 * merely CONTAIN `social` — `social_metric_1..4`, `show_social_proof`
 * (`defaultPlaceholders.ts`) — which are ordinary Text targets.
 */
function isSocialKey(key: string): boolean {
  return /^social_links(\.|$)/.test(key);
}

/** Nav-item key convention (Atelier header `nav_items.<id>.label|href`). */
function isNavItemKey(key: string): boolean {
  return key.includes('nav_item');
}

/**
 * Classify a resolved target to its toolbarPlan label (D7 vocabulary).
 * WIRED types: `Section`, `Text`, `Button/CTA`, `Image`.
 * PLACEHOLDER types (label-only, no toolbar): `Header`, `Footer`, `Logo`, `Menu`,
 * `Form`, `Social bar`. Placeholder rules are checked FIRST (plan D7 precedence).
 * Returns '' for a null (non-selectable) target.
 */
export function getTargetLabel(target: HoverTarget): string {
  if (!target || target.kind === null) return '';

  const node = target.node;
  const key = (target.elementKey ?? '').toLowerCase();
  const sectionType = sectionTypeOf(target.sectionId);

  // ── Section-level: placeholder section types win over generic `Section`. ──
  if (target.kind === 'section') {
    if (sectionType === 'header') return 'Header';
    if (sectionType === 'footer') return 'Footer';
    return 'Section';
  }

  // ── Element-level placeholder rules — checked BEFORE Image / Button/CTA / Text. ──
  // Logo before Image: the resolved logo is an <img> on header/footer, but its key
  // convention marks it as the (forthcoming) Logo toolbar's target.
  if (isLogoKey(key)) return 'Logo';
  // Social bar (footer social-links convention).
  if (isSocialKey(key)) return 'Social bar';
  // Menu — nav items, only inside a header section (mirrors the header nav grammar;
  // a `nav_item*` key elsewhere would not be a menu). Logo already returned above,
  // so a logo inside the header can never fall through to Menu.
  if (sectionType === 'header' && isNavItemKey(key)) return 'Menu';
  // Form — any element inside a <form> (edit preview `<form class="lg-atelier-form">`,
  // published `<form data-lessgo-form>`, or the shared `FormRenderer` <form>): fields
  // and the submit button both label `Form`, never `Text`/`Button/CTA`.
  if (node && typeof node.closest === 'function' && node.closest('form')) return 'Form';

  // Image wins (mirrors the click-path data-image-id early-return contract).
  if (isImageNode(node)) return 'Image';

  // Prefer an explicit `data-element-type` mapped via UNIVERSAL_ELEMENTS — covers
  // manually-added universal elements. (Attr is debug-only on AI blocks, so this is
  // best-effort; key conventions below are the fallback.)
  const et = node?.getAttribute?.('data-element-type') as UniversalElementType | null;
  const cfg = et && et in UNIVERSAL_ELEMENTS ? UNIVERSAL_ELEMENTS[et] : undefined;
  if (cfg) {
    if (cfg.toolbarType === 'image') return 'Image';
    if (et === 'button') return 'Button/CTA';
    if (cfg.category === 'text') return 'Text';
  }

  // Key conventions (same `*="cta"` / `*="button"` convention globals.css relies on).
  if (key.includes('cta') || key.includes('button')) return 'Button/CTA';

  return 'Text';
}
