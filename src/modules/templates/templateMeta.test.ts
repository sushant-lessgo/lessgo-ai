// src/modules/templates/templateMeta.test.ts
// Shape/vocabulary tests for the static template metadata (scale-01 phase 3).
// The heavier resolver-backed conformance tests (§6a engine-core, §6b
// capability evidence) land in phase 4 (conformance.test.ts); this file only
// proves the declarations are well-formed against the closed vocabularies.

import { describe, it, expect } from 'vitest';
import { templateMeta, templateHasCapability } from './templateMeta';
import { engineCoreSections } from '@/modules/engines/coreSections';
import { templateIds } from '@/types/service';
import { copyEngines, capabilityIds } from '@/types/brief';
import type { CapabilityId } from '@/types/brief';

// Structural capabilities are trust-on-declaration (page-menu machinery /
// twin-fields, not blocks) — everything else must be evidenced by a section.
const STRUCTURAL_CAPABILITIES: readonly CapabilityId[] = ['multipage', 'bilingual'];

describe('templateMeta', () => {
  it('has exactly the registry templateIds as keys (9)', () => {
    expect(Object.keys(templateMeta).sort()).toEqual([...templateIds].sort());
    // 9 = the 9 classic templates (the work-skeleton dev staging id was retired
    // at atelier-skeleton-cutover — atelier is now skeleton-backed).
    expect(Object.keys(templateMeta)).toHaveLength(9);
  });

  it('has exactly 8 non-retired templates', () => {
    const nonRetired = Object.values(templateMeta).filter((m) => m.retired !== true);
    // 8 = 8 classic non-retired (techpremium retired).
    expect(nonRetired).toHaveLength(8);
  });

  it('flags lumen bespoke and techpremium retired (and nobody else)', () => {
    expect(templateMeta.lumen.bespoke).toBe(true);
    expect(templateMeta.techpremium.retired).toBe(true);
    const bespokeIds = ['lumen'];
    for (const [id, meta] of Object.entries(templateMeta)) {
      if (!bespokeIds.includes(id)) expect(meta.bespoke).toBeUndefined();
      if (id !== 'techpremium') expect(meta.retired).toBeUndefined();
    }
  });

  it('techpremium (retired) declares empty engine/capability/style lists', () => {
    expect(templateMeta.techpremium.copyEngines).toEqual([]);
    expect(templateMeta.techpremium.capabilities).toEqual([]);
    expect(templateMeta.techpremium.designStyles).toEqual([]);
  });

  it('every declared capability is in the closed capability vocab', () => {
    for (const meta of Object.values(templateMeta)) {
      for (const cap of meta.capabilities) {
        expect(capabilityIds).toContain(cap);
      }
    }
  });

  it('every declared engine is in the closed copy-engine vocab', () => {
    for (const meta of Object.values(templateMeta)) {
      for (const engine of meta.copyEngines) {
        expect(copyEngines).toContain(engine);
      }
    }
  });

  it('every block-backed declared capability has a capabilitySections evidence entry', () => {
    for (const [id, meta] of Object.entries(templateMeta)) {
      for (const cap of meta.capabilities) {
        if (STRUCTURAL_CAPABILITIES.includes(cap)) continue;
        const evidence = meta.capabilitySections?.[cap];
        expect(evidence, `${id} declares block-backed '${cap}' without evidence`).toBeTruthy();
      }
    }
  });

  it('granth declares no capabilities (no blog blocks exist)', () => {
    expect(templateMeta.granth.capabilities).toEqual([]);
  });
});

describe('templateHasCapability', () => {
  it('atelier (skeleton-backed) has the works capability', () => {
    // Post atelier-skeleton-cutover: atelier rides the work-skeleton and declares
    // `works`. The works fan-out (workcatalog + page-<slug> item pages) lives here.
    expect(templateHasCapability('atelier', 'works')).toBe(true);
  });

  it('a non-works template does NOT have works (the isWorkCopyTemplate trap — decision 7)', () => {
    // hearth is a trust-engine template that declares lead-form, NOT works — so the
    // board must reject it. The helper gates on the works CAPABILITY, not on the
    // work copy engine; this asymmetry is the whole reason it exists.
    expect(templateHasCapability('hearth', 'works')).toBe(false);
  });

  it('unknown / null / undefined ids → false (never throws)', () => {
    expect(templateHasCapability('not-a-template', 'works')).toBe(false);
    expect(templateHasCapability(null, 'works')).toBe(false);
    expect(templateHasCapability(undefined, 'works')).toBe(false);
  });

  it('probes any declared capability, not just works', () => {
    expect(templateHasCapability('meridian', 'lead-form')).toBe(true);
    expect(templateHasCapability('meridian', 'works')).toBe(false);
  });
});

describe('engineCoreSections', () => {
  it('covers exactly the closed copy-engine vocab', () => {
    expect(Object.keys(engineCoreSections).sort()).toEqual([...copyEngines].sort());
  });

  it('freezes the D-A section sets exactly', () => {
    expect(engineCoreSections.thing).toEqual([
      'header', 'hero', 'features', 'testimonials', 'footer',
    ]);
    expect(engineCoreSections.trust).toEqual([
      'header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer',
    ]);
    expect(engineCoreSections.work).toEqual([
      'hero', 'work', 'about', 'footer',
    ]);
  });
});
