// Parity test: keeps `sharedBlockCapability` provably in sync with BOTH shared-block
// component registries. If someone adds a shared block without declaring its capability
// (or an explicit `null`), CI fails here. This test file MAY import the component
// registries (test-only); production code (capabilities.ts, fit.ts) must not.

import { describe, it, expect } from 'vitest';
import { capabilityIds } from '@/types/brief';
import { sharedBlockRegistry } from './registry';
import { sharedBlockPublishedRegistry } from './registry.published';
import { sharedBlockCapability, sharedBlockCapabilities } from './capabilities';

const sortedKeys = (o: Record<string, unknown>) => Object.keys(o).sort();

describe('sharedBlockCapability declaration', () => {
  it('(a) keys are in sync with both component registries', () => {
    const declared = sortedKeys(sharedBlockCapability);
    expect(declared).toEqual(sortedKeys(sharedBlockRegistry));
    expect(declared).toEqual(sortedKeys(sharedBlockPublishedRegistry));
  });

  it('(b) every non-null value is a valid CapabilityId', () => {
    for (const value of Object.values(sharedBlockCapability)) {
      if (value !== null) {
        expect(capabilityIds).toContain(value);
      }
    }
  });

  it('(c) exact expected contents', () => {
    expect(sharedBlockCapability.leadform).toBe('lead-form');
    expect(sharedBlockCapability.storebadges).toBe('store-badges');
    expect(sharedBlockCapability.followstrip).toBeNull();

    expect(sharedBlockCapabilities).toContain('lead-form');
    expect(sharedBlockCapabilities).toContain('store-badges');
    // followstrip has no capability id → contributes nothing
    expect(sharedBlockCapabilities).toHaveLength(2);
  });

  it('sharedBlockCapabilities are deduped and in canonical capabilityIds order', () => {
    const canonical = capabilityIds.filter((id) => sharedBlockCapabilities.includes(id));
    expect([...sharedBlockCapabilities]).toEqual(canonical);
  });
});
