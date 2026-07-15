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

// ── work-skeleton (atelier2) layout-library variants (phase 6) ───────────────
// The variant-aware resolveWorkBlock(sectionType, mode, layoutName) resolves each
// built layout. Header arrangements share ONE dispatcher (internal dispatch → SAME
// component as the default); hero/gallery/proof arrangements are DISTINCT components.
describe('work-skeleton layout-library dispatch (atelier2)', () => {
  const modes: Array<'edit' | 'published'> = ['edit', 'published'];

  it('header: all 5 arrangements resolve to the SAME component as the default (internal dispatch)', () => {
    const arrangements = ['WorkHeader', 'WorkHeaderStart', 'WorkHeaderCentered', 'WorkHeaderSplit', 'WorkHeaderMinimal'];
    for (const mode of modes) {
      const def = resolveWorkBlock('header', mode, 'WorkHeader');
      expect(def).toBeTruthy();
      expect(def).not.toBe(WorkPlaceholderBlock);
      for (const ln of arrangements) {
        expect(resolveWorkBlock('header', mode, ln), `header/${ln} (${mode})`).toBe(def);
      }
    }
  });

  it('hero: image/split/center are DISTINCT components from the slider default', () => {
    for (const mode of modes) {
      const def = resolveWorkBlock('hero', mode, 'WorkHeroSlider');
      for (const ln of ['WorkHeroImage', 'WorkHeroSplit', 'WorkHeroCenter']) {
        const v = resolveWorkBlock('hero', mode, ln);
        expect(v, `hero/${ln} (${mode})`).toBeTruthy();
        expect(v).not.toBe(WorkPlaceholderBlock);
        expect(v, `hero/${ln} distinct from default (${mode})`).not.toBe(def);
      }
    }
  });

  it('work/gallery: masonry/strip are DISTINCT components from the grid default', () => {
    for (const mode of modes) {
      const def = resolveWorkBlock('work', mode, 'WorkGalleryGrid');
      for (const ln of ['WorkGalleryMasonry', 'WorkGalleryStrip']) {
        const v = resolveWorkBlock('work', mode, ln);
        expect(v, `work/${ln} (${mode})`).toBeTruthy();
        expect(v).not.toBe(WorkPlaceholderBlock);
        expect(v, `work/${ln} distinct from default (${mode})`).not.toBe(def);
      }
    }
  });

  it('proof: logos/results are DISTINCT components from the testimonials default', () => {
    for (const mode of modes) {
      const def = resolveWorkBlock('proof', mode, 'WorkProofTestimonials');
      for (const ln of ['WorkProofLogos', 'WorkProofResults']) {
        const v = resolveWorkBlock('proof', mode, ln);
        expect(v, `proof/${ln} (${mode})`).toBeTruthy();
        expect(v).not.toBe(WorkPlaceholderBlock);
        expect(v, `proof/${ln} distinct from default (${mode})`).not.toBe(def);
      }
    }
  });

  it('edit and published differ for every new variant', () => {
    const layouts = [
      ['hero', 'WorkHeroImage'], ['hero', 'WorkHeroSplit'], ['hero', 'WorkHeroCenter'],
      ['work', 'WorkGalleryMasonry'], ['work', 'WorkGalleryStrip'],
      ['proof', 'WorkProofLogos'], ['proof', 'WorkProofResults'],
      ['header', 'WorkHeaderCentered'],
    ] as const;
    for (const [type, ln] of layouts) {
      expect(resolveWorkBlock(type, 'edit', ln), `${type}/${ln}`).not.toBe(
        resolveWorkBlock(type, 'published', ln),
      );
    }
  });

  it('WorkHeroVideo SLOT has no component → falls back to the hero default', () => {
    // The slot is not registered (no component); an unknown layout name resolves to
    // the section default (A1 guardrail), NOT the placeholder.
    for (const mode of modes) {
      expect(resolveWorkBlock('hero', mode, 'WorkHeroVideo')).toBe(
        resolveWorkBlock('hero', mode, 'WorkHeroSlider'),
      );
    }
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
