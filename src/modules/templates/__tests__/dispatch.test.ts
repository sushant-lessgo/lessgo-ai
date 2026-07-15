// Cross-template block dispatch (A1: keyed by section TYPE).
//
// Each template owns one block per section type. The section-type vocabulary
// DIVERGES across audiences: service templates (Hearth/Lex) use services/packages;
// the product template (Meridian) uses features/pricing. Generation must emit the
// matching vocabulary or dispatch silently falls back to the placeholder — a
// broken-but-not-crashing section. These tests pin each template's vocabulary and
// the placeholder safety net.

import { resolveServiceBlock as resolveHearth } from '@/modules/templates/hearth/resolveServiceBlock';
import { ServicePlaceholderBlock } from '@/modules/templates/hearth/ServicePlaceholderBlock';
import { resolveServiceBlock as resolveLex } from '@/modules/templates/lex/resolveServiceBlock';
import { LexPlaceholderBlock } from '@/modules/templates/lex/LexPlaceholderBlock';
import { resolveMeridianBlock } from '@/modules/templates/meridian/resolveMeridianBlock';
import { MeridianPlaceholderBlock } from '@/modules/templates/meridian/MeridianPlaceholderBlock';
import { resolveWorkBlock } from '@/modules/skeletons/work/resolveWorkBlock';
import { WorkPlaceholderBlock } from '@/modules/skeletons/work/WorkPlaceholderBlock';

type Resolver = (sectionType: string, mode?: 'edit' | 'published') => any;

const TEMPLATES: Array<{
  name: string;
  resolve: Resolver;
  placeholder: any;
  sections: string[];
}> = [
  {
    name: 'hearth',
    resolve: resolveHearth as Resolver,
    placeholder: ServicePlaceholderBlock,
    sections: ['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer'],
  },
  {
    name: 'lex',
    resolve: resolveLex as Resolver,
    placeholder: LexPlaceholderBlock,
    sections: ['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer'],
  },
  {
    name: 'meridian',
    resolve: resolveMeridianBlock as Resolver,
    placeholder: MeridianPlaceholderBlock,
    sections: ['header', 'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer'],
  },
  {
    // Work-skeleton (Atelier skin, dev id atelier2). Phase-4 pilot Home slice:
    // gallery is section type `work`; proof default shape = testimonials.
    name: 'atelier2 (work skeleton)',
    resolve: resolveWorkBlock as Resolver,
    placeholder: WorkPlaceholderBlock,
    sections: ['header', 'hero', 'work', 'proof', 'contact', 'footer'],
  },
];

describe.each(TEMPLATES)('$name dispatch', ({ resolve, placeholder, sections, name }) => {
  it('resolves a real component for every section in both modes', () => {
    for (const type of sections) {
      const edit = resolve(type, 'edit');
      const published = resolve(type, 'published');
      expect(edit, `${name}.${type} edit`).toBeTruthy();
      expect(published, `${name}.${type} published`).toBeTruthy();
      expect(edit).not.toBe(placeholder);
      expect(published).not.toBe(placeholder);
    }
  });

  it('edit and published components differ per section', () => {
    for (const type of sections) {
      expect(resolve(type, 'edit'), name + '.' + type).not.toBe(resolve(type, 'published'));
    }
  });

  it('is case-insensitive and defaults to edit mode', () => {
    expect(resolve('HERO', 'edit')).toBe(resolve('hero', 'edit'));
    expect(resolve('hero')).toBe(resolve('hero', 'edit'));
  });

  it('falls back to placeholder for unknown / empty section types (no crash)', () => {
    expect(resolve('does-not-exist', 'edit')).toBe(placeholder);
    expect(resolve('', 'edit')).toBe(placeholder);
  });
});

describe('cross-template vocabulary divergence', () => {
  it('service vocabulary (services/packages) is NOT valid on the product template', () => {
    // Meridian expects features/pricing — feeding it service keys must fall back.
    expect(resolveMeridianBlock('services', 'edit')).toBe(MeridianPlaceholderBlock);
    expect(resolveMeridianBlock('packages', 'edit')).toBe(MeridianPlaceholderBlock);
  });

  it('product vocabulary (features/pricing) is NOT valid on service templates', () => {
    expect(resolveHearth('features', 'edit')).toBe(ServicePlaceholderBlock);
    expect(resolveHearth('pricing', 'edit')).toBe(ServicePlaceholderBlock);
    expect(resolveLex('features', 'edit')).toBe(LexPlaceholderBlock);
    expect(resolveLex('pricing', 'edit')).toBe(LexPlaceholderBlock);
  });
});
