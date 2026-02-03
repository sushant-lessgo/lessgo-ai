 ❌ Issues to Fix

  1. Missing API route

  Verification mentions /api/images/search but it's not in "Files to Create". Pexels calls need server-side route to protect API key.

  Files to Create:
    + src/app/api/images/search/route.ts  ← MISSING

  2. UIBlock name casing inconsistent

  // Plan has mixed casing:
  'leftCopyRightImage'     // camelCase
  'SplitCard'              // PascalCase
  'VisualCTAWithMockup'    // PascalCase

  Should match component registry exactly. Verify actual names.


  4. understanding.categories availability

  Is this in GeneratingStep's scope? Need to verify. Might need:
  const categories = useGenerationStore((s) => s.understanding?.categories);

  5. No rate limit handling for parallel calls

  4-5 simultaneous Pexels requests could trigger 429. Add small stagger:
  // Stagger by 100ms each
  await Promise.all(slots.map((slot, i) =>
    delay(i * 100).then(() => fetchImage(slot))
  ));
