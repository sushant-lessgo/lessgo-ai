// src/modules/templates/templateMeta.test.ts
// Shape/vocabulary tests for the static template metadata (scale-01 phase 3).
// The heavier resolver-backed conformance tests (§6a engine-core, §6b
// capability evidence) land in phase 4 (conformance.test.ts); this file only
// proves the declarations are well-formed against the closed vocabularies.

import { describe, it, expect } from 'vitest';
import { templateMeta } from './templateMeta';
import { engineCoreSections } from '@/modules/engines/coreSections';
import { templateIds } from '@/types/service';
import { copyEngines, capabilityIds } from '@/types/brief';
import type { CapabilityId } from '@/types/brief';

// Structural capabilities are trust-on-declaration (page-menu machinery /
// twin-fields, not blocks) — everything else must be evidenced by a section.
const STRUCTURAL_CAPABILITIES: readonly CapabilityId[] = ['multipage', 'bilingual'];

describe('templateMeta', () => {
  it('has exactly the registry templateIds as keys (8)', () => {
    expect(Object.keys(templateMeta).sort()).toEqual([...templateIds].sort());
    expect(Object.keys(templateMeta)).toHaveLength(8);
  });

  it('has exactly 7 non-retired templates', () => {
    const nonRetired = Object.values(templateMeta).filter((m) => m.retired !== true);
    expect(nonRetired).toHaveLength(7);
  });

  it('flags lumen bespoke and techpremium retired (and nobody else)', () => {
    expect(templateMeta.lumen.bespoke).toBe(true);
    expect(templateMeta.techpremium.retired).toBe(true);
    for (const [id, meta] of Object.entries(templateMeta)) {
      if (id !== 'lumen') expect(meta.bespoke).toBeUndefined();
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
      'hero', 'about', 'books', 'writing', 'praise', 'footer',
    ]);
  });
});
