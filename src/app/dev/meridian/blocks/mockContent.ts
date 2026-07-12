// src/app/dev/meridian/blocks/mockContent.ts
// THIN RE-EXPORT (template-factory phase 2). The Meridian block mocks moved to
// the canonical shared home `src/modules/templates/blockMocks/meridian.ts` so ONE
// source feeds the /dev gallery, the render-parity test, the editor-basics
// conformance subset, and the phase-7 screenshot parity harness. This shim keeps
// `MeridianBlocksStage.tsx`'s existing import path working unchanged.

export type { MeridianMockEntry } from '@/modules/templates/blockMocks/meridian';
export { MERIDIAN_BLOCK_MOCKS } from '@/modules/templates/blockMocks/meridian';
