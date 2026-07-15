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
// This phase wires only: Section, Text, Button/CTA, Image.

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
 * Classify a resolved target to its toolbarPlan label (D7 vocabulary).
 * Wired types this phase: `Section`, `Text`, `Button/CTA`, `Image`.
 * Returns '' for a null (non-selectable) target.
 */
export function getTargetLabel(target: HoverTarget): string {
  if (!target || target.kind === null) return '';
  if (target.kind === 'section') return 'Section';

  const node = target.node;
  const key = (target.elementKey ?? '').toLowerCase();

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
