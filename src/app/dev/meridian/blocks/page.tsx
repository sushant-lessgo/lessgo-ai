// src/app/dev/meridian/blocks/page.tsx
// Meridian verification gallery — renders all 7 Meridian pilot blocks (edit +
// published) from design-reference mock content, across palettes + variants.
// Internal-only (/dev/* convention; blocked in production by middleware).
//
// template-factory phase 7: re-pointed to the generic stage (via the slimmed
// MeridianBlocksStage wrapper) so this historical URL — asserted by
// e2e/render.spec.ts — keeps mounting. The old SSR-safe shell
// (MeridianBlocksClient) is superseded; the generic stage self-gates its store
// subtree to client-only, so no dynamic({ ssr:false }) shell is needed here.

import '@/styles/fonts-self-hosted.css';
import MeridianBlocksStage from './MeridianBlocksStage';

export const metadata = {
  title: 'Meridian blocks · /dev',
  robots: { index: false, follow: false },
};

export default function MeridianBlocksPage() {
  return <MeridianBlocksStage />;
}
